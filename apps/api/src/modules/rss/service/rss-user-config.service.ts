export interface UserRssConfigEntity {
  host?: string;
  resourceProxyBaseUrl?: string;
  resourceCacheMaxSizeMb?: number;
  refreshIntervalMinutes?: number;
}

export const parseUserRssConfig = (raw?: string | null): UserRssConfigEntity => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as UserRssConfigEntity;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};
