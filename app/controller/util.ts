import mime from 'mime-types';
import driver115 from './115driver';
import { resError, resSuccess } from '../utils/response';
import ConfigService from '../service/config';
import ejs from 'ejs';
import fs from 'fs';
import { getRootPath } from '../utils/path';
import File115Service from '../service/file115';
import { generateRandomNumber } from '../utils/number';
import { calculateTimeDifference } from '../utils/date';
import Util115 from './115driver/util';
import { uniq } from 'es-toolkit';
class UtilController {
  static get115QrCode: MyMiddleware = async (ctx, next) => {
    const result = await driver115.getQrCode();
    resSuccess(ctx, {
      data: result,
    });
  };
  static get115QrCodeStatus: MyMiddleware = async (ctx, next) => {
    const { query } = ctx.request;
    const result = await driver115.getQrStatus(query as any);
    resSuccess(ctx, {
      data: result,
    });
  };
  static login115WithApp: MyMiddleware = async (ctx, next) => {
    const { body } = ctx.request;
    const { uid, app } = body;
    if (uid && app) {
      const result = await driver115.LoginQrCodeWithApp(uid, app);
      resSuccess(ctx, {
        data: result.data,
        message: '登录成功',
      });
    } else {
      resError(ctx, {
        code: 400,
        message: 'uid或app不能为空',
      });
    }
  };
  static exit115: MyMiddleware = async (ctx, next) => {
    await driver115.exit();
    resSuccess(ctx, {
      message: '成功',
    });
  };
  static get115UserInfo: MyMiddleware = async (ctx, next) => {
    const result = await ConfigService.getConfig('115_login_info');
    if (result) {
      resSuccess(ctx, {
        data: result?.data,
      });
    } else {
      resSuccess(ctx, {
        code: 1,
        message: '未登录',
      });
    }
  };

  static get115FileList: MyMiddleware = async (ctx, next) => {
    const { offset, pageSize, cid } = ctx.query || {};
    const result = await driver115.getFileList(Number(offset), Number(pageSize), cid as string);
    resSuccess(ctx, {
      data: result,
    });
  };

  static get115File: MyMiddleware = async (ctx, next) => {
    const { pc } = ctx.query;
    const ua = ctx.request.headers['user-agent'];
    const result = await driver115.getFile(pc as string, ua as string);
    resSuccess(ctx, {
      data: result,
    });
  };

  static get115LoginStatus: MyMiddleware = async (ctx, next) => {
    const result = await driver115.checkLogin();
    resSuccess(ctx, {
      data: result,
    });
  };

  static get115PicInfo: MyMiddleware = async (ctx, next) => {
    const count = await File115Service.getFileLen();
    const config = await ConfigService.getConfig('115_picture_info');
    let paths = [];
    if (!config) {
      await ConfigService.setConfig('115_picture_info', {
        count,
        paths,
        loading: false,
      });
    }

    resSuccess(ctx, {
      data: {
        count: config?.count ?? count,
        paths: config?.paths ?? paths,
        loading: config?.loading ?? false,
      },
    });
  };

  static set115Pic: MyMiddleware = async (ctx, next) => {
    const { paths, type } = ctx.request.body;
    if (!paths || paths?.length === 0 || !type) {
      resError(ctx, {
        code: 400,
        message: '参数错误',
      });
      return;
    }
    const config = await ConfigService.getConfig('115_picture_info');
    let pathTemp = config?.paths ?? [];
    if (config?.loading) {
      resError(ctx, {
        code: 400,
        message: '正在缓存中，请稍后再试',
      });
      return;
    }
    if (type === 'delete') {
      await File115Service.clearAll();
      pathTemp = [];
    }

    await ConfigService.setConfig('115_picture_info', {
      count: type === 'delete' ? 0 : config?.count,
      paths: uniq(pathTemp.concat(paths)),
      loading: true,
    });

    Util115.initRandomPic(paths);

    resSuccess(ctx, {
      message: '成功',
      data: {
        paths,
        loading: true,
      },
    });
  };

  static randomPic: MyMiddleware = async (ctx, next) => {
    const ua = ctx.request.headers['user-agent'];

    const { mode } = ctx.query || {};
    const isDirect = mode === 'direct';
    const len = await File115Service.getFileLen();
    const index = generateRandomNumber(0, len);
    const fileInfo = await File115Service.getFileByIndex(index);
    const pc = fileInfo?.pc;
    const result = await driver115.getFile(pc as string, ua as string);
    const metaInfo: any = Object.values(result)[0];
    const url = metaInfo?.url?.url;
    const setuHtml = `${getRootPath()}/app/views/setu.ejs`;
    const html = await ejs.renderFile(setuHtml, {
      url: url,
    });
    ctx.set('Content-Type', 'text/html');
    ctx.body = html;
  };
  static test: MyMiddleware = async (ctx, next) => {
    const token = await driver115.getQrCode();
  };
}

export default UtilController;
