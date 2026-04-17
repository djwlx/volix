import path from 'path';
import {
  type AnalyzeOpenlistAiOrganizerPayload,
  type AnalyzeOpenlistAiOrganizerResponse,
  type ExecuteOpenlistAiOrganizerPayload,
  type ExecuteOpenlistAiOrganizerResponse,
  type OpenlistAiOrganizerBrowseResponse,
  type OpenlistAiOrganizerPlanItem,
} from '@volix/types';
import type { OpenlistFsObject, OpenlistSdk } from '../../../sdk/openlist/create-openlist.sdk';
import { createOpenlistSdk } from '../../../sdk';
import { badRequest } from '../../shared/http-handler';
import { getOpenlistAccountConfig } from '../../anime-subscription/service/anime-config.service';
import { ensureOpenlistDirExists } from '../../anime-subscription/service/anime-library.service';
import { runAiOpenlistFolderOrganizeTool } from '../../ai/service/openlist-folder-organize.service';

const DEFAULT_DUPLICATE_FOLDER_NAME = '__AI_DUPLICATES_PENDING__';
const SAMPLE_PATH_LIMIT = 12;
const EXTENSION_LIMIT = 8;
const CHUNK_SIZE = 12;
const RETRIEVAL_PER_ITEM = 5;
const RETRIEVED_ITEM_LIMIT = 20;

interface OrganizerTreeNode {
  id: string;
  parentId?: string;
  path: string;
  relativePath: string;
  name: string;
  parentPath: string;
  itemType: 'file' | 'directory';
  depth: number;
  selfSize: number;
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  maxDepth: number;
  samplePaths: string[];
  extensionStats: string[];
  childIds: string[];
}

interface IndexedOrganizerTreeNode extends OrganizerTreeNode {
  retrievalText: string;
  retrievalTokens: string[];
}

interface DirectoryReader {
  read: (currentPath: string, options?: { forceRefresh?: boolean }) => Promise<OpenlistFsObject[]>;
}

interface PathMapping {
  sourcePrefix: string;
  targetPrefix: string;
}

const normalizeOpenlistPath = (value: string) => {
  const text = String(value || '').trim();
  if (!text) {
    return '/';
  }
  const normalized = path.posix.normalize(text);
  if (!normalized || normalized === '.') {
    return '/';
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const normalizeDuplicateFolderName = (value?: string) => {
  const text = String(value || '')
    .trim()
    .replace(/[\\/]/g, '_');
  return text || DEFAULT_DUPLICATE_FOLDER_NAME;
};

const toRelativePath = (rootPath: string, targetPath: string) => {
  const relative = path.posix.relative(rootPath, targetPath);
  return relative || '.';
};

const chunk = <T>(list: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < list.length; index += size) {
    result.push(list.slice(index, index + size));
  }
  return result;
};

const normalizeTokenText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[._\-()[\]【】（）]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) =>
  normalizeTokenText(value)
    .split(' ')
    .map(item => item.trim())
    .filter(item => item.length >= 2)
    .slice(0, 80);

const formatExtensionStats = (extensionMap: Map<string, number>) => {
  return Array.from(extensionMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, EXTENSION_LIMIT)
    .map(([ext, count]) => `${ext}:${count}`);
};

const buildRetrievalText = (item: OrganizerTreeNode) =>
  [
    item.name,
    item.relativePath,
    item.path,
    item.itemType,
    item.extensionStats.join(' '),
    item.samplePaths.join(' '),
    `${item.totalFiles} files`,
    `${item.totalDirs} dirs`,
    `${item.depth} depth`,
  ]
    .filter(Boolean)
    .join(' ');

const toIndexedNode = (item: OrganizerTreeNode): IndexedOrganizerTreeNode => {
  const retrievalText = buildRetrievalText(item);
  return {
    ...item,
    retrievalText,
    retrievalTokens: tokenize(retrievalText),
  };
};

