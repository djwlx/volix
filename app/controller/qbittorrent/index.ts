import request, { getCookieValue } from '../../utils/request';
class Qbittorrent {
  private apiHost = 'http://localhost:6801';

  private cookie: string | null = '';

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
      const result = await request.post(
        `${this.apiHost}/api/v2/torrents/stop`,
        {
          hashes: 'all',
        },
        {
          headers: {
            Cookie: `SID=${this.cookie}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return 'ok';
    } catch (e: any) {
      if (e.status === 403) {
        await this.login();
        this.pauseAll();
      }
    }
  }

  async startAll() {
    const result = await request.post(
      `${this.apiHost}/api/v2/torrents/start`,
      {
        hashes: 'all',
      },
      {
        headers: {
          Cookie: `SID=${this.cookie}`,
        },
      }
    );
    if (result.status === 403) {
      await this.login();
      this.pauseAll();
    }
  }
}

export default new Qbittorrent();
