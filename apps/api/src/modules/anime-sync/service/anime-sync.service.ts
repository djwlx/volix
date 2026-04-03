import path from 'node:path';
import { Op } from 'sequelize';
import { AnimeSyncJobStatus } from '@volix/types';
import type {
  AnimeSyncRunResult,
  CreateAnimeSyncSubscriptionPayload,
  ServiceAccountConfigItem,
  UpdateAnimeSyncSubscriptionPayload,
} from '@volix/types';
import { AppConfigEnum, getConfig } from '../../config';
import { createOpenlistSdk, createQbittorrentSdk, type OpenlistFsObject, type OpenlistSdk, type QbittorrentSdk, type QbittorrentTorrentInfo } from '../../../sdk';
import { toBeijingISOString } from '../../../utils/timezone';
import { AnimeSyncEpisodeJobModel, type AnimeSyncEpisodeJobModelType } from '../model/episode-job.model';
import { AnimeSyncRunLogModel } from '../model/run-log.model';
import { AnimeSyncSubscriptionModel, type AnimeSyncSubscriptionModelType } from '../model/subscription.model';
import { buildEpisodeKey, extractMagnetFromRssItem, fetchAnimeRssItems } from './rss.service';

const PROCESSING_LIMIT = 20;
const processingJobIds = new Set<number>();

interface AnimeSyncJobMeta {
  qbitTag?: string;
  sourceDir?: string;
  sourceName?: string;
  sourcePath?: string;
}

interface AnimeSyncClients {
  qbit: QbittorrentSdk;
  openlist: OpenlistSdk;
}

interface OpenlistCopySource {
  sourceDir: string;
  sourceName: string;
  sourcePath: string;
  sourceFileSize?: number;
}

const VIDEO_EXTENSIONS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.ts', '.m2ts']);
const COMPLETED_QBIT_STATES = new Set(['uploading', 'stalledup', 'pausedup', 'queuedup', 'forcedup', 'checkingup']);
const DOWNLOADING_QBIT_STATES = new Set([
  'downloading',
  'stalleddl',
  'forceddl',
  'queueddl',
  'checkingdl',
  'metadl',
  'pauseddl',
  'moving',
  'allocating',
]);
const PIPELINE_ACTIVE_STATUSES: AnimeSyncJobStatus[] = [
  AnimeSyncJobStatus.DISCOVERED,
  AnimeSyncJobStatus.QUEUED,
  AnimeSyncJobStatus.DOWNLOADING,
  AnimeSyncJobStatus.DOWNLOADED,
  AnimeSyncJobStatus.DEDUP_DONE,
  AnimeSyncJobStatus.COPIED,
];

const toSubscriptionResponse = (item: AnimeSyncSubscriptionModelType['dataValues']) => {
  const timestamps = item as AnimeSyncSubscriptionModelType['dataValues'] & {
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    id: item.id as number,
    name: item.name,
    rssUrl: item.rss_url,
    targetOpenlistPath: item.target_openlist_path,
    qbitCategory: item.qbit_category,
    pollIntervalSec: item.poll_interval_sec,
    enabled: Boolean(item.enabled),
    lastPolledAt: toBeijingISOString(item.last_polled_at),
    lastSuccessAt: toBeijingISOString(item.last_success_at),
    createdAt: toBeijingISOString(timestamps.createdAt),
    updatedAt: toBeijingISOString(timestamps.updatedAt),
  };
};

const toJobResponse = (item: AnimeSyncEpisodeJobModelType['dataValues']) => {
  const timestamps = item as AnimeSyncEpisodeJobModelType['dataValues'] & {
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    id: item.id as number,
    subscriptionId: item.subscription_id,
    episodeKey: item.episode_key,
    title: item.title,
    magnet: item.magnet,
    torrentUrl: item.torrent_url,
    qbitHash: item.qbit_hash,
    status: item.status,
    retryCount: item.retry_count,
    lastError: item.last_error,
    discoveredAt: toBeijingISOString(item.discovered_at),
    completedAt: toBeijingISOString(item.completed_at),
    createdAt: toBeijingISOString(timestamps.createdAt),
    updatedAt: toBeijingISOString(timestamps.updatedAt),
  };
};

const parseServiceAccountConfig = (raw?: string): ServiceAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as Partial<ServiceAccountConfigItem>;
    const baseUrl = data.baseUrl?.trim();
    const username = data.username?.trim();
    const password = data.password?.trim();
    if (!baseUrl || !username || !password) {
      return null;
    }
    return {
      baseUrl,
      username,
      password,
    };
  } catch {
    return null;
  }
};

