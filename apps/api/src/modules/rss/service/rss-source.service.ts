import { badRequest } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

const parseUrlOrThrow = (value: string, fieldName: string): URL => {
  try {
    return new URL(value);
  } catch {
    const message = t('rssApi.invalidUrl', { fieldName });
    badRequest(message);
    throw new Error(message);
  }
};

const assertAllowedProtocol = (url: URL, fieldName: string) => {
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    badRequest(t('rssApi.protocolUnsupported', { fieldName }));
  }
};

export const normalizeAbsoluteUrl = (value: string, fieldName: string): string => {
  const parsedUrl = parseUrlOrThrow(value, fieldName);
  assertAllowedProtocol(parsedUrl, fieldName);
  return parsedUrl.toString();
};

export const isAbsoluteHttpUrl = (value: string): boolean => /^https?:\/\//i.test(String(value || '').trim());

export const normalizeSubscriptionRoute = (route: string): string => {
  const trimmedRoute = String(route || '').trim();
  if (!trimmedRoute) {
    badRequest(t('rssApi.route.required'));
  }
  if (isAbsoluteHttpUrl(trimmedRoute)) {
    return normalizeAbsoluteUrl(trimmedRoute, 'route');
  }
  return trimmedRoute.startsWith('/') ? trimmedRoute : `/${trimmedRoute}`;
};

export const normalizeHost = (host: string): string => {
  const trimmedHost = String(host || '').trim();
  if (!trimmedHost) {
    badRequest(t('rssApi.host.required'));
  }
  const normalizedHost = new URL(normalizeAbsoluteUrl(trimmedHost, 'host'));
  normalizedHost.pathname = '/';
  normalizedHost.search = '';
  normalizedHost.hash = '';
  return normalizedHost.toString();
};
