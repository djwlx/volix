import { AxiosRequestConfig } from 'axios';
import request, { getCookieValue } from '../../utils/request';

export interface CreateQbittorrentSdkOptions {
  apiHost: string;
  username: string;
  password: string;
}

export function createQbittorrentSdk(options: CreateQbittorrentSdkOptions) {
  const { apiHost, username, password } = options;
  let cookie: string | null = null;

  const login = async () => {
    const result = await request.post(
      `${apiHost}/api/v2/auth/login`,
      {
        username,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    cookie = getCookieValue(result.headers['set-cookie']?.[0] as string, 'SID');
  };

  const qbitRequest = async (params: AxiosRequestConfig<unknown>) => {
    if (!cookie) {
      await login();
    }

    return request({
      ...params,
      baseURL: apiHost,
      headers: {
        Cookie: `SID=${cookie}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...params.headers,
      },
    });
  };

  const pauseAll = async (): Promise<'ok' | undefined> => {
    try {
      await qbitRequest({
        url: '/api/v2/torrents/stop',
        method: 'POST',
        data: {
          hashes: 'all',
        },
      });
      return 'ok';
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'status' in e && (e as { status?: number }).status === 403) {
        await login();
        return pauseAll();
      }
    }
  };

  const startAll = async (): Promise<'ok' | undefined> => {
    try {
      await qbitRequest({
        url: '/api/v2/torrents/start',
        method: 'POST',
        data: {
          hashes: 'all',
        },
      });
      return 'ok';
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'status' in e && (e as { status?: number }).status === 403) {
        await login();
        return startAll();
      }
    }
  };

  return {
    login,
    qbitRequest,
    pauseAll,
    startAll,
  };
}

export type QbittorrentSdk = ReturnType<typeof createQbittorrentSdk>;
