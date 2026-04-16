import FormData from 'form-data';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import request, { getCookieValue } from '../../utils/request';

export interface CreateQbittorrentSdkOptions {
  apiHost: string;
  username: string;
  password: string;
}

export type QbittorrentHashes = 'all' | string | string[];

export interface QbittorrentDeleteOptions {
  deleteFiles?: boolean;
}

export interface QbittorrentAddTorrentParams {
  urls?: string[];
  torrentFiles?: Array<{
    filename: string;
    content: Buffer;
  }>;
  category?: string;
  tags?: string[];
  paused?: boolean;
  skipChecking?: boolean;
  savepath?: string;
}

export interface QbittorrentTorrentInfo {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  dlspeed: number;
  upspeed: number;
  added_on: number;
  completion_on: number;
  save_path: string;
  category: string;
  tags: string;
}

export function createQbittorrentSdk(options: CreateQbittorrentSdkOptions) {
  const { apiHost, username, password } = options;
  const normalizedHost = apiHost.replace(/\/+$/, '');
  const hostOrigin = new URL(normalizedHost).origin;
  let cookie: string | null = null;

  const toFormData = (data: Record<string, string | number | boolean>) => {
    return new URLSearchParams(
      Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {})
    );
  };

  const normalizeHashes = (hashes: QbittorrentHashes = 'all') => {
    if (hashes === 'all') {
      return 'all';
    }
    if (typeof hashes === 'string') {
      const value = hashes.trim();
      if (!value) {
        throw new Error('hashes 不能为空');
      }
      return value;
    }
    const values = hashes.map(item => item.trim()).filter(Boolean);
    if (values.length === 0) {
      throw new Error('hashes 不能为空');
    }
    return values.join('|');
  };

  const getSidFromHeaders = (setCookieHeader: string | string[] | undefined) => {
    if (Array.isArray(setCookieHeader)) {
      for (const item of setCookieHeader) {
        const sid = getCookieValue(item, 'SID');
        if (sid) {
          return sid;
        }
      }
      return null;
    }
    return setCookieHeader ? getCookieValue(setCookieHeader, 'SID') : null;
  };

  const login = async () => {
    const result = await request.post(
      `${normalizedHost}/api/v2/auth/login`,
      toFormData({
        username,
        password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: normalizedHost,
          Origin: hostOrigin,
        },
      }
    );
    cookie = getSidFromHeaders(result.headers['set-cookie']);
    if (!cookie) {
      throw new Error('qBittorrent 登录失败，未获取到 SID');
    }
  };

  const getErrorStatus = (error: unknown) => {
    const responseStatus = (error as AxiosError)?.response?.status;
    return typeof responseStatus === 'number' ? responseStatus : undefined;
  };

  const qbitRequest = async <T = unknown>(params: AxiosRequestConfig<unknown>, retryOnAuthError = true) => {
    if (!cookie) {
      await login();
    }

    try {
      return await request<T>({
        ...params,
        baseURL: normalizedHost,
        headers: {
          Cookie: `SID=${cookie}`,
          Referer: normalizedHost,
          Origin: hostOrigin,
          ...(params.data ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
          ...params.headers,
        },
      });
    } catch (error) {
      const status = getErrorStatus(error);
      if (retryOnAuthError && (status === 401 || status === 403)) {
        await login();
        return qbitRequest<T>(params, false);
      }
      throw error;
    }
  };

  const torrentAction = async (
    action: 'stop' | 'start' | 'delete' | 'recheck' | 'reannounce',
    payload: Record<string, string>
  ) => {
    await qbitRequest({
      url: `/api/v2/torrents/${action}`,
      method: 'POST',
      data: toFormData(payload),
    });
    return 'ok' as const;
  };

  const getTorrentList = async () => {
    const result = await qbitRequest<QbittorrentTorrentInfo[]>({
      url: '/api/v2/torrents/info',
      method: 'GET',
    });
    return result.data;
  };

  const addTorrents = async (params: QbittorrentAddTorrentParams) => {
    const urls = (params.urls || []).map(item => item.trim()).filter(Boolean);
    const torrentFiles = (params.torrentFiles || []).filter(item => item.filename && item.content);
    if (urls.length === 0 && torrentFiles.length === 0) {
      throw new Error('urls 或 torrentFiles 至少传一个');
    }
    const tags = (params.tags || []).map(item => item.trim()).filter(Boolean);
    const form = new FormData();
    if (urls.length > 0) {
      form.append('urls', urls.join('\n'));
    }
    for (const file of torrentFiles) {
      form.append('torrents', file.content, {
        filename: file.filename,
        contentType: 'application/x-bittorrent',
      });
    }
    if (params.category) {
      form.append('category', params.category);
    }
    if (tags.length > 0) {
      form.append('tags', tags.join(','));
    }
    if (params.paused !== undefined) {
      form.append('paused', String(params.paused));
    }
    if (params.skipChecking !== undefined) {
      form.append('skip_checking', String(params.skipChecking));
    }
    if (params.savepath) {
      form.append('savepath', params.savepath);
    }

    await qbitRequest({
      url: '/api/v2/torrents/add',
      method: 'POST',
      data: form,
      headers: form.getHeaders(),
    });

    return 'ok' as const;
  };

  const getTorrentByHash = async (hash: string) => {
    const targetHash = hash.trim().toLowerCase();
    if (!targetHash) {
      throw new Error('hash 不能为空');
    }
    const list = await getTorrentList();
    return list.find(item => item.hash.toLowerCase() === targetHash) || null;
  };

  const getTorrentsByTag = async (tag: string) => {
    const targetTag = tag.trim();
    if (!targetTag) {
      throw new Error('tag 不能为空');
    }
    const list = await getTorrentList();
    return list.filter(item =>
      (item.tags || '')
        .split(',')
        .map(it => it.trim())
        .includes(targetTag)
    );
  };

  const pauseTorrents = async (hashes: QbittorrentHashes = 'all') => {
    return torrentAction('stop', { hashes: normalizeHashes(hashes) });
  };

  const resumeTorrents = async (hashes: QbittorrentHashes = 'all') => {
    return torrentAction('start', { hashes: normalizeHashes(hashes) });
  };

  const deleteTorrents = async (hashes: QbittorrentHashes, options: QbittorrentDeleteOptions = {}) => {
    return torrentAction('delete', {
      hashes: normalizeHashes(hashes),
      deleteFiles: options.deleteFiles ? 'true' : 'false',
    });
  };

  const recheckTorrents = async (hashes: QbittorrentHashes) => {
    return torrentAction('recheck', { hashes: normalizeHashes(hashes) });
  };

  const reannounceTorrents = async (hashes: QbittorrentHashes) => {
    return torrentAction('reannounce', { hashes: normalizeHashes(hashes) });
  };

  const pauseAll = async () => {
    return pauseTorrents('all');
  };

  const startAll = async () => {
    return resumeTorrents('all');
  };

  return {
    login,
    qbitRequest,
    addTorrents,
    getTorrentList,
    getTorrentByHash,
    getTorrentsByTag,
    pauseTorrents,
    resumeTorrents,
    deleteTorrents,
    recheckTorrents,
    reannounceTorrents,
    pauseAll,
    startAll,
  };
}

export type QbittorrentSdk = ReturnType<typeof createQbittorrentSdk>;
