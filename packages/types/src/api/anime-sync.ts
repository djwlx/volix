export enum AnimeSyncJobStatus {
  DISCOVERED = 'discovered',
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  DOWNLOADED = 'downloaded',
  DEDUP_DONE = 'dedup_done',
  COPIED = 'copied',
  CLEANED = 'cleaned',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface AnimeSyncSubscription {
  id: number;
  name: string;
  rssUrl: string;
  targetOpenlistPath: string;
  qbitCategory?: string;
  pollIntervalSec: number;
  enabled: boolean;
  lastPolledAt?: string;
  lastSuccessAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAnimeSyncSubscriptionPayload {
  name: string;
  rssUrl: string;
  targetOpenlistPath: string;
  qbitCategory?: string;
  pollIntervalSec?: number;
  enabled?: boolean;
}

export interface UpdateAnimeSyncSubscriptionPayload {
  name?: string;
  rssUrl?: string;
  targetOpenlistPath?: string;
  qbitCategory?: string;
  pollIntervalSec?: number;
  enabled?: boolean;
}

export interface AnimeSyncEpisodeJob {
  id: number;
  subscriptionId: number;
  episodeKey: string;
  title: string;
  magnet: string;
  torrentUrl?: string;
  qbitHash?: string;
  status: AnimeSyncJobStatus;
  retryCount: number;
  lastError?: string;
  discoveredAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnimeSyncOverview {
  subscriptionCount: number;
  enabledSubscriptionCount: number;
  discoveredJobCount: number;
  failedJobCount: number;
}

export interface AnimeSyncRunResult {
  scannedSubscriptionCount: number;
  discoveredJobCount: number;
  processedJobCount?: number;
  failedJobCount?: number;
  completedJobCount?: number;
}
