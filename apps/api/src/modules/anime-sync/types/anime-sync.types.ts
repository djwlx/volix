import type { AnimeSyncJobStatus } from '@volix/types';

export interface AnimeRssItem {
  title: string;
  link?: string;
  guid?: string;
  pubDate?: string;
}

export interface AnimeSyncDiscoveredJob {
  subscriptionId: number;
  episodeKey: string;
  title: string;
  magnet: string;
  torrentUrl?: string;
  status: AnimeSyncJobStatus;
  discoveredAt: Date;
  metaJson?: string;
}
