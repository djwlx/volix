import path from 'path';
import { Op, type WhereOptions } from 'sequelize';
import { AnimeSubscriptionItemStatus, AnimeSubscriptionStatus } from '@volix/types';
import { log } from '../../../utils/logger';
import { AnimeSubscriptionItemModel } from '../model/anime-subscription-item.model';
import { AnimeSubscriptionModel } from '../model/anime-subscription.model';
import type { AnimeSubscriptionEntity, AnimeSubscriptionItemEntity } from '../types/anime-subscription.types';
import { fetchRssXml, parseRssItems } from './anime-rss.service';
import { logAnimeError, logAnimeEvent } from './anime-log.service';
import { matchAnimeRssItem } from './anime-matcher.service';
import { ensureOpenlistDirExists, scanExistingAnimeLibrary } from './anime-library.service';
import { enqueueAnimeDownload, pickBestCandidateForEpisode, syncAnimeDownloadStatus } from './anime-download.service';
import { planAnimeSubscriptionWithAi } from './anime-ai-planner.service';
import { normalizeExistingAnimeLibraryWithAi } from './anime-library-normalizer.service';

const parseJsonArray = (value?: string) => {
  if (!value) {
    return [] as string[];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item || '').trim()).filter(Boolean) : [];
  } catch {
    return [] as string[];
  }
};

const setSubscriptionStage = async (subscriptionId: string | number, stage: string) => {
  await updateAnimeSubscription(subscriptionId, {
    current_stage: stage,
  });
};

const getEpisodeKey = (season?: number | null, episode?: number | null) => {
  if (!season || !episode) {
    return '';
  }
  return `s${season}e${episode}`;
};

const isExistingEpisode = (
  existingEpisodeMap: Record<number, Record<number, boolean>>,
  season?: number | null,
  episode?: number | null
) => {
  if (!season || !episode) {
    return false;
  }
  return Boolean(existingEpisodeMap[season]?.[episode]);
};

interface ProcessedCandidate {
  notify_email?: string;
  rss_guid: string;
  rss_title: string;
  detail_url?: string;
  torrent_url?: string;
  published_at?: string;
  season: number;
  episode: number;
  episode_raw: string;
  resolution?: string;
  subtitle_language?: string;
  release_group?: string;
  score: number;
  target_path?: string;
  reason: string;
}

const runningSubscriptionChecks = new Map<string, Promise<unknown>>();

const buildSeasonEpisodeMapSummary = (existingEpisodeMap: Record<number, Record<number, boolean>>) => {
  const result: Record<string, number[]> = {};
  for (const [season, episodes] of Object.entries(existingEpisodeMap || {})) {
    result[`S${String(season).padStart(2, '0')}`] = Object.keys(episodes || {})
      .map(item => Number(item))
      .filter(item => Number.isFinite(item))
      .sort((a, b) => a - b);
  }
  return result;
};

const pickRepresentativeLibraryEntries = (
  entries: Array<{
    relativePath: string;
    isDir: boolean;
    size: number;
    modified?: string;
  }>
) => {
  const topLevelDirMap = new Map<string, { relativePath: string; isDir: boolean; size: number; modified?: string }>();
  const mediaSamples: Array<{ relativePath: string; isDir: boolean; size: number; modified?: string }> = [];
  const rootSamples: Array<{ relativePath: string; isDir: boolean; size: number; modified?: string }> = [];

  for (const entry of entries) {
    const segments = entry.relativePath.split('/').filter(Boolean);
    const firstSegment = segments[0];
    if (entry.isDir && firstSegment && !topLevelDirMap.has(firstSegment)) {
      topLevelDirMap.set(firstSegment, entry);
    }
    if (!entry.isDir && segments.length === 1 && rootSamples.length < 4) {
      rootSamples.push(entry);
      continue;
    }
    if (!entry.isDir && mediaSamples.length < 12) {
      mediaSamples.push(entry);
    }
  }

  return [...topLevelDirMap.values(), ...rootSamples, ...mediaSamples].slice(0, 20);
};

const updateSubscriptionState = async (id: string | number, payload: Partial<AnimeSubscriptionEntity>) => {
  await updateAnimeSubscription(id, payload);
  return queryAnimeSubscriptionById(id);
};

export const queryAnimeSubscriptions = async () => {
  return AnimeSubscriptionModel.findAll({
    order: [['id', 'DESC']],
  });
};

