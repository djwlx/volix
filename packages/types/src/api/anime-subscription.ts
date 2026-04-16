export enum AnimeSubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
}

export enum AnimeSubscriptionItemStatus {
  PENDING = 'pending',
  SKIPPED = 'skipped',
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  DOWNLOADED = 'downloaded',
  ORGANIZED = 'organized',
  FAILED = 'failed',
}

export interface AnimeSubscriptionResponse {
  id: string | number;
  name: string;
  aliases: string[];
  rssUrl: string;
  seriesRootPath: string;
  qbitSavePath: string;
  openlistDownloadPath: string;
  enableEmailNotification: boolean;
  latestEpisode?: string | null;
  errorReason?: string | null;
  currentStage?: string | null;
  enabled: boolean;
  useAi: boolean;
  matchKeywords: string[];
  renamePattern: string;
  checkIntervalMinutes: number;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  status: AnimeSubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnimeSubscriptionItemResponse {
  id: string | number;
  subscriptionId: string | number;
  rssGuid?: string;
  rssTitle: string;
  detailUrl?: string;
  torrentUrl?: string;
  publishedAt?: string | null;
  season?: number | null;
  episode?: number | null;
  episodeRaw?: string;
  resolution?: string;
  subtitleLanguage?: string;
  releaseGroup?: string;
  score?: number | null;
  decisionStatus: AnimeSubscriptionItemStatus;
  qbitHash?: string;
  targetPath?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnimeSubscriptionLogResponse {
  logs: string[];
}

export interface CreateAnimeSubscriptionPayload {
  name: string;
  aliases?: string[];
  rssUrl: string;
  seriesRootPath: string;
  qbitSavePath: string;
  openlistDownloadPath: string;
  enableEmailNotification?: boolean;
  enabled?: boolean;
  useAi?: boolean;
  matchKeywords?: string[];
  renamePattern?: string;
  checkIntervalMinutes?: number;
}

export interface UpdateAnimeSubscriptionPayload extends Partial<CreateAnimeSubscriptionPayload> {}

export interface TriggerAnimeSubscriptionCheckResponse {
  success: boolean;
  message: string;
  checkedAt: string;
  queuedCount?: number;
  skippedCount?: number;
  matchedCount?: number;
  syncedCount?: number;
  organizedCount?: number;
}
