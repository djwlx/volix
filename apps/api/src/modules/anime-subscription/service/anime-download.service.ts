import { Op } from 'sequelize';
import { createQbittorrentSdk } from '../../../sdk';
import type { QbittorrentTorrentInfo } from '../../../sdk/qbittorrent/create-qbittorrent.sdk';
import { AnimeSubscriptionItemStatus } from '@volix/types';
import { getQbittorrentAccountConfig } from './anime-config.service';
import request from '../../../utils/request';
import {
  createAnimeSubscriptionItem,
  queryAnimeSubscriptionItemsByWhere,
  updateAnimeSubscriptionItem,
} from './anime-subscription.service';
import { getResolutionScore } from './anime-matcher.service';
import type { AnimeSubscriptionEntity, AnimeSubscriptionItemEntity } from '../types/anime-subscription.types';
import { logAnimeError, logAnimeEvent } from './anime-log.service';
import { organizeDownloadedAnime } from './anime-organizer.service';

interface DownloadCandidate {
  rss_guid: string;
  rss_title: string;
  detail_url?: string;
  torrent_url?: string;
  published_at?: string;
  season?: number | null;
  episode?: number | null;
  episode_raw?: string;
  resolution?: string;
  subtitle_language?: string;
  release_group?: string;
  score: number;
  target_path?: string;
  reason: string;
}

const getSubscriptionTag = (subscriptionId: string | number) => `subscription-${subscriptionId}`;
const getItemTag = (itemId: string | number) => `anime-item-${itemId}`;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildTorrentUrlCandidates = (url: string) => {
  const raw = String(url || '').trim();
  if (!raw) {
    return [] as string[];
  }
  const candidates = [raw];

  try {
    const parsed = new URL(raw);
    if (parsed.hostname === 'mikanani.me') {
      const alt = new URL(parsed.toString());
      alt.hostname = 'mikanime.tv';
      candidates.push(alt.toString());
    }
  } catch {
    return [raw];
  }

  return Array.from(new Set(candidates));
};

const downloadTorrentFile = async (url: string) => {
  const result = await request.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  return Buffer.from(result.data);
};

const fetchTorrentFileWithFallback = async (url: string) => {
  const candidates = buildTorrentUrlCandidates(url);
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const content = await downloadTorrentFile(candidate);
      const parsed = new URL(candidate);
      const filename = parsed.pathname.split('/').pop() || 'anime.torrent';
      return {
        filename,
        content,
        sourceUrl: candidate,
        candidates,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('torrent_download_failed');
};

const buildScore = (candidate: DownloadCandidate) => {
  const subtitleScore = candidate.subtitle_language === 'zh' ? 1000 : 0;
  return subtitleScore + getResolutionScore(candidate.resolution) * 100 + (candidate.score || 0);
};

export const pickBestCandidateForEpisode = (candidates: DownloadCandidate[]) => {
  const chineseCandidates = candidates.filter(item => item.subtitle_language === 'zh');
  const pool = chineseCandidates.length > 0 ? chineseCandidates : candidates;
  return pool
    .slice()
    .sort(
      (a, b) => buildScore(b) - buildScore(a) || Date.parse(b.published_at || '0') - Date.parse(a.published_at || '0')
    )[0];
};

const getQbitSdk = async () => {
  const account = await getQbittorrentAccountConfig();
  return createQbittorrentSdk({
    apiHost: account.baseUrl,
    username: account.username,
    password: account.password,
  });
};

const findNewTorrentByTags = async (
  sdk: Awaited<ReturnType<typeof getQbitSdk>>,
  subscriptionId: string | number,
  itemId: string | number,
  title: string,
  savePath: string,
  addedAfter: number
) => {
  const list = await sdk.getTorrentsByTag(getSubscriptionTag(subscriptionId));
  const targetItemTag = getItemTag(itemId);
  return (
    list.find(item => (item.tags || '').includes(targetItemTag)) ||
    list.find(item => item.name === title) ||
    list.find(item => item.save_path === savePath && item.added_on >= addedAfter) ||
    list.sort((a, b) => b.added_on - a.added_on)[0] ||
    null
  );
};

const waitForEnqueuedTorrent = async (
  sdk: Awaited<ReturnType<typeof getQbitSdk>>,
  params: {
    subscriptionId: string | number;
    itemId: string | number;
    title: string;
    savePath: string;
    addedAfter: number;
  }
) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const torrent = await findNewTorrentByTags(
      sdk,
      params.subscriptionId,
      params.itemId,
      params.title,
      params.savePath,
      params.addedAfter
    );
    if (torrent) {
      return {
        torrent,
        attempt,
      };
    }
    await sleep(1200);
  }
  return {
    torrent: null,
    attempt: 5,
  };
};