const computeSimilarityScore = (source: IndexedOrganizerTreeNode, candidate: IndexedOrganizerTreeNode) => {
  if (source.id === candidate.id) {
    return 0;
  }

  const sourceTokenSet = new Set(source.retrievalTokens);
  const candidateTokenSet = new Set(candidate.retrievalTokens);
  let overlap = 0;
  for (const token of sourceTokenSet) {
    if (candidateTokenSet.has(token)) {
      overlap += 1;
    }
  }

  const sourceName = normalizeTokenText(source.name);
  const candidateName = normalizeTokenText(candidate.name);
  const extensionOverlap = source.extensionStats.filter(item => candidate.extensionStats.includes(item)).length;
  const sameTypeScore = source.itemType === candidate.itemType ? 1.5 : 0;
  const parentScore = source.parentId && source.parentId === candidate.parentId ? 2 : 0;
  const nameContainScore =
    sourceName && candidateName && (sourceName.includes(candidateName) || candidateName.includes(sourceName)) ? 4 : 0;
  const sizeBase = Math.max(source.totalSize, candidate.totalSize, 1);
  const sizeDeltaRatio = Math.abs(source.totalSize - candidate.totalSize) / sizeBase;
  const sizeScore = sizeDeltaRatio <= 0.08 ? 2 : sizeDeltaRatio <= 0.2 ? 1 : 0;

  return overlap * 2 + extensionOverlap * 2 + sameTypeScore + parentScore + nameContainScore + sizeScore;
};

const buildGlobalOverview = (items: IndexedOrganizerTreeNode[], totalEntries: number, rootPath: string) => {
  const dirCount = items.filter(item => item.itemType === 'directory').length;
  const fileCount = items.length - dirCount;
  const topLevelCount = items.filter(item => item.depth === 1).length;
  const extensionCounts = new Map<string, number>();

  for (const item of items) {
    for (const extStat of item.extensionStats) {
      const [ext, countText] = extStat.split(':');
      const count = Number(countText || 0);
      if (!ext || !count) {
        continue;
      }
      extensionCounts.set(ext, (extensionCounts.get(ext) || 0) + count);
    }
  }

  const topExtensions = Array.from(extensionCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([ext, count]) => `${ext}:${count}`);

  return [
    `当前分析目录: ${rootPath}`,
    `总计划节点数: ${items.length}，其中顶层项目 ${topLevelCount}，目录 ${dirCount}，文件 ${fileCount}`,
    `递归总条目数: ${totalEntries}`,
    topExtensions.length > 0 ? `全局常见扩展名分布: ${topExtensions.join(', ')}` : '',
    '当前任务会对整棵目录树中的目录和文件生成细粒度整理计划。你只需要输出本批 chunk 中的 items 结果。',
  ].filter(Boolean);
};

const buildRetrievedContext = (chunkItems: IndexedOrganizerTreeNode[], allItems: IndexedOrganizerTreeNode[]) => {
  const chunkIds = new Set(chunkItems.map(item => item.id));
  const retrievedMap = new Map<string, IndexedOrganizerTreeNode>();

  for (const source of chunkItems) {
    const relatedCandidates = allItems
      .filter(candidate => !chunkIds.has(candidate.id))
      .map(candidate => ({
        item: candidate,
        score: computeSimilarityScore(source, candidate),
      }))
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.item.path.localeCompare(b.item.path))
      .slice(0, RETRIEVAL_PER_ITEM);

    for (const candidate of relatedCandidates) {
      if (!retrievedMap.has(candidate.item.id)) {
        retrievedMap.set(candidate.item.id, candidate.item);
      }
      if (retrievedMap.size >= RETRIEVED_ITEM_LIMIT) {
        break;
      }
    }

    if (retrievedMap.size >= RETRIEVED_ITEM_LIMIT) {
      break;
    }
  }

  return Array.from(retrievedMap.values());
};

const getOpenlistSdk = async () => {
  const account = await getOpenlistAccountConfig();
  const sdk = createOpenlistSdk({ apiHost: account.baseUrl });
  await sdk.loginWithHashedPassword(account.username, account.password);
  return sdk;
};