export const queryAnimeSubscriptionById = async (id: string | number) => {
  return AnimeSubscriptionModel.findByPk(id);
};

export const createAnimeSubscription = async (payload: AnimeSubscriptionEntity) => {
  return AnimeSubscriptionModel.create(payload);
};

export const updateAnimeSubscription = async (id: string | number, payload: Partial<AnimeSubscriptionEntity>) => {
  return AnimeSubscriptionModel.update(payload, {
    where: { id },
  });
};

export const queryAnimeSubscriptionItems = async (subscriptionId: string | number) => {
  return AnimeSubscriptionItemModel.findAll({
    where: {
      subscription_id: subscriptionId,
    },
    order: [['id', 'DESC']],
  });
};

export const createAnimeSubscriptionItem = async (payload: AnimeSubscriptionItemEntity) => {
  try {
    return await AnimeSubscriptionItemModel.create(payload);
  } catch (error) {
    log.error(error);
    return null;
  }
};

export const queryAnimeSubscriptionItemsByWhere = async (where: WhereOptions<AnimeSubscriptionItemEntity>) => {
  return AnimeSubscriptionItemModel.findAll({
    where,
    order: [['id', 'DESC']],
  });
};

export const updateAnimeSubscriptionItem = async (
  id: string | number,
  payload: Partial<AnimeSubscriptionItemEntity>
) => {
  return AnimeSubscriptionItemModel.update(payload, {
    where: { id },
  });
};

export const queryActiveAnimeSubscriptions = async () => {
  return AnimeSubscriptionModel.findAll({
    where: {
      enabled: true,
      status: {
        [Op.in]: [AnimeSubscriptionStatus.ACTIVE, AnimeSubscriptionStatus.ERROR],
      },
    },
    order: [['id', 'DESC']],
  });
};