export const enqueueAnimeDownload = async (subscription: AnimeSubscriptionEntity, candidate: DownloadCandidate) => {
  if (!candidate.torrent_url) {
    const item = await createAnimeSubscriptionItem({
      subscription_id: subscription.id as string | number,
      rss_guid: candidate.rss_guid,
      rss_title: candidate.rss_title,
      detail_url: candidate.detail_url,
      torrent_url: candidate.torrent_url,
      published_at: candidate.published_at || null,
      season: candidate.season,
      episode: candidate.episode,
      episode_raw: candidate.episode_raw,
      resolution: candidate.resolution,
      subtitle_language: candidate.subtitle_language,
      release_group: candidate.release_group,
      score: candidate.score,
      target_path: candidate.target_path,
      decision_status: AnimeSubscriptionItemStatus.SKIPPED,
      reason: 'torrent_url_missing',
    });
    return item?.dataValues || null;
  }

  const duplicated = await queryAnimeSubscriptionItemsByWhere({
    subscription_id: subscription.id,
    [Op.or]: [
      { rss_guid: candidate.rss_guid },
      {
        season: candidate.season || null,
        episode: candidate.episode || null,
        decision_status: {
          [Op.in]: [
            AnimeSubscriptionItemStatus.QUEUED,
            AnimeSubscriptionItemStatus.DOWNLOADING,
            AnimeSubscriptionItemStatus.DOWNLOADED,
            AnimeSubscriptionItemStatus.ORGANIZED,
          ],
        },
      },
    ],
  });
  if (duplicated.length > 0) {
    for (const record of duplicated) {
      const duplicateItem = record.dataValues as AnimeSubscriptionItemEntity;
      const hasBoundQbitTask = Boolean(String(duplicateItem.qbit_hash || '').trim());
      const isCompleted =
        duplicateItem.decision_status === AnimeSubscriptionItemStatus.DOWNLOADED ||
        duplicateItem.decision_status === AnimeSubscriptionItemStatus.ORGANIZED;

      if (hasBoundQbitTask || isCompleted) {
        return duplicateItem;
      }

      await updateAnimeSubscriptionItem(duplicateItem.id as string | number, {
        decision_status: AnimeSubscriptionItemStatus.FAILED,
        reason: 'stale_duplicate_without_qbit_hash',
      });
      logAnimeEvent(subscription.id as string | number, 'qbit_duplicate_reset', {
        itemId: duplicateItem.id,
        rssGuid: duplicateItem.rss_guid,
        season: duplicateItem.season,
        episode: duplicateItem.episode,
        previousStatus: duplicateItem.decision_status,
      });
    }
  }

  const item = await createAnimeSubscriptionItem({
    subscription_id: subscription.id as string | number,
    rss_guid: candidate.rss_guid,
    rss_title: candidate.rss_title,
    detail_url: candidate.detail_url,
    torrent_url: candidate.torrent_url,
    published_at: candidate.published_at || null,
    season: candidate.season,
    episode: candidate.episode,
    episode_raw: candidate.episode_raw,
    resolution: candidate.resolution,
    subtitle_language: candidate.subtitle_language,
    release_group: candidate.release_group,
    score: candidate.score,
    target_path: candidate.target_path,
    decision_status: AnimeSubscriptionItemStatus.PENDING,
    reason: candidate.reason,
  });
  if (!item) {
    return null;
  }

  const itemId = item.dataValues.id as string | number;
  const sdk = await getQbitSdk();
  const torrentFile = await fetchTorrentFileWithFallback(candidate.torrent_url);
  const enqueueStartedAt = Math.floor(Date.now() / 1000) - 2;
  logAnimeEvent(subscription.id as string | number, 'qbit_enqueue_start', {
    itemId,
    title: candidate.rss_title,
    originalTorrentUrl: candidate.torrent_url,
    qbitTorrentUrl: torrentFile.sourceUrl,
    qbitTorrentCandidates: torrentFile.candidates,
    enqueueMode: 'upload_torrent_file',
    savepath: subscription.qbit_save_path,
  });
  await sdk.addTorrents({
    torrentFiles: [
      {
        filename: torrentFile.filename,
        content: torrentFile.content,
      },
    ],
    savepath: subscription.qbit_save_path,
    category: 'anime',
    tags: ['anime', getSubscriptionTag(subscription.id as string | number), getItemTag(itemId)],
  });

  const enqueueResult = await waitForEnqueuedTorrent(sdk, {
    subscriptionId: subscription.id as string | number,
    itemId,
    title: candidate.rss_title,
    savePath: subscription.qbit_save_path,
    addedAfter: enqueueStartedAt,
  });
  const torrent = enqueueResult.torrent;
  if (!torrent) {
    await updateAnimeSubscriptionItem(itemId, {
      decision_status: AnimeSubscriptionItemStatus.FAILED,
      reason: 'qbit_task_not_found_after_enqueue',
    });
    logAnimeError(
      subscription.id as string | number,
      'qbit_enqueue_error',
      new Error('qbit_task_not_found_after_enqueue'),
      {
        itemId,
        title: candidate.rss_title,
        savepath: subscription.qbit_save_path,
        pollAttempts: enqueueResult.attempt,
      }
    );
    return {
      ...item.dataValues,
      qbit_hash: '',
      decision_status: AnimeSubscriptionItemStatus.FAILED,
      reason: 'qbit_task_not_found_after_enqueue',
    } as AnimeSubscriptionItemEntity;
  }

  logAnimeEvent(subscription.id as string | number, 'qbit_enqueue_success', {
    itemId,
    hash: torrent.hash,
    name: torrent.name,
    state: torrent.state,
    pollAttempts: enqueueResult.attempt,
  });

  await updateAnimeSubscriptionItem(itemId, {
    qbit_hash: torrent.hash || '',
    decision_status:
      torrent.progress >= 1 ? AnimeSubscriptionItemStatus.DOWNLOADED : AnimeSubscriptionItemStatus.QUEUED,
  });

  return {
    ...item.dataValues,
    qbit_hash: torrent.hash || '',
    decision_status:
      torrent.progress >= 1 ? AnimeSubscriptionItemStatus.DOWNLOADED : AnimeSubscriptionItemStatus.QUEUED,
  } as AnimeSubscriptionItemEntity;
};