const createDirectoryReader = (sdk: OpenlistSdk): DirectoryReader => {
  const cache = new Map<string, OpenlistFsObject[]>();
  const inflight = new Map<string, Promise<OpenlistFsObject[]>>();

  const read = async (currentPath: string, options?: { forceRefresh?: boolean }) => {
    const cacheKey = normalizeOpenlistPath(currentPath);
    if (!options?.forceRefresh && cache.has(cacheKey)) {
      return cache.get(cacheKey) || [];
    }

    const existingRequest = inflight.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    const request = sdk
      .listFs({
        path: cacheKey,
        refresh: Boolean(options?.forceRefresh),
      })
      .then(list =>
        (list.content || []).sort((a, b) => Number(b.is_dir) - Number(a.is_dir) || a.name.localeCompare(b.name))
      )
      .then(entries => {
        cache.set(cacheKey, entries);
        return entries;
      })
      .finally(() => {
        inflight.delete(cacheKey);
      });

    inflight.set(cacheKey, request);
    return request;
  };

  return {
    read,
  };
};

const scanOrganizerTree = async (reader: DirectoryReader, rootPath: string, duplicateFolderPath: string) => {
  const nodes = new Map<string, OrganizerTreeNode>();

  const walk = async (currentPath: string, depth: number, parentId?: string): Promise<OrganizerTreeNode> => {
    let childEntries: OpenlistFsObject[] = [];
    if (depth === 0 || currentPath === rootPath || parentId) {
      childEntries = await reader.read(currentPath);
    }

    const currentName = depth === 0 ? path.posix.basename(rootPath) || '/' : path.posix.basename(currentPath);
    const relativePath = depth === 0 ? '.' : toRelativePath(rootPath, currentPath);
    const childIds: string[] = [];
    const extensionMap = new Map<string, number>();
    const samplePaths: string[] = [];
    let totalFiles = 0;
    let totalDirs = 0;
    let totalSize = 0;
    let maxDepth = depth;

    for (const entry of childEntries) {
      const childPath = path.posix.join(currentPath, entry.name);
      if (childPath === duplicateFolderPath || childPath.startsWith(`${duplicateFolderPath}/`)) {
        continue;
      }

      if (entry.is_dir) {
        const childNode = await walk(childPath, depth + 1, currentPath);
        childIds.push(childNode.id);
        totalDirs += 1 + childNode.totalDirs;
        totalFiles += childNode.totalFiles;
        totalSize += childNode.totalSize;
        maxDepth = Math.max(maxDepth, childNode.maxDepth);
        if (samplePaths.length < SAMPLE_PATH_LIMIT) {
          samplePaths.push(childNode.relativePath);
          for (const item of childNode.samplePaths) {
            if (samplePaths.length >= SAMPLE_PATH_LIMIT) {
              break;
            }
            if (!samplePaths.includes(item)) {
              samplePaths.push(item);
            }
          }
        }
        for (const extStat of childNode.extensionStats) {
          const [ext, countText] = extStat.split(':');
          const count = Number(countText || 0);
          if (ext && count) {
            extensionMap.set(ext, (extensionMap.get(ext) || 0) + count);
          }
        }
        continue;
      }

      const childNode: OrganizerTreeNode = {
        id: childPath,
        parentId: currentPath,
        path: childPath,
        relativePath: toRelativePath(rootPath, childPath),
        name: entry.name,
        parentPath: currentPath,
        itemType: 'file',
        depth: depth + 1,
        selfSize: Number(entry.size || 0),
        totalFiles: 1,
        totalDirs: 0,
        totalSize: Number(entry.size || 0),
        maxDepth: depth + 1,
        samplePaths: [toRelativePath(rootPath, childPath)],
        extensionStats: formatExtensionStats(
          new Map([[path.posix.extname(entry.name).toLowerCase() || '[no-ext]', 1]])
        ),
        childIds: [],
      };
      nodes.set(childNode.id, childNode);
      childIds.push(childNode.id);
      totalFiles += 1;
      totalSize += childNode.totalSize;
      maxDepth = Math.max(maxDepth, childNode.maxDepth);
      if (samplePaths.length < SAMPLE_PATH_LIMIT) {
        samplePaths.push(childNode.relativePath);
      }
      const ext = path.posix.extname(entry.name).toLowerCase() || '[no-ext]';
      extensionMap.set(ext, (extensionMap.get(ext) || 0) + 1);
    }

    const directoryNode: OrganizerTreeNode = {
      id: currentPath,
      parentId,
      path: currentPath,
      relativePath,
      name: currentName,
      parentPath: depth === 0 ? path.posix.dirname(rootPath) : parentId || path.posix.dirname(currentPath),
      itemType: 'directory',
      depth,
      selfSize: 0,
      totalFiles,
      totalDirs,
      totalSize,
      maxDepth,
      samplePaths: samplePaths.slice(0, SAMPLE_PATH_LIMIT),
      extensionStats: formatExtensionStats(extensionMap),
      childIds,
    };
    nodes.set(directoryNode.id, directoryNode);
    return directoryNode;
  };

  const rootNode = await walk(rootPath, 0);

  return {
    rootNode,
    nodes,
  };
};

