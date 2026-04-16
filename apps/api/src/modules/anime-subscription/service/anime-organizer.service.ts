import path from 'path';
import type { QbittorrentTorrentInfo } from '../../../sdk/qbittorrent/create-qbittorrent.sdk';
import type { AnimeSubscriptionEntity, AnimeSubscriptionItemEntity } from '../types/anime-subscription.types';
import { ensureOpenlistDirExists, scanExistingAnimeLibrary } from './anime-library.service';

const MEDIA_EXTENSIONS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.ts']);

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const replaceRenamePattern = (
  renamePattern: string,
  values: { season: number; episode: number; series: string; ext: string }
) => {
  return renamePattern
    .replace(/\{\{series\}\}/g, values.series)
    .replace(/\{\{season\}\}/g, pad(values.season))
    .replace(/\{\{episode\}\}/g, pad(values.episode))
    .replace(/\{\{ext\}\}/g, values.ext);
};

const getTargetParts = (
  subscription: AnimeSubscriptionEntity,
  item: AnimeSubscriptionItemEntity,
  sourceName: string
) => {
  const ext = path.posix.extname(sourceName) || '.mkv';
  const aiTargetPath = String(item.target_path || '').trim();
  if (aiTargetPath) {
    const normalizedAiTargetPath = aiTargetPath.endsWith(ext) ? aiTargetPath : `${aiTargetPath}${ext}`;
    return {
      targetPath: normalizedAiTargetPath,
      targetDir: path.posix.dirname(normalizedAiTargetPath),
      targetName: path.posix.basename(normalizedAiTargetPath),
    };
  }
  const season = item.season || 1;
  const episode = item.episode || 0;
  const pattern = subscription.rename_pattern || 'S{{season}}/E{{episode}}{{ext}}';
  const rendered = replaceRenamePattern(pattern, {
    series: subscription.name,
    season,
    episode,
    ext,
  }).replace(/^\/+/, '');
  const targetPath = path.posix.join(subscription.series_root_path, rendered);
  return {
    targetPath,
    targetDir: path.posix.dirname(targetPath),
    targetName: path.posix.basename(targetPath),
  };
};

const findMediaEntry = async (
  sdk: Awaited<ReturnType<typeof scanExistingAnimeLibrary>>['sdk'],
  qbitSavePath: string,
  torrent: QbittorrentTorrentInfo
) => {
  const rootList = await sdk.listFs({ path: qbitSavePath, refresh: true });
  const direct = (rootList.content || []).find(entry => entry.name === torrent.name);
  if (direct && !direct.is_dir) {
    return {
      srcDir: qbitSavePath,
      srcName: direct.name,
    };
  }
  if (direct?.is_dir) {
    const innerDir = path.posix.join(qbitSavePath, direct.name);
    const innerList = await sdk.listFs({ path: innerDir, refresh: true });
    const mediaFile = (innerList.content || []).find(
      entry => !entry.is_dir && MEDIA_EXTENSIONS.has(path.posix.extname(entry.name))
    );
    if (mediaFile) {
      return {
        srcDir: innerDir,
        srcName: mediaFile.name,
      };
    }
  }
  const fuzzy = (rootList.content || []).find(entry => !entry.is_dir && entry.name.includes(torrent.name));
  if (fuzzy) {
    return {
      srcDir: qbitSavePath,
      srcName: fuzzy.name,
    };
  }
  return null;
};

export const organizeDownloadedAnime = async (
  subscription: AnimeSubscriptionEntity,
  item: AnimeSubscriptionItemEntity,
  torrent: QbittorrentTorrentInfo
) => {
  if (!String(subscription.series_root_path || '').trim()) {
    return {
      organized: false,
      reason: '未设置最终番剧目录，暂时无法自动整理',
    };
  }

  const { sdk } = await scanExistingAnimeLibrary(subscription.series_root_path);
  await ensureOpenlistDirExists(sdk, subscription.series_root_path);
  try {
    await sdk.listFs({ path: subscription.openlist_download_path, refresh: true });
  } catch {
    return {
      organized: false,
      reason: 'openlist_download_path 无法通过 OpenList 访问，暂时无法自动整理',
    };
  }

  const source = await findMediaEntry(sdk, subscription.openlist_download_path, torrent);
  if (!source) {
    return {
      organized: false,
      reason: '未在 OpenList 可见下载目录中找到已完成文件',
    };
  }

  const target = getTargetParts(subscription, item, source.srcName);
  await ensureOpenlistDirExists(sdk, target.targetDir);
  await sdk.move({
    srcDir: source.srcDir,
    dstDir: target.targetDir,
    names: [source.srcName],
  });

  if (source.srcName !== target.targetName) {
    await sdk.rename({
      path: path.posix.join(target.targetDir, source.srcName),
      name: target.targetName,
    });
  }

  return {
    organized: true,
    targetPath: target.targetPath,
  };
};
