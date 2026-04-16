import type { AnimeSubscriptionItemStatus, AnimeSubscriptionStatus } from '@volix/types';

export interface AnimeSubscriptionEntity {
  id?: string | number;
  name: string;
  aliases: string;
  rss_url: string;
  series_root_path: string;
  qbit_save_path: string;
  openlist_download_path: string;
  enable_email_notification?: boolean;
  current_stage?: string | null;
  enabled: boolean;
  use_ai: boolean;
  match_keywords: string;
  rename_pattern: string;
  check_interval_minutes: number;
  last_checked_at?: Date | string | null;
  last_success_at?: Date | string | null;
  status: AnimeSubscriptionStatus;
  created_at?: Date;
  updated_at?: Date;
}

export interface AnimeSubscriptionItemEntity {
  id?: string | number;
  subscription_id: string | number;
  notify_email?: string;
  rss_guid?: string;
  rss_title: string;
  detail_url?: string;
  torrent_url?: string;
  published_at?: Date | string | null;
  season?: number | null;
  episode?: number | null;
  episode_raw?: string;
  resolution?: string;
  subtitle_language?: string;
  release_group?: string;
  score?: number | null;
  decision_status: AnimeSubscriptionItemStatus;
  qbit_hash?: string;
  target_path?: string;
  reason?: string;
  created_at?: Date;
  updated_at?: Date;
}
