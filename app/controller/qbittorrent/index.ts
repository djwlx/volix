import { AxiosRequestConfig } from 'axios';
import request, { getCookieValue } from '../../utils/request';
class Qbittorrent {
  private apiHost = 'http://localhost:6801';

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
        username: 'admin',
        password: '123456',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    this.cookie = getCookieValue(result.headers['set-cookie']?.[0] as string, 'SID');
  }

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

export default new Qbittorrent();