export const runAnimeSubscriptionCheck = async (
  subscriptionId: string | number,
  options?: {
    notifyEmail?: string;
  }
) => {
  const current = await queryAnimeSubscriptionById(subscriptionId);
  if (!current) {
    throw new Error('subscription_not_found');
  }
  const subscription = current.dataValues as AnimeSubscriptionEntity;
  if (!subscription.enabled) {
    return {
      queuedCount: 0,
      skippedCount: 0,
      matchedCount: 0,
      message: 'subscription_disabled',
    };
  }

  const now = new Date();
  await updateSubscriptionState(subscriptionId, {
    last_checked_at: now,
    current_stage: '开始检查',
  });

  try {
    if (String(subscription.series_root_path || '').trim()) {
      await setSubscriptionStage(subscriptionId, '准备最终番剧目录');
      const { sdk } = await scanExistingAnimeLibrary(subscription.series_root_path);
      await ensureOpenlistDirExists(sdk, subscription.series_root_path);
      logAnimeEvent(subscriptionId, 'series_root_prepare_result', {
        seriesRootPath: subscription.series_root_path,
        createdIfMissing: true,
      });
    }

    await setSubscriptionStage(subscriptionId, '拉取 RSS');
    logAnimeEvent(subscriptionId, 'rss_fetch_start', { rssUrl: subscription.rss_url });
    const xml = await fetchRssXml(subscription.rss_url);
    const rssItems = parseRssItems(xml);
    logAnimeEvent(subscriptionId, 'rss_parse_result', { fetchedCount: rssItems.length });

    if (String(subscription.series_root_path || '').trim()) {
      await setSubscriptionStage(subscriptionId, '检查最终番剧目录');
      const normalizeResult = await normalizeExistingAnimeLibraryWithAi(subscriptionId, {
        subscriptionName: subscription.name,
        seriesRootPath: subscription.series_root_path,
        renamePattern: subscription.rename_pattern,
      });
      logAnimeEvent(subscriptionId, 'library_normalize_result', normalizeResult);
    }

    await setSubscriptionStage(subscriptionId, '扫描最终番剧目录');
    const { existingEpisodeMap, entries, rootExists } = await scanExistingAnimeLibrary(subscription.series_root_path);
    logAnimeEvent(subscriptionId, 'openlist_scan_result', {
      seriesRootPath: subscription.series_root_path,
      rootExists,
      existingEpisodeMap,
      entryCount: entries.length,
      sampleEntries: entries.slice(0, 30).map(entry => entry.relativePath),
    });

    const aliases = parseJsonArray(subscription.aliases);
    const matchKeywords = parseJsonArray(subscription.match_keywords);
    const useAi = Boolean(subscription.use_ai);
    const preliminaryMatches = [];

    await setSubscriptionStage(subscriptionId, useAi ? '分析 RSS 条目' : '匹配 RSS 条目');
    for (const rssItem of rssItems) {
      const matched = await matchAnimeRssItem(
        {
          name: subscription.name,
          aliases,
          matchKeywords,
          useAi: false,
        },
        {
          title: rssItem.title,
          description: rssItem.description,
        }
      );

      preliminaryMatches.push({
        rss_guid: rssItem.guid,
        rss_title: rssItem.title,
        detail_url: rssItem.link,
        torrent_url: rssItem.torrentUrl,
        published_at: rssItem.pubDate,
        description: rssItem.description,
        matched: matched.matched,
        season: matched.season || 1,
        episode: matched.episode || 0,
        resolution: matched.resolution,
        subtitle_language: matched.subtitleLanguage,
        release_group: matched.releaseGroup,
        score: Math.round(matched.confidence * 100),
        reason: matched.reason,
      });
    }

    const processedCandidates: ProcessedCandidate[] = [];

    if (useAi) {
      await setSubscriptionStage(subscriptionId, 'AI 决策下载与归档');
      try {
        const aiPlan = await planAnimeSubscriptionWithAi({
          subscriptionName: subscription.name,
          aliases,
          matchKeywords,
          seriesRootPath: subscription.series_root_path,
          renamePattern: subscription.rename_pattern,
          librarySummary: {
            totalEntries: entries.length,
            seasonEpisodeMap: buildSeasonEpisodeMapSummary(existingEpisodeMap),
            samplePaths: entries.slice(0, 30).map(entry => entry.relativePath),
            topLevelDirs: Array.from(
              new Set(entries.map(entry => entry.relativePath.split('/').filter(Boolean)[0] || '').filter(Boolean))
            ).slice(0, 12),
          },
          libraryEntries: pickRepresentativeLibraryEntries(entries).map(entry => ({
            path: '',
            relativePath: entry.relativePath,
            isDir: entry.isDir,
            size: entry.size,
            modified: entry.modified,
          })),
          rssItems: preliminaryMatches.map(item => ({
            rssGuid: item.rss_guid,
            title: item.rss_title,
            detailUrl: item.detail_url,
            torrentUrl: item.torrent_url,
            publishedAt: item.published_at,
            description: item.description,
            preliminaryMatched: item.matched,
            preliminarySeason: item.season,
            preliminaryEpisode: item.episode,
            preliminaryResolution: item.resolution,
            preliminarySubtitleLanguage: item.subtitle_language,
            preliminaryReason: item.reason,
          })),
        });

        const preliminaryMap = new Map(preliminaryMatches.map(item => [item.rss_guid, item]));
        for (const decision of aiPlan.decisions) {
          const source = preliminaryMap.get(decision.rssGuid);
          if (!source || !decision.shouldDownload || !decision.episode) {
            continue;
          }

          processedCandidates.push({
            notify_email: options?.notifyEmail,
            rss_guid: source.rss_guid,
            rss_title: source.rss_title,
            detail_url: source.detail_url,
            torrent_url: source.torrent_url,
            published_at: source.published_at,
            season: decision.season || source.season || 1,
            episode: decision.episode || source.episode || 0,
            episode_raw: decision.episode ? `E${String(decision.episode).padStart(2, '0')}` : '',
            resolution: source.resolution,
            subtitle_language: source.subtitle_language,
            release_group: source.release_group,
            score: Math.max(source.score || 0, Math.round((decision.confidence || 0) * 100)),
            target_path: decision.targetPath,
            reason: decision.reason,
          });
        }

        logAnimeEvent(subscriptionId, 'ai_plan_result', {
          summary: aiPlan.summary,
          summarizedLibraryEntryCount: pickRepresentativeLibraryEntries(entries).length,
          decisionCount: aiPlan.decisions.length,
          downloadCount: processedCandidates.length,
        });
      } catch (error) {
        logAnimeError(subscriptionId, 'ai_plan_error', error);
      }
    }

    if (processedCandidates.length === 0) {
      for (const matched of preliminaryMatches) {
        if (!matched.matched || !matched.episode) {
          continue;
        }
        if (isExistingEpisode(existingEpisodeMap, matched.season || 1, matched.episode || 0)) {
          continue;
        }

        processedCandidates.push({
          notify_email: options?.notifyEmail,
          rss_guid: matched.rss_guid,
          rss_title: matched.rss_title,
          detail_url: matched.detail_url,
          torrent_url: matched.torrent_url,
          published_at: matched.published_at,
          season: matched.season || 1,
          episode: matched.episode || 0,
          episode_raw: matched.episode ? `E${String(matched.episode).padStart(2, '0')}` : '',
          resolution: matched.resolution,
          subtitle_language: matched.subtitle_language,
          release_group: matched.release_group,
          score: matched.score,
          reason: matched.reason,
        });
      }
    }

    const grouped = processedCandidates.reduce<Record<string, typeof processedCandidates>>((acc, item) => {
      const key = getEpisodeKey(item.season, item.episode);
      if (!key) {
        return acc;
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    let queuedCount = 0;
    let skippedCount = 0;
    const matchedCount = processedCandidates.length;

    await setSubscriptionStage(subscriptionId, '筛选并投递下载');
    for (const key of Object.keys(grouped)) {
      const candidate = pickBestCandidateForEpisode(grouped[key]);
      if (!candidate) {
        continue;
      }
      if (candidate.subtitle_language !== 'zh') {
        skippedCount += 1;
        await createAnimeSubscriptionItem({
          subscription_id: subscriptionId,
          notify_email: candidate.notify_email,
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
          decision_status: AnimeSubscriptionItemStatus.SKIPPED,
          reason: 'no_chinese_subtitle_candidate',
        });
        continue;
      }
      const result = await enqueueAnimeDownload(subscription, candidate);
      if (result) {
        queuedCount += 1;
      }
    }

    await setSubscriptionStage(subscriptionId, '同步下载状态');
    const syncResult = await syncAnimeDownloadStatus(subscription);
    await updateSubscriptionState(subscriptionId, {
      last_success_at: new Date(),
      status: AnimeSubscriptionStatus.ACTIVE,
      current_stage: syncResult.organizedCount > 0 ? '已整理完成' : queuedCount > 0 ? '等待下载/整理' : '检查完成',
    });

    logAnimeEvent(subscriptionId, 'diff_result', {
      matchedCount,
      queuedCount,
      skippedCount,
      syncedCount: syncResult.syncedCount,
      organizedCount: syncResult.organizedCount,
    });

    return {
      queuedCount,
      skippedCount,
      matchedCount,
      syncedCount: syncResult.syncedCount,
      organizedCount: syncResult.organizedCount,
      message: `检测完成：匹配 ${matchedCount} 条，投递 ${queuedCount} 条`,
    };
  } catch (error) {
    await updateSubscriptionState(subscriptionId, {
      status: AnimeSubscriptionStatus.ERROR,
      current_stage: '执行失败',
    });
    logAnimeError(subscriptionId, 'check_error', error);
    throw error;
  }
};

export const triggerAnimeSubscriptionCheckInBackground = async (
  subscriptionId: string | number,
  options?: {
    notifyEmail?: string;
  }
) => {
  const key = String(subscriptionId);
  if (runningSubscriptionChecks.has(key)) {
    return {
      accepted: true,
      alreadyRunning: true,
      message: '该任务已在后台检查中',
    };
  }

  await updateSubscriptionState(subscriptionId, {
    last_checked_at: new Date(),
    current_stage: '已加入检查队列',
  });

  const runner = runAnimeSubscriptionCheck(subscriptionId, options).finally(() => {
    runningSubscriptionChecks.delete(key);
  });
  runningSubscriptionChecks.set(key, runner);

  void runner.catch(() => {
    // Error details are already recorded inside runAnimeSubscriptionCheck.
  });

  return {
    accepted: true,
    alreadyRunning: false,
    message: '已加入后台检查队列',
  };
};

export const syncAllAnimeSubscriptionDownloads = async () => {
  const subscriptions = await queryActiveAnimeSubscriptions();
  const results = [];
  for (const record of subscriptions) {
    const subscription = record.dataValues as AnimeSubscriptionEntity;
    const synced = await syncAnimeDownloadStatus(subscription);
    results.push({
      subscriptionId: subscription.id,
      ...synced,
    });
  }
  return results;
};
