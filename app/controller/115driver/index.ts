import request from '../../utils/request';
import QRCode from 'qrcode';
import FormData from 'form-data';
import ConfigService from '../../service/config';
import { secret } from './secret';
import { TokenType, UserData } from './types';

type AppType = 'web' | 'android' | 'ios' | 'tv';

// 登录步骤
// 1.获取登录token
// 2.根据token获取登录的二维码
// 3.使用手机扫码登录
// 4.使用设备登录接口用token登录置换cookie
// 5.使用cookie进行后续的操作

class Driver115 {
  private api = {
    qrCodeToken: 'https://qrcodeapi.115.com/api/1.0/web/1.0/token',
    qrCodeStatus: 'https://qrcodeapi.115.com/get/status/',
    qrCodeLoginWithApp: (app: AppType = 'ios') => `https://passportapi.115.com/app/1.0/${app}/1.0/login/qrcode`,
    loginCheck: 'https://passportapi.115.com/app/1.0/web/1.0/check/sso',
    fileList: 'https://webapi.115.com/files',
    downloadUrl: 'https://proapi.115.com/app/chrome/downurl',
  };
  private userInfo?: UserData;

  constructor() {
    this.init();
  }

  private async init() {
    // 数据库读取用户的登录信息
    const config115 = await ConfigService.getConfig('115_login_info');
    if (config115) {
      this.userInfo = config115?.data;
    }
  }

  private async getCookie() {
    if (!this.userInfo) {
      await this.init();
    }
    const cookie = this.userInfo?.cookie;
    const formatterCookie = `UID=${cookie?.UID};SEID=${cookie?.SEID};KID=${cookie?.KID};CID=${cookie?.CID}`;
    return formatterCookie;
  }

  private async getToken() {
    const result = await request.get(this.api.qrCodeToken);
    return result.data?.data;
  }

  async getQrCode() {
    const token = await this.getToken();
    const { qrcode } = token;
    const qrCodeImg = await QRCode.toDataURL(qrcode);
    return {
      qrCode: qrcode,
      qrCodeValue: token,
      qrCodeImg,
    };
  }

  async getQrStatus(params: TokenType) {
    const result = await request.get(this.api.qrCodeStatus, {
      params,
    });
    return result.data;
  }

  async checkLogin() {
    const result = await request.get(this.api.loginCheck, {
      headers: {
        Cookie: await this.getCookie(),
      },
    });
    return result.data;
  }

  // 推荐使用app进行登录，cookie过期时间很长，缺点是只能同时有一处登录
  async LoginQrCodeWithApp(uid: string, paramApp: AppType) {
    const app = paramApp || 'ios';
    const url = this.api.qrCodeLoginWithApp(app);
    const form = new FormData();
    form.append('account', uid);
    form.append('app', app);
    const result = await request.post(url, form);
    // 登陆成功之后保存cookie到数据库
    await ConfigService.setConfig('115_login_info', result?.data);
    await this.init();
    return result;
  }

  async getFileList(offset?: number, pageSize?: number, cid?: string) {
    const params = {
      aid: '1',
      // 文件夹id
      cid: cid || '0',
      o: 'user_ptime',
      asc: '1',
      offset: offset || 0,
      show_dir: '1',
      limit: pageSize || 10,
      snap: '0',
      natsort: '0',
      record_open_time: '1',
      format: 'json',
      fc_mix: '0',
    };

    const result = await request.get(this.api.fileList, {
      params,
      headers: {
        Cookie: await this.getCookie(),
      },
    });
    return result.data;
  }

  async getFile(pc: string, ua: string) {
    const now = Date.now();
    const timestamp = Math.floor(now / 1000);
    const { data, key } = secret.encode(JSON.stringify({ pickcode: pc }), timestamp);
    const formData = new FormData();
    formData.append('data', data);

    const result = await request.post(this.api.downloadUrl, formData, {
      headers: {
        'User-Agent': ua,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: await this.getCookie(),
      },
    });

    var str = secret.decode(result.data?.data, key);

    const meta = JSON.parse(str);
    return meta;
  }

  async exit() {
    await ConfigService.clearConfig('115_login_info');
  }
}

export default new Driver115();
