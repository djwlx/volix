import FormData from 'form-data';
import QRCode from 'qrcode';
import request from '../../utils/request';
import { secret } from './secret';
import { TokenType } from './types';

const CLOUD115_MIN_REQUEST_INTERVAL_MS = 1000;

type AppType = 'web' | 'android' | 'ios' | 'tv';

export interface Create115SdkOptions {
  cookie?: string;
}

const api = {
  qrCodeToken: 'https://qrcodeapi.115.com/api/1.0/web/1.0/token',
  qrCodeStatus: 'https://qrcodeapi.115.com/get/status/',
  qrCodeLoginWithApp: (app: AppType = 'ios') => `https://passportapi.115.com/app/1.0/${app}/1.0/login/qrcode`,
  loginCheck: 'https://passportapi.115.com/app/1.0/web/1.0/check/sso',
  fileList: 'https://webapi.115.com/files',
  downloadUrl: 'https://proapi.115.com/app/chrome/downurl',
  userInfo: 'https://my.115.com/?ct=ajax&ac=nav',
};

let cloud115RequestQueue = Promise.resolve();
let lastCloud115RequestAt = 0;

const waitTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runCloud115SerialRequest = async <T>(runner: () => Promise<T>) => {
  const task = async () => {
    const waitMs = Math.max(0, lastCloud115RequestAt + CLOUD115_MIN_REQUEST_INTERVAL_MS - Date.now());
    if (waitMs > 0) {
      await waitTime(waitMs);
    }

    try {
      return await runner();
    } finally {
      lastCloud115RequestAt = Date.now();
    }
  };

  const pending = cloud115RequestQueue.then(task, task);
  cloud115RequestQueue = pending.then(
    () => undefined,
    () => undefined
  );
  return pending;
};

export function create115Sdk(options?: Create115SdkOptions) {
  let cookie = options?.cookie;

  const getCookie = () => cookie;
  const setCookie = (nextCookie?: string) => {
    cookie = nextCookie;
  };
  const clearCookie = () => {
    cookie = undefined;
  };

  const getToken = async () => {
    const result = await runCloud115SerialRequest(() => request.get(api.qrCodeToken));
    return result.data?.data;
  };

  const getQrCode = async () => {
    const token = await getToken();
    const { qrcode } = token;
    const qrCodeImg = await QRCode.toDataURL(qrcode);
    return {
      qrCode: qrcode,
      qrCodeValue: token,
      qrCodeImg,
    };
  };

  const getQrStatus = async (params: TokenType) => {
    const result = await runCloud115SerialRequest(() =>
      request.get(api.qrCodeStatus, {
        params,
      })
    );
    return result.data;
  };

  const checkLogin = async () => {
    const result = await runCloud115SerialRequest(() =>
      request.get(api.loginCheck, {
        headers: {
          Cookie: getCookie(),
        },
      })
    );
    return result.data;
  };

  const getUserInfo = async () => {
    if (!cookie) {
      return null;
    }

    const result = await runCloud115SerialRequest(() =>
      request.get(api.userInfo, {
        params: {
          _: Math.floor(Date.now() / 1000),
        },
        headers: {
          Cookie: getCookie(),
        },
      })
    );

    return result.data?.data;
  };

  const loginWithApp = async (uid: string, paramApp: AppType) => {
    const app = paramApp || 'ios';
    const url = api.qrCodeLoginWithApp(app);
    const form = new FormData();
    form.append('account', uid);
    form.append('app', app);
    const result = await runCloud115SerialRequest(() => request.post(url, form));

    const resCookie = result?.data?.data?.cookie;
    const cookieString = Object.entries(resCookie)
      .map(([key, value]) => `${key}=${value}`)
      .join(';');

    setCookie(cookieString);

    return {
      data: result.data,
      cookie: cookieString,
    };
  };

  const getFileList = async (offset?: number, pageSize?: number, cid?: string) => {
    const params = {
      aid: '1',
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

    const result = await runCloud115SerialRequest(() =>
      request.get(api.fileList, {
        params,
        headers: {
          Cookie: getCookie(),
        },
      })
    );

    return result.data;
  };

  const getFile = async (pc: string, ua: string) => {
    const now = Date.now();
    const timestamp = Math.floor(now / 1000);
    const { data, key } = secret.encode(JSON.stringify({ pickcode: pc }), timestamp);
    const formData = new FormData();
    formData.append('data', data);
    const result = await runCloud115SerialRequest(() =>
      request.post(api.downloadUrl, formData, {
        headers: {
          'User-Agent': ua,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: getCookie(),
        },
      })
    );

    const str = secret.decode(result.data?.data, key);
    return JSON.parse(str);
  };

  return {
    getCookie,
    setCookie,
    clearCookie,
    getQrCode,
    getQrStatus,
    checkLogin,
    getUserInfo,
    loginWithApp,
    getFileList,
    getFile,
  };
}

export type Sdk115 = ReturnType<typeof create115Sdk>;
