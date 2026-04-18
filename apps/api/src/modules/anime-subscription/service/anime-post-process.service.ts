import type { QbittorrentTorrentInfo } from '../../../sdk/qbittorrent/create-qbittorrent.sdk';
import { runOpenlistAnimeLibraryOrganize } from '../../openlist-ai-organizer/service/openlist-ai-organizer.service';
import type { AnimeSubscriptionEntity, AnimeSubscriptionItemEntity } from '../types/anime-subscription.types';
import { logAnimeError, logAnimeEvent } from './anime-log.service';
import { copyDownloadedAnimeToLibrary } from './anime-organizer.service';

export const runAnimePostProcess = async (params: {
  subscription: AnimeSubscriptionEntity;
  item: AnimeSubscriptionItemEntity;
  torrent: QbittorrentTorrentInfo;
}) => {
  const subscriptionId = params.subscription.id as string | number;

  logAnimeEvent(subscriptionId, 'post_process_copy_start', {
    itemId: params.item.id,
    qbitHash: params.item.qbit_hash,
  });

  const copied = await copyDownloadedAnimeToLibrary(params.subscription, params.item, params.torrent);
  if (!copied.copied) {
    return {
      organized: false,
      reason: copied.reason,
      stage: 'copy_skipped' as const,
    };
  }

  logAnimeEvent(subscriptionId, 'post_process_copy_success', {
    itemId: params.item.id,
    qbitHash: params.item.qbit_hash,
    targetPath: copied.targetPath,
    copyMode: copied.copyMode,
  });

  try {
    logAnimeEvent(subscriptionId, 'post_process_ai_organize_start', {
      itemId: params.item.id,
      qbitHash: params.item.qbit_hash,
      rootPath: params.subscription.series_root_path,
    });
    const organizeResult = await runOpenlistAnimeLibraryOrganize(params.subscription.series_root_path);
    logAnimeEvent(subscriptionId, 'post_process_ai_organize_success', {
      itemId: params.item.id,
      qbitHash: params.item.qbit_hash,
      rootPath: params.subscription.series_root_path,
      summary: organizeResult.summary,
      actionCount: organizeResult.actionCount,
    });

    return {
      organized: true,
      stage: 'ai_organized' as const,
      targetPath: copied.targetPath,
      copyMode: copied.copyMode,
    };
  } catch (error) {
    logAnimeError(subscriptionId, 'post_process_ai_organize_error', error, {
      itemId: params.item.id,
      qbitHash: params.item.qbit_hash,
      rootPath: params.subscription.series_root_path,
    });
    throw error;
  }
};