const normalizeOpenlistPath = (rawPath: string) => {
  const value = rawPath.trim();
  if (!value) {
    return '/';
  }
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/');
  if (normalized === '/') {
    return '/';
  }
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
};

const joinOpenlistPath = (...parts: string[]) => {
  const joined = parts
    .map(item => item.trim())
    .filter(Boolean)
    .join('/');
  return normalizeOpenlistPath(joined);
};

const splitOpenlistPath = (targetPath: string) => {
  const normalized = normalizeOpenlistPath(targetPath);
  if (normalized === '/') {
    return {
      dir: '/',
      name: '',
    };
  }
  return {
    dir: normalizeOpenlistPath(path.posix.dirname(normalized)),
    name: path.posix.basename(normalized),
  };
};

const isVideoFile = (name: string) => {
  const ext = path.posix.extname(name).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
};

const containsChineseSubtitleHint = (name: string) => /(简中|中字|中文字幕|CHS|GB|简体)/i.test(name);

const parseResolutionScore = (name: string) => {
  if (/2160|4k/i.test(name)) {
    return 2160;
  }
  if (/1080/i.test(name)) {
    return 1080;
  }
  if (/720/i.test(name)) {
    return 720;
  }
  if (/480/i.test(name)) {
    return 480;
  }
  return 0;
};

const parseEpisodeNumber = (name: string) => {
  const patterns = [
    /(?:第\s*([0-9]{1,3})\s*[话集])/i,
    /(?:EP?|E)\s*([0-9]{1,3})/i,
    /\[\s*([0-9]{1,3})(?:v[0-9]+)?\s*\]/i,
  ];
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }
  return null;
};

const pickBestFile = (items: OpenlistFsObject[]) => {
  const sorted = [...items].sort((a, b) => {
    const chineseDiff = Number(containsChineseSubtitleHint(b.name)) - Number(containsChineseSubtitleHint(a.name));
    if (chineseDiff !== 0) {
      return chineseDiff;
    }
    const resolutionDiff = parseResolutionScore(b.name) - parseResolutionScore(a.name);
    if (resolutionDiff !== 0) {
      return resolutionDiff;
    }
    const sizeDiff = (b.size || 0) - (a.size || 0);
    if (sizeDiff !== 0) {
      return sizeDiff;
    }
    const modifiedA = new Date(a.modified || '').getTime() || 0;
    const modifiedB = new Date(b.modified || '').getTime() || 0;
    return modifiedB - modifiedA;
  });
  return sorted[0];
};

const parseMeta = (raw?: string | null): AnimeSyncJobMeta => {
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as AnimeSyncJobMeta;
  } catch {
    return {};
  }
};