const toAiInputItem = (item: OrganizerTreeNode) => ({
  id: item.id,
  name: item.name,
  path: item.path,
  relativePath: item.relativePath,
  parentId: item.parentId,
  itemType: item.itemType,
  currentParentPath: item.parentPath,
  depth: item.depth,
  totalFiles: item.totalFiles,
  totalDirs: item.totalDirs,
  totalSize: item.totalSize,
  maxDepth: item.maxDepth,
  samplePaths: item.samplePaths,
  extensionStats: item.extensionStats,
  note:
    item.itemType === 'directory'
      ? `directory node with ${item.totalFiles} files and ${item.totalDirs} descendant directories`
      : `file node`,
});

const resolvePlanItem = (
  item: ReturnType<typeof toIndexedNode>,
  duplicateFolderPath: string,
  rootPath: string,
  aiItem: Awaited<ReturnType<typeof runAiOpenlistFolderOrganizeTool>>['items'][number]
): OpenlistAiOrganizerPlanItem => {
  const suggestedName = aiItem.suggestedName || item.name;
  const suggestedParentPath =
    aiItem.action === 'move_to_duplicates'
      ? duplicateFolderPath
      : normalizeOpenlistPath(aiItem.suggestedParentPath || item.parentPath);
  const suggestedPath =
    item.itemType === 'directory'
      ? normalizeOpenlistPath(path.posix.join(suggestedParentPath, suggestedName))
      : normalizeOpenlistPath(path.posix.join(suggestedParentPath, suggestedName));
  const hasNameChange = suggestedName !== item.name;
  const hasParentChange = suggestedParentPath !== item.parentPath;
  const hasActionChange = aiItem.action !== 'keep';
  const changeFlags = [
    hasNameChange ? 'rename' : '',
    hasParentChange ? 'move' : '',
    aiItem.action === 'move_to_duplicates' ? 'duplicate' : '',
  ].filter(Boolean);

  return {
    id: item.id,
    parentId: item.parentId,
    depth: item.depth,
    sourcePath: item.path,
    sourceRelativePath: item.relativePath,
    sourceName: item.name,
    sourceParentPath: item.parentPath,
    itemType: item.itemType,
    totalFiles: item.totalFiles,
    totalDirs: item.totalDirs,
    totalSize: item.totalSize,
    samplePaths: item.samplePaths,
    classification: aiItem.classification || 'unknown',
    action: hasParentChange && aiItem.action === 'rename' ? 'move' : aiItem.action,
    suggestedName,
    suggestedParentPath,
    suggestedPath,
    suggestedRelativePath: toRelativePath(rootPath, suggestedPath),
    hasChange: hasNameChange || hasParentChange || hasActionChange,
    changeFlags,
    duplicateGroup: aiItem.duplicateGroup,
    reason: aiItem.reason,
    confidence: aiItem.confidence,
    tags: aiItem.tags,
  };
};

