import mime from 'mime-types';
import driver115 from './115driver';
import { resError, resSuccess } from '../utils/response';
import ejs from 'ejs';
import { getRootPath } from '../utils/path';
import File115Service from '../service/file115';
import { generateRandomNumber } from '../utils/number';
import Util115 from './115driver/util';
import request from '../utils/request';
import qbittorrent from './qbittorrent';
import { jobStatus } from '../schedule';
import { configService } from '../service/config';
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
    const result = await driver115.getUserInfo();
    if (result) {
      resSuccess(ctx, {
        data: result,
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
    const picConfig = await configService.getConfig(['is_picture_115_caching', 'picture_115_cids']);
    resSuccess(ctx, {
      data: {
        count,
        paths: picConfig?.picture_115_cids?.split(',') || [],
        loading: Boolean(picConfig?.is_picture_115_caching === 'true'),
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
    const picConfig = await configService.getConfig(['is_picture_115_caching', 'picture_115_cids']);

    if (picConfig?.is_picture_115_caching === 'true') {
      resError(ctx, {
        code: 400,
        message: '正在缓存中，请稍后再试',
      });
      return;
    }

    if (type === 'delete') {
      await File115Service.clearAll();
    }

    configService.setConfig('is_picture_115_caching', 'true');
    // 开始缓存
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
    const fileName = metaInfo?.file_name || 'unkonwn.jpg';
    if (isDirect) {
      const result = await request.get(url, {
        responseType: 'stream',
        headers: {
          'User-Agent': ua,
        },
      });
      ctx.set('Content-Type', mime.lookup(fileName) || 'image/png');
      ctx.body = result.data;
      return;
    }

    const setuHtml = `${getRootPath()}/app/views/setu.ejs`;
    const html = await ejs.renderFile(setuHtml, {
      url: url,
    });
    ctx.set('Content-Type', 'text/html');
    ctx.body = html;
  };
  static startQbit: MyMiddleware = async (ctx, next) => {
    const result = await qbittorrent.startAll();
    resSuccess(ctx, {
      data: result,
    });
  };
  static pauseQbit: MyMiddleware = async (ctx, next) => {
    const result = await qbittorrent.pauseAll();
    resSuccess(ctx, {
      data: result,
    });
  };
  static changeJob: MyMiddleware = async (ctx, next) => {
    const body = ctx.request.body;
    if (body.qbit) {
      jobStatus.qbit = true;
    } else {
      jobStatus.qbit = false;
    }
    resSuccess(ctx, {
      data: jobStatus,
    });
  };
  static getJob: MyMiddleware = async (ctx, next) => {
    resSuccess(ctx, {
      data: jobStatus,
    });
  };
  static test: MyMiddleware = async (ctx, next) => {
    resSuccess(ctx);
  };
}

export default UtilController;