const ensureOpenlistDirectory = async (openlist: OpenlistSdk, targetPath: string) => {
  const normalized = normalizeOpenlistPath(targetPath);
  if (normalized === '/') {
    return;
  }

  const segments = normalized.split('/').filter(Boolean);
  let current = '';
  for (const segment of segments) {
    current = `/${[current.replace(/^\//, ''), segment].filter(Boolean).join('/')}`.replace(/\/+/g, '/');
    try {
      await openlist.mkdir({
        path: current,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (!message.includes('exist')) {
        throw error;
      }
    }
  }
};

const fetchTargetFiles = async (openlist: OpenlistSdk, targetPath: string) => {
  await ensureOpenlistDirectory(openlist, targetPath);
  const list = await openlist.listFs({
    path: targetPath,
    perPage: 0,
  });
  return (list.content || []).filter(item => !item.is_dir && isVideoFile(item.name));
};

const dedupeTargetByEpisode = async (openlist: OpenlistSdk, targetPath: string, referenceName: string) => {
  const files = await fetchTargetFiles(openlist, targetPath);
  if (files.length <= 1) {
    return { removed: 0, kept: files[0]?.name };
  }

  const episodeNumber = parseEpisodeNumber(referenceName);
  const candidates = episodeNumber
    ? files.filter(item => parseEpisodeNumber(item.name) === episodeNumber)
    : files.filter(item => item.name.includes(referenceName) || referenceName.includes(item.name));

  if (candidates.length <= 1) {
    return { removed: 0, kept: candidates[0]?.name };
  }

  const keep = pickBestFile(candidates);
  if (!keep) {
    return { removed: 0 };
  }

  const removeNames = candidates.map(item => item.name).filter(name => name !== keep.name);
  if (removeNames.length > 0) {
    await openlist.remove({
      dir: normalizeOpenlistPath(targetPath),
      names: removeNames,
    });
  }

  return {
    removed: removeNames.length,
    kept: keep.name,
  };
};

const getTorrentStatus = (torrent: QbittorrentTorrentInfo) => {
  const state = (torrent.state || '').toLowerCase();
  if (torrent.progress >= 1 || torrent.completion_on > 0 || COMPLETED_QBIT_STATES.has(state)) {
    return 'completed' as const;
  }
  if (DOWNLOADING_QBIT_STATES.has(state)) {
    return 'downloading' as const;
  }
  return 'queued' as const;
};

const parseBtihFromMagnet = (magnet?: string) => {
  if (!magnet) {
    return '';
  }
  const match = magnet.match(/btih:([a-zA-Z0-9]+)/i);
  if (!match?.[1]) {
    return '';
  }
  const value = match[1].trim();
  return /^[a-fA-F0-9]{40}$/.test(value) ? value.toLowerCase() : '';
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildJobTag = (jobId: number) => `volix-job-${jobId}`;

const writeRunLog = async (params: {
  jobId: number;
  step: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  detail?: unknown;
}) => {
  await AnimeSyncRunLogModel.create({
    job_id: params.jobId,
    step: params.step,
    level: params.level,
    message: params.message,
    detail_json: params.detail ? JSON.stringify(params.detail) : undefined,
  });
};

const updateJobMeta = async (job: AnimeSyncEpisodeJobModelType, patch: Partial<AnimeSyncJobMeta>) => {
  const currentMeta = parseMeta(job.dataValues.meta_json);
  const nextMeta = {
    ...currentMeta,
    ...patch,
  };
  await job.update({
    meta_json: JSON.stringify(nextMeta),
  });
  return nextMeta;
};

const assertClientsReady = async (): Promise<AnimeSyncClients> => {
  const configData = await getConfig([AppConfigEnum.account_qbittorrent, AppConfigEnum.account_openlist]);
  const qbitConfig = parseServiceAccountConfig(configData?.[AppConfigEnum.account_qbittorrent]);
  const openlistConfig = parseServiceAccountConfig(configData?.[AppConfigEnum.account_openlist]);

  if (!qbitConfig) {
    throw new Error('请先在系统配置中填写 qBittorrent 账号');
  }
  if (!openlistConfig) {
    throw new Error('请先在系统配置中填写 OpenList 账号');
  }

  const qbit = createQbittorrentSdk({
    apiHost: qbitConfig.baseUrl,
    username: qbitConfig.username,
    password: qbitConfig.password,
  });

  const openlist = createOpenlistSdk({
    apiHost: openlistConfig.baseUrl,
  });

  await qbit.login();
  await openlist.login({
    username: openlistConfig.username,
    password: openlistConfig.password,
  });

  return {
    qbit,
    openlist,
  };
};

const locateSourceFromTorrent = async (params: {
  openlist: OpenlistSdk;
  torrent: QbittorrentTorrentInfo;
  fallbackTitle: string;
}): Promise<OpenlistCopySource> => {
  const { openlist, torrent, fallbackTitle } = params;
  const saveDir = normalizeOpenlistPath(torrent.save_path || '/');
  const directPath = joinOpenlistPath(saveDir, torrent.name || fallbackTitle);

  try {
    const direct = await openlist.getFs({
      path: directPath,
    });
    if (!direct.is_dir) {
      const split = splitOpenlistPath(directPath);
      return {
        sourceDir: split.dir,
        sourceName: split.name,
        sourcePath: directPath,
        sourceFileSize: direct.size,
      };
    }

    const list = await openlist.listFs({
      path: directPath,
      perPage: 0,
    });
    const videos = (list.content || []).filter(item => !item.is_dir && isVideoFile(item.name));
    const best = pickBestFile(videos);
    if (best) {
      const sourcePath = joinOpenlistPath(directPath, best.name);
      return {
        sourceDir: directPath,
        sourceName: best.name,
        sourcePath,
        sourceFileSize: best.size,
      };
    }
  } catch {
    // ignore and fallback to save_path scan
  }

  const rootList = await openlist.listFs({
    path: saveDir,
    perPage: 0,
  });
  const candidates = (rootList.content || []).filter(item => {
    if (item.is_dir) {
      return item.name === torrent.name;
    }
    return isVideoFile(item.name) && (item.name.includes(torrent.name) || item.name.includes(fallbackTitle));
  });

  const bestCandidate = pickBestFile(candidates);
  if (!bestCandidate) {
    throw new Error(`未找到可复制的源文件：${saveDir}/${torrent.name}`);
  }

  if (bestCandidate.is_dir) {
    const subPath = joinOpenlistPath(saveDir, bestCandidate.name);
    const subList = await openlist.listFs({
      path: subPath,
      perPage: 0,
    });
    const videos = (subList.content || []).filter(item => !item.is_dir && isVideoFile(item.name));
    const best = pickBestFile(videos);
    if (!best) {
      throw new Error(`目录 ${subPath} 下没有可识别视频文件`);
    }
    return {
      sourceDir: subPath,
      sourceName: best.name,
      sourcePath: joinOpenlistPath(subPath, best.name),
      sourceFileSize: best.size,
    };
  }

  return {
    sourceDir: saveDir,
    sourceName: bestCandidate.name,
    sourcePath: joinOpenlistPath(saveDir, bestCandidate.name),
    sourceFileSize: bestCandidate.size,
  };
};

const ensureJobFailed = async (job: AnimeSyncEpisodeJobModelType, error: unknown, step: string) => {
  const message = error instanceof Error ? error.message : String(error);
  await job.update({
    status: AnimeSyncJobStatus.FAILED,
    last_error: message,
    retry_count: (job.dataValues.retry_count || 0) + 1,
  });
  await writeRunLog({
    jobId: job.dataValues.id as number,
    step,
    level: 'error',
    message: '任务执行失败',
    detail: {
      status: job.dataValues.status,
      error: message,
    },
  });
};

const ensureTorrentForJob = async (params: {
  job: AnimeSyncEpisodeJobModelType;
  subscription: AnimeSyncSubscriptionModelType['dataValues'];
  clients: AnimeSyncClients;
}) => {
  const { job, subscription, clients } = params;
  const jobId = job.dataValues.id as number;
  const meta = parseMeta(job.dataValues.meta_json);
  const qbitTag = meta.qbitTag || buildJobTag(jobId);
  const btihHash = parseBtihFromMagnet(job.dataValues.magnet);

  let hash = (job.dataValues.qbit_hash || btihHash || '').toLowerCase();
  if (hash) {
    const exists = await clients.qbit.getTorrentByHash(hash);
    if (exists) {
      return {
        torrent: exists,
        qbitHash: hash,
        meta: await updateJobMeta(job, { qbitTag }),
      };
    }
  }

  const tagged = await clients.qbit.getTorrentsByTag(qbitTag);
  if (tagged.length > 0) {
    const torrent = tagged.sort((a, b) => b.added_on - a.added_on)[0];
    hash = torrent.hash.toLowerCase();
    await job.update({ qbit_hash: hash });
    return {
      torrent,
      qbitHash: hash,
      meta: await updateJobMeta(job, { qbitTag }),
    };
  }

  const url = job.dataValues.magnet || job.dataValues.torrent_url;
  if (!url) {
    throw new Error('任务缺少 magnet/torrent 链接');
  }

  await clients.qbit.addTorrents({
    urls: [url],
    category: subscription.qbit_category || undefined,
    tags: [qbitTag],
  });

  await sleep(1200);
  const created = await clients.qbit.getTorrentsByTag(qbitTag);
  if (created.length === 0) {
    throw new Error('入种后未找到 qBittorrent 任务，请检查 qB 接口权限');
  }
  const torrent = created.sort((a, b) => b.added_on - a.added_on)[0];
  hash = torrent.hash.toLowerCase();

  await job.update({
    qbit_hash: hash,
    status: AnimeSyncJobStatus.QUEUED,
    last_error: undefined,
  });
  await writeRunLog({
    jobId,
    step: 'queue',
    level: 'info',
    message: '任务已加入 qBittorrent',
    detail: {
      hash,
      tag: qbitTag,
      state: torrent.state,
    },
  });

  return {
    torrent,
    qbitHash: hash,
    meta: await updateJobMeta(job, { qbitTag }),
  };
};

const stepQueueOrDownload = async (params: {
  job: AnimeSyncEpisodeJobModelType;
  subscription: AnimeSyncSubscriptionModelType['dataValues'];
  clients: AnimeSyncClients;
}) => {
  const { job, subscription, clients } = params;
  const ensured = await ensureTorrentForJob({ job, subscription, clients });
  const torrentStatus = getTorrentStatus(ensured.torrent);

  if (torrentStatus === 'completed') {
    await job.update({
      status: AnimeSyncJobStatus.DOWNLOADED,
      last_error: undefined,
    });
    await writeRunLog({
      jobId: job.dataValues.id as number,
      step: 'download',
      level: 'info',
      message: '下载完成，准备执行去重',
      detail: {
        hash: ensured.qbitHash,
        state: ensured.torrent.state,
      },
    });
    return;
  }

  const nextStatus = torrentStatus === 'downloading' ? AnimeSyncJobStatus.DOWNLOADING : AnimeSyncJobStatus.QUEUED;
  await job.update({
    status: nextStatus,
    last_error: undefined,
  });
};

const stepDedupeBeforeCopy = async (params: {
  job: AnimeSyncEpisodeJobModelType;
  subscription: AnimeSyncSubscriptionModelType['dataValues'];
  clients: AnimeSyncClients;
}) => {
  const { job, subscription, clients } = params;
  const hash = job.dataValues.qbit_hash;
  if (!hash) {
    throw new Error('缺少 qBittorrent hash，无法定位源文件');
  }

  const torrent = await clients.qbit.getTorrentByHash(hash);
  if (!torrent) {
    throw new Error('qBittorrent 中找不到任务，可能已被手动删除');
  }

  const source = await locateSourceFromTorrent({
    openlist: clients.openlist,
    torrent,
    fallbackTitle: job.dataValues.title,
  });

  await updateJobMeta(job, {
    sourceDir: source.sourceDir,
    sourceName: source.sourceName,
    sourcePath: source.sourcePath,
  });

  const dedupeResult = await dedupeTargetByEpisode(clients.openlist, subscription.target_openlist_path, source.sourceName);
  await job.update({
    status: AnimeSyncJobStatus.DEDUP_DONE,
    last_error: undefined,
  });
  await writeRunLog({
    jobId: job.dataValues.id as number,
    step: 'dedupe',
    level: 'info',
    message: '目标目录去重完成',
    detail: {
      targetPath: subscription.target_openlist_path,
      removed: dedupeResult.removed,
      kept: dedupeResult.kept,
      sourceName: source.sourceName,
    },
  });
};

const stepCopy = async (params: {
  job: AnimeSyncEpisodeJobModelType;
  subscription: AnimeSyncSubscriptionModelType['dataValues'];
  clients: AnimeSyncClients;
}) => {
  const { job, subscription, clients } = params;
  const meta = parseMeta(job.dataValues.meta_json);
  if (!meta.sourceDir || !meta.sourceName) {
    throw new Error('缺少源文件信息，请先完成下载和去重步骤');
  }

  const targetPath = normalizeOpenlistPath(subscription.target_openlist_path);
  await ensureOpenlistDirectory(clients.openlist, targetPath);

  const targetList = await clients.openlist.listFs({
    path: targetPath,
    perPage: 0,
  });
  const existing = (targetList.content || []).find(item => !item.is_dir && item.name === meta.sourceName);
  if (!existing) {
    await clients.openlist.copy({
      srcDir: normalizeOpenlistPath(meta.sourceDir),
      dstDir: targetPath,
      names: [meta.sourceName],
    });
  }

  await job.update({
    status: AnimeSyncJobStatus.COPIED,
    last_error: undefined,
  });

  await writeRunLog({
    jobId: job.dataValues.id as number,
    step: 'copy',
    level: 'info',
    message: existing ? '目标目录已存在同名文件，跳过复制' : '文件复制完成',
    detail: {
      sourceDir: meta.sourceDir,
      sourceName: meta.sourceName,
      targetPath,
    },
  });
};

const stepCleanup = async (params: {
  job: AnimeSyncEpisodeJobModelType;
  subscription: AnimeSyncSubscriptionModelType['dataValues'];
  clients: AnimeSyncClients;
}) => {
  const { job, subscription, clients } = params;
  const meta = parseMeta(job.dataValues.meta_json);

  if (meta.sourceName) {
    await dedupeTargetByEpisode(clients.openlist, subscription.target_openlist_path, meta.sourceName);
  }

  const hash = job.dataValues.qbit_hash;
  if (hash) {
    await clients.qbit.deleteTorrents(hash, {
      deleteFiles: true,
    });
  } else if (meta.qbitTag) {
    const torrents = await clients.qbit.getTorrentsByTag(meta.qbitTag);
    if (torrents.length > 0) {
      await clients.qbit.deleteTorrents(
        torrents.map(item => item.hash),
        {
          deleteFiles: true,
        }
      );
    }
  }

  await job.update({
    status: AnimeSyncJobStatus.CLEANED,
    last_error: undefined,
    completed_at: new Date(),
  });

  await writeRunLog({
    jobId: job.dataValues.id as number,
    step: 'cleanup',
    level: 'info',
    message: '任务已完成并清理 qBittorrent 残留',
    detail: {
      qbitHash: hash,
      targetPath: subscription.target_openlist_path,
    },
  });
};

const processSingleJob = async (params: {
  job: AnimeSyncEpisodeJobModelType;
  subscription: AnimeSyncSubscriptionModelType['dataValues'];
  clients: AnimeSyncClients;
}) => {
  const { job, subscription, clients } = params;
  const status = job.dataValues.status;

  if (status === AnimeSyncJobStatus.DISCOVERED) {
    await stepQueueOrDownload({ job, subscription, clients });
    return;
  }
  if (status === AnimeSyncJobStatus.QUEUED || status === AnimeSyncJobStatus.DOWNLOADING) {
    await stepQueueOrDownload({ job, subscription, clients });
    return;
  }
  if (status === AnimeSyncJobStatus.DOWNLOADED) {
    await stepDedupeBeforeCopy({ job, subscription, clients });
    return;
  }
  if (status === AnimeSyncJobStatus.DEDUP_DONE) {
    await stepCopy({ job, subscription, clients });
    return;
  }
  if (status === AnimeSyncJobStatus.COPIED) {
    await stepCleanup({ job, subscription, clients });
  }
};

export const listAnimeSyncSubscriptions = async () => {
  const list = await AnimeSyncSubscriptionModel.findAll({ order: [['id', 'ASC']] });
  return list.map(item => toSubscriptionResponse(item.dataValues));
};

export const getAnimeSyncSubscription = async (id: number) => {
  const item = await AnimeSyncSubscriptionModel.findOne({ where: { id } });
  return item ? toSubscriptionResponse(item.dataValues) : null;
};

export const createAnimeSyncSubscription = async (payload: CreateAnimeSyncSubscriptionPayload) => {
  const created = await AnimeSyncSubscriptionModel.create({
    name: payload.name.trim(),
    rss_url: payload.rssUrl.trim(),
    target_openlist_path: normalizeOpenlistPath(payload.targetOpenlistPath),
    qbit_category: payload.qbitCategory?.trim(),
    poll_interval_sec: payload.pollIntervalSec || 300,
    enabled: payload.enabled !== false,
  });

  return toSubscriptionResponse(created.dataValues);
};

export const updateAnimeSyncSubscription = async (id: number, payload: UpdateAnimeSyncSubscriptionPayload) => {
  const target = await AnimeSyncSubscriptionModel.findOne({ where: { id } });
  if (!target) {
    return null;
  }

  await target.update({
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.rssUrl !== undefined ? { rss_url: payload.rssUrl.trim() } : {}),
    ...(payload.targetOpenlistPath !== undefined
      ? { target_openlist_path: normalizeOpenlistPath(payload.targetOpenlistPath) }
      : {}),
    ...(payload.qbitCategory !== undefined ? { qbit_category: payload.qbitCategory.trim() } : {}),
    ...(payload.pollIntervalSec !== undefined ? { poll_interval_sec: payload.pollIntervalSec } : {}),
    ...(payload.enabled !== undefined ? { enabled: payload.enabled } : {}),
  });

  return toSubscriptionResponse(target.dataValues);
};

export const deleteAnimeSyncSubscription = async (id: number) => {
  await AnimeSyncEpisodeJobModel.destroy({ where: { subscription_id: id } });
  return AnimeSyncSubscriptionModel.destroy({ where: { id } });
};

export const toggleAnimeSyncSubscription = async (id: number) => {
  const target = await AnimeSyncSubscriptionModel.findOne({ where: { id } });
  if (!target) {
    return null;
  }
  await target.update({
    enabled: !Boolean(target.dataValues.enabled),
  });
  return toSubscriptionResponse(target.dataValues);
};

export const listAnimeSyncJobs = async (subscriptionId?: number) => {
  const where = subscriptionId ? { subscription_id: subscriptionId } : undefined;
  const list = await AnimeSyncEpisodeJobModel.findAll({
    where,
    order: [['id', 'DESC']],
    limit: 200,
  });
  return list.map(item => toJobResponse(item.dataValues));
};

export const getAnimeSyncJob = async (id: number) => {
  const item = await AnimeSyncEpisodeJobModel.findOne({ where: { id } });
  return item ? toJobResponse(item.dataValues) : null;
};

export const retryAnimeSyncJob = async (id: number) => {
  const job = await AnimeSyncEpisodeJobModel.findOne({ where: { id } });
  if (!job) {
    return null;
  }
  await job.update({
    status: AnimeSyncJobStatus.DISCOVERED,
    retry_count: (job.dataValues.retry_count || 0) + 1,
    last_error: undefined,
  });
  await writeRunLog({
    jobId: id,
    step: 'manual',
    level: 'info',
    message: '管理员手动重试任务',
  });
  return toJobResponse(job.dataValues);
};

export const skipAnimeSyncJob = async (id: number) => {
  const job = await AnimeSyncEpisodeJobModel.findOne({ where: { id } });
  if (!job) {
    return null;
  }
  await job.update({
    status: AnimeSyncJobStatus.SKIPPED,
    completed_at: new Date(),
  });
  await writeRunLog({
    jobId: id,
    step: 'manual',
    level: 'warn',
    message: '管理员手动跳过任务',
  });
  return toJobResponse(job.dataValues);
};

const discoverFromSubscription = async (subscription: AnimeSyncSubscriptionModelType['dataValues']) => {
  const rssItems = await fetchAnimeRssItems(subscription.rss_url);
  let discoveredCount = 0;

  for (const item of rssItems) {
    const magnet = extractMagnetFromRssItem(item);
    if (!magnet) {
      continue;
    }

    const episodeKey = buildEpisodeKey(item, magnet);
    const exists = await AnimeSyncEpisodeJobModel.findOne({
      where: {
        subscription_id: subscription.id as number,
        episode_key: episodeKey,
      },
    });
    if (exists) {
      continue;
    }

    const created = await AnimeSyncEpisodeJobModel.create({
      subscription_id: subscription.id as number,
      episode_key: episodeKey,
      title: item.title,
      magnet,
      torrent_url: item.link,
      status: AnimeSyncJobStatus.DISCOVERED,
      retry_count: 0,
      discovered_at: new Date(),
      meta_json: JSON.stringify({
        pubDate: item.pubDate,
        guid: item.guid,
        link: item.link,
      }),
    });

    await writeRunLog({
      jobId: created.dataValues.id as number,
      step: 'discover',
      level: 'info',
      message: '发现新剧集任务',
      detail: { title: item.title, episodeKey },
    });

    discoveredCount += 1;
  }

  await AnimeSyncSubscriptionModel.update(
    {
      last_polled_at: new Date(),
      ...(discoveredCount > 0 ? { last_success_at: new Date() } : {}),
    },
    {
      where: {
        id: subscription.id,
      },
    }
  );

  return discoveredCount;
};

export const runAnimeSyncDiscover = async (subscriptionId?: number): Promise<AnimeSyncRunResult> => {
  const where = {
    enabled: true,
    ...(subscriptionId ? { id: subscriptionId } : {}),
  };
  const subscriptions = await AnimeSyncSubscriptionModel.findAll({
    where,
    order: [['id', 'ASC']],
  });

  let discoveredJobCount = 0;

  for (const item of subscriptions) {
    try {
      const count = await discoverFromSubscription(item.dataValues);
      discoveredJobCount += count;
    } catch (error) {
      await AnimeSyncSubscriptionModel.update(
        {
          last_polled_at: new Date(),
        },
        {
          where: {
            id: item.dataValues.id,
          },
        }
      );

      const failedJobs = await AnimeSyncEpisodeJobModel.findAll({
        where: {
          subscription_id: item.dataValues.id as number,
          status: {
            [Op.in]: [AnimeSyncJobStatus.DISCOVERED, AnimeSyncJobStatus.FAILED],
          },
        },
        order: [['id', 'DESC']],
        limit: 1,
      });

      if (failedJobs[0]) {
        await ensureJobFailed(failedJobs[0], error, 'discover');
      }
    }
  }

  return {
    scannedSubscriptionCount: subscriptions.length,
    discoveredJobCount,
  };
};

export const runAnimeSyncPipeline = async (limit = PROCESSING_LIMIT) => {
  const jobs = await AnimeSyncEpisodeJobModel.findAll({
    where: {
      status: {
        [Op.in]: PIPELINE_ACTIVE_STATUSES,
      },
    },
    order: [['id', 'ASC']],
    limit,
  });

  if (jobs.length === 0) {
    return {
      processedJobCount: 0,
      failedJobCount: 0,
      completedJobCount: 0,
    };
  }

  const subscriptionIds = Array.from(new Set(jobs.map(item => item.dataValues.subscription_id)));
  const subscriptions = await AnimeSyncSubscriptionModel.findAll({
    where: {
      id: {
        [Op.in]: subscriptionIds,
      },
    },
  });
  const subscriptionMap = new Map<number, AnimeSyncSubscriptionModelType['dataValues']>(
    subscriptions.map(item => [item.dataValues.id as number, item.dataValues])
  );

  let processedJobCount = 0;
  let failedJobCount = 0;
  let completedJobCount = 0;

  let clients: AnimeSyncClients | null = null;
  for (const job of jobs) {
    const jobId = job.dataValues.id as number;
    if (processingJobIds.has(jobId)) {
      continue;
    }
    const subscription = subscriptionMap.get(job.dataValues.subscription_id);
    if (!subscription || !subscription.enabled) {
      continue;
    }

    processingJobIds.add(jobId);
    try {
      if (!clients) {
        clients = await assertClientsReady();
      }
      const beforeStatus = job.dataValues.status;
      await processSingleJob({
        job,
        subscription,
        clients,
      });
      processedJobCount += 1;

      const latest = await AnimeSyncEpisodeJobModel.findOne({ where: { id: jobId } });
      if (latest?.dataValues.status === AnimeSyncJobStatus.CLEANED && beforeStatus !== AnimeSyncJobStatus.CLEANED) {
        completedJobCount += 1;
      }
    } catch (error) {
      failedJobCount += 1;
      await ensureJobFailed(job, error, 'pipeline');
    } finally {
      processingJobIds.delete(jobId);
    }
  }

  return {
    processedJobCount,
    failedJobCount,
    completedJobCount,
  };
};

export const getAnimeSyncOverview = async () => {
  const [subscriptionCount, enabledSubscriptionCount, discoveredJobCount, failedJobCount] = await Promise.all([
    AnimeSyncSubscriptionModel.count(),
    AnimeSyncSubscriptionModel.count({ where: { enabled: true } }),
    AnimeSyncEpisodeJobModel.count({
      where: {
        status: {
          [Op.in]: [
            AnimeSyncJobStatus.DISCOVERED,
            AnimeSyncJobStatus.QUEUED,
            AnimeSyncJobStatus.DOWNLOADING,
            AnimeSyncJobStatus.DOWNLOADED,
            AnimeSyncJobStatus.DEDUP_DONE,
            AnimeSyncJobStatus.COPIED,
          ],
        },
      },
    }),
    AnimeSyncEpisodeJobModel.count({ where: { status: AnimeSyncJobStatus.FAILED } }),
  ]);

  return {
    subscriptionCount,
    enabledSubscriptionCount,
    discoveredJobCount,
    failedJobCount,
  };
};

export const runDueAnimeSyncSubscriptions = async () => {
  const now = Date.now();
  const subscriptions = await AnimeSyncSubscriptionModel.findAll({
    where: { enabled: true },
    order: [['id', 'ASC']],
  });

  let discoveredJobCount = 0;
  let scannedSubscriptionCount = 0;

  for (const item of subscriptions) {
    const data = item.dataValues;
    const last = data.last_polled_at ? new Date(data.last_polled_at).getTime() : 0;
    const intervalMs = Math.max(30, data.poll_interval_sec || 300) * 1000;
    if (now - last < intervalMs) {
      continue;
    }

    scannedSubscriptionCount += 1;
    const result = await runAnimeSyncDiscover(data.id as number);
    discoveredJobCount += result.discoveredJobCount;
  }

  const pipeline = await runAnimeSyncPipeline();
  return {
    scannedSubscriptionCount,
    discoveredJobCount,
    processedJobCount: pipeline.processedJobCount,
    failedJobCount: pipeline.failedJobCount,
    completedJobCount: pipeline.completedJobCount,
  };
};