const remapPathWithMappings = (rawPath: string, mappings: PathMapping[]) => {
  const targetPath = normalizeOpenlistPath(rawPath);
  const matched = mappings
    .filter(mapping => targetPath === mapping.sourcePrefix || targetPath.startsWith(`${mapping.sourcePrefix}/`))
    .sort((a, b) => b.sourcePrefix.length - a.sourcePrefix.length)[0];

  if (!matched) {
    return targetPath;
  }

  return normalizeOpenlistPath(`${matched.targetPrefix}${targetPath.slice(matched.sourcePrefix.length)}`);
};

export const browseOpenlistAiOrganizerPath = async (rawPath?: string): Promise<OpenlistAiOrganizerBrowseResponse> => {
  const currentPath = normalizeOpenlistPath(rawPath || '/');
  const sdk = await getOpenlistSdk();
  const reader = createDirectoryReader(sdk);
  const entries = await reader.read(currentPath);
  const directories = entries.filter(item => item.is_dir);

  return {
    path: currentPath,
    items: directories.map(item => ({
      name: item.name,
      path: path.posix.join(currentPath, item.name),
      isLeaf: false,
    })),
  };
};

export const analyzeOpenlistFolderWithAi = async (
  payload: AnalyzeOpenlistAiOrganizerPayload
): Promise<AnalyzeOpenlistAiOrganizerResponse> => {
  const rootPath = normalizeOpenlistPath(payload.rootPath);
  const duplicateFolderPath = path.posix.join(rootPath, normalizeDuplicateFolderName(payload.duplicateFolderName));
  const sdk = await getOpenlistSdk();
  const reader = createDirectoryReader(sdk);

  try {
    await reader.read(rootPath);
  } catch (error) {
    badRequest(`OpenList 路径无法访问: ${(error as Error)?.message || 'unknown_error'}`);
  }

  const { rootNode, nodes } = await scanOrganizerTree(reader, rootPath, duplicateFolderPath);
  const planCandidates = Array.from(nodes.values())
    .filter(
      item =>
        item.path !== rootPath && item.path !== duplicateFolderPath && !item.path.startsWith(`${duplicateFolderPath}/`)
    )
    .sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path))
    .map(toIndexedNode);

  const chunks = chunk(planCandidates, CHUNK_SIZE);
  const globalOverview = buildGlobalOverview(planCandidates, nodes.size - 1, rootPath);
  const previousPlanSummary = String(payload.userInstruction || '').trim()
    ? [
        `本次是基于已有分析的修订请求。`,
        payload.basedOnTaskId ? `参考历史任务: ${payload.basedOnTaskId}` : '',
        `用户反馈: ${String(payload.userInstruction || '').trim()}`,
      ].filter(Boolean)
    : [];
  const aggregatedAiItems: Awaited<ReturnType<typeof runAiOpenlistFolderOrganizeTool>>['items'] = [];
  const chunkSummaries: string[] = [];

  for (const [chunkIndex, chunkItems] of chunks.entries()) {
    const retrievedItems = buildRetrievedContext(chunkItems, planCandidates);
    const aiResult = await runAiOpenlistFolderOrganizeTool({
      rootPath,
      duplicateFolderPath,
      model: payload.model,
      chunkIndex: chunkIndex + 1,
      totalChunks: chunks.length,
      globalOverview,
      previousPlanSummary,
      userFeedback: payload.userInstruction,
      retrievedItems: retrievedItems.map(toAiInputItem),
      items: chunkItems.map(toAiInputItem),
    });

    aggregatedAiItems.push(...aiResult.items);
    if (aiResult.summary) {
      chunkSummaries.push(`Chunk ${chunkIndex + 1}/${chunks.length}: ${aiResult.summary}`);
    }
  }

  const aiItemMap = new Map(aggregatedAiItems.map(item => [item.id, item]));
  const items = planCandidates
    .map(item => {
      const aiItem = aiItemMap.get(item.id);
      if (!aiItem) {
        return null;
      }
      return resolvePlanItem(item, duplicateFolderPath, rootPath, aiItem);
    })
    .filter((item): item is OpenlistAiOrganizerPlanItem => item !== null)
    .sort((a, b) => {
      if (a.hasChange !== b.hasChange) {
        return a.hasChange ? -1 : 1;
      }
      return a.depth - b.depth || a.sourcePath.localeCompare(b.sourcePath);
    });

  return {
    rootPath,
    duplicateFolderPath,
    summary:
      chunkSummaries.join(' | ') ||
      `已按 ${chunks.length} 个 chunk 分批分析 ${planCandidates.length} 个目录/文件节点，并生成细粒度整理计划。`,
    totalEntries: Math.max(nodes.size - 1, 0),
    topLevelItemCount: rootNode.childIds.length,
    plannedItemCount: planCandidates.length,
    actionCount: items.filter(item => item.hasChange).length,
    duplicateCount: items.filter(item => item.action === 'move_to_duplicates').length,
    items,
  };
};

