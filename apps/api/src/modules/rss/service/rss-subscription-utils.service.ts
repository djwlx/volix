import { unauthorized } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';
import type { UserRssSubscriptionStateRow } from './rss-feed-db.service';
import type { UserRssSubscriptionItem } from '../types/rss.types';

export const normalizeSubscriptionName = (name: string): string => {
  const normalized = String(name || '').trim();
  return normalized ? normalized.slice(0, 255) : '';
};

export const getCurrentUserId = (rawUserId: string | number | undefined): string => {
  const userId = String(rawUserId || '').trim();
  if (!userId) {
    unauthorized(t('auth.unauthorized'));
  }
  return userId;
};

export const mapSubscriptionItem = (row: UserRssSubscriptionStateRow): UserRssSubscriptionItem => {
  const route = String(row.route || '');
  const name = normalizeSubscriptionName(String(row.name || ''));
  return {
    id: Number(row.id || 0),
    route,
    name: name || route,
    enabled: row.enabled !== false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
