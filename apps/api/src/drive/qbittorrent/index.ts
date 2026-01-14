import { AxiosRequestConfig } from 'axios';
import request, { getCookieValue } from '../../utils/request';
class QbittorrentDriver {
  private apiHost: string;
  private username: string;
  private password: string;

  constructor() {
    this.apiHost = '';
    this.username = '';
    this.password = '';
  }

  private cookie: string | null = '';

  async qbitRequest(params: AxiosRequestConfig<any>) {
    if (!this.cookie) {
      await this.login();
    }
    return request({
      ...params,
      baseURL: this.apiHost,
      headers: {
        Cookie: `SID=${this.cookie}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...params.headers,
      },
    });
  }

  async login() {
    const result = await request.post(
      `${this.apiHost}/api/v2/auth/login`,
      {
        username: this.username,
        password: this.password,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    this.cookie = getCookieValue(result.headers['set-cookie']?.[0] as string, 'SID');
  }

  // 暂停所有任务
  async pauseAll() {
    try {
      await this.qbitRequest({
        url: '/api/v2/torrents/stop',
        method: 'POST',
        data: {
          hashes: 'all',
        },
      });
      return 'ok';
    } catch (e: any) {
      if (e.status === 403) {
        await this.login();
        return await this.pauseAll();
      }
    }
  }
  // 开始所有任务

  async startAll() {
    try {
      await this.qbitRequest({
        url: '/api/v2/torrents/start',
        method: 'POST',
        data: {
          hashes: 'all',
        },
      });
      return 'ok';
    } catch (e: any) {
      if (e.status === 403) {
        await this.login();
        return await this.startAll();
      }
    }
  }
}

const qbitDriver = new QbittorrentDriver();

export { qbitDriver };