export const executeOpenlistAiOrganizerPlan = async (
  payload: ExecuteOpenlistAiOrganizerPayload
): Promise<ExecuteOpenlistAiOrganizerResponse> => {
  const rootPath = normalizeOpenlistPath(payload.rootPath);
  const duplicateFolderPath = path.posix.join(rootPath, normalizeDuplicateFolderName(payload.duplicateFolderName));
  const sdk = await getOpenlistSdk();
  const items = Array.isArray(payload.items) ? payload.items : [];
  const results: ExecuteOpenlistAiOrganizerResponse['items'] = [];
  const pathMappings: PathMapping[] = [];
  let appliedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const sortedItems = items.slice().sort((a, b) => a.depth - b.depth || a.sourcePath.localeCompare(b.sourcePath));

  for (const item of sortedItems) {
    const currentSourcePath = remapPathWithMappings(item.sourcePath, pathMappings);
    const sourceName = path.posix.basename(currentSourcePath);
    const sourceParentPath = path.posix.dirname(currentSourcePath);
    const resolvedTargetParent =
      item.action === 'move_to_duplicates'
        ? duplicateFolderPath
        : remapPathWithMappings(item.suggestedParentPath || item.sourceParentPath, pathMappings);
    const targetName =
      String(item.suggestedName || item.sourceName)
        .trim()
        .replace(/[\\/]/g, '_') || sourceName;
    const targetPath = normalizeOpenlistPath(path.posix.join(resolvedTargetParent, targetName));

    if (currentSourcePath === targetPath) {
      skippedCount += 1;
      results.push({
        id: item.id,
        sourcePath: currentSourcePath,
        targetPath,
        status: 'skipped',
        message: '无需变更',
      });
      continue;
    }

    try {
      if (resolvedTargetParent !== sourceParentPath) {
        await ensureOpenlistDirExists(sdk, resolvedTargetParent);
        await sdk.move({
          srcDir: sourceParentPath,
          dstDir: resolvedTargetParent,
          names: [sourceName],
        });
      }

      const movedPath =
        resolvedTargetParent !== sourceParentPath
          ? path.posix.join(resolvedTargetParent, sourceName)
          : currentSourcePath;

      if (targetName !== path.posix.basename(movedPath)) {
        await sdk.rename({
          path: movedPath,
          name: targetName,
        });
      }

      if (item.itemType === 'directory') {
        pathMappings.push({
          sourcePrefix: item.sourcePath,
          targetPrefix: targetPath,
        });
      }

      appliedCount += 1;
      results.push({
        id: item.id,
        sourcePath: currentSourcePath,
        targetPath,
        status: 'applied',
        message:
          resolvedTargetParent !== sourceParentPath && targetName !== sourceName
            ? '已移动并重命名'
            : resolvedTargetParent !== sourceParentPath
            ? '已移动'
            : '已重命名',
      });
    } catch (error) {
      failedCount += 1;
      results.push({
        id: item.id,
        sourcePath: currentSourcePath,
        targetPath,
        status: 'failed',
        message: (error as Error)?.message || '执行失败',
      });
    }
  }

  return {
    rootPath,
    duplicateFolderPath,
    appliedCount,
    skippedCount,
    failedCount,
    items: results,
  };
};