const isTorrentFailed = (torrent: QbittorrentTorrentInfo) => {
  return /error|missingfiles|unknown/i.test(torrent.state || '');
};

export const syncAnimeDownloadStatus = async (subscription?: AnimeSubscriptionEntity) => {
  if (subscription) {
    logAnimeEvent(subscription.id as string | number, 'sync_download_start', {
      scope: 'subscription',
    });
  }

  const where = subscription ? { subscription_id: subscription.id } : undefined;
  const items = await queryAnimeSubscriptionItemsByWhere({
    ...(where || {}),
    decision_status: {
      [Op.in]: [
        AnimeSubscriptionItemStatus.QUEUED,
        AnimeSubscriptionItemStatus.DOWNLOADING,
        AnimeSubscriptionItemStatus.DOWNLOADED,
      ],
    },
  });
  if (items.length === 0) {
    if (subscription) {
      logAnimeEvent(subscription.id as string | number, 'sync_download_finish', {
        syncedCount: 0,
        organizedCount: 0,
        reason: 'no_pending_items',
      });
    }
    return {
      syncedCount: 0,
      organizedCount: 0,
    };
  }

  const sdk = await getQbitSdk();
  const torrents = await sdk.getTorrentList();
  const torrentMap = new Map(torrents.map(item => [item.hash.toLowerCase(), item]));
  let organizedCount = 0;

  for (const record of items) {
    const item = record.dataValues as AnimeSubscriptionItemEntity;
    const hash = String(item.qbit_hash || '').toLowerCase();
    if (!hash) {
      continue;
    }
    const torrent = torrentMap.get(hash);
    if (!torrent) {
      if (subscription) {
        logAnimeEvent(subscription.id as string | number, 'sync_download_item', {
          itemId: item.id,
          qbitHash: item.qbit_hash,
          status: 'missing_in_qbit',
        });
      }
      continue;
    }

    if (isTorrentFailed(torrent)) {
      await updateAnimeSubscriptionItem(item.id as string | number, {
        decision_status: AnimeSubscriptionItemStatus.FAILED,
        reason: `torrent_state:${torrent.state}`,
      });
      if (subscription) {
        logAnimeEvent(subscription.id as string | number, 'sync_download_item', {
          itemId: item.id,
          qbitHash: item.qbit_hash,
          progress: torrent.progress,
          state: torrent.state,
          decisionStatus: AnimeSubscriptionItemStatus.FAILED,
        });
      }
      continue;
    }

    if (torrent.progress >= 1 || torrent.completion_on > 0) {
      await updateAnimeSubscriptionItem(item.id as string | number, {
        decision_status: AnimeSubscriptionItemStatus.DOWNLOADED,
      });
      if (subscription) {
        logAnimeEvent(subscription.id as string | number, 'sync_download_item', {
          itemId: item.id,
          qbitHash: item.qbit_hash,
          progress: torrent.progress,
          state: torrent.state,
          decisionStatus: AnimeSubscriptionItemStatus.DOWNLOADED,
        });
      }

      if (subscription) {
        try {
          logAnimeEvent(subscription.id as string | number, 'organize_start', {
            itemId: item.id,
            qbitHash: item.qbit_hash,
          });
          const organized = await organizeDownloadedAnime(subscription, item, torrent);
          if (organized.organized) {
            organizedCount += 1;
            await updateAnimeSubscriptionItem(item.id as string | number, {
              decision_status: AnimeSubscriptionItemStatus.ORGANIZED,
              target_path: organized.targetPath,
              reason: 'organized',
            });
            logAnimeEvent(subscription.id as string | number, 'organize_success', {
              itemId: item.id,
              qbitHash: item.qbit_hash,
              targetPath: organized.targetPath,
            });
          } else {
            await updateAnimeSubscriptionItem(item.id as string | number, {
              reason: organized.reason,
            });
          }
        } catch (error) {
          await updateAnimeSubscriptionItem(item.id as string | number, {
            reason: (error as Error)?.message || 'organize_failed',
          });
          logAnimeError(subscription.id as string | number, 'organize_error', error, { itemId: item.id });
        }
      }

      continue;
    }

    await updateAnimeSubscriptionItem(item.id as string | number, {
      decision_status: AnimeSubscriptionItemStatus.DOWNLOADING,
      reason: `torrent_state:${torrent.state}`,
    });
    if (subscription) {
      logAnimeEvent(subscription.id as string | number, 'sync_download_item', {
        itemId: item.id,
        qbitHash: item.qbit_hash,
        progress: torrent.progress,
        state: torrent.state,
        decisionStatus: AnimeSubscriptionItemStatus.DOWNLOADING,
      });
    }
  }

  if (subscription) {
    logAnimeEvent(subscription.id as string | number, 'sync_download_finish', {
      syncedCount: items.length,
      organizedCount,
    });
  }

  return {
    syncedCount: items.length,
    organizedCount,
  };
};
