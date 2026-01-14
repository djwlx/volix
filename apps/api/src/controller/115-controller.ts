import ejs from 'ejs';
import { one15Driver } from '../drive';
import { configService, file115Service } from '../service';
import { generateRandomNumber } from '../utils/number';
import { PATH } from '../utils/path';
import request from '../utils/request';
import mime from 'mime-types';
import { resError, resSuccess } from '../utils/response';
import { log } from '../utils/logger';
import { calculateTimeDifference, waitTime } from '../utils/date';
import { BaseController } from './base-controller';
import { TokenType } from '../drive/115/types';
import { PicInfoParams } from '@volix/types';

class One15Controller extends BaseController {
  // 文件信息存到数据库中
  private saveFile = async (dataList: any[]) => {
    const list = dataList.map(item => {
      return {
        name: item.n,
        class: item.class,
        pc: item.pc,
      };
    });
    await file115Service.setFileList(list);
  };
  // 根据路径遍历缓存图片
  private initRandomPic = async (paths?: string[]) => {
    const cidList = paths ? paths : ['3068034200407132056', '2823447377226661136'];
    const limit = 500;
    const timer = 3000;
    const start = Date.now();
    let resultNum = 0;
    log.info('开始缓存图片');
    const getPicFileList = async (cid: string) => {
      const result = await one15Driver.getFileList(0, 1, cid);
      const count = result.count;
      const nextCidList: string[] = [];

      for (let i = 0; i < count; i += limit) {
        const dataList: any = [];
        const nowResult = await one15Driver.getFileList(i, limit, cid);
        const fileList: any = nowResult.data;
        fileList.forEach((item: any) => {
          // 图片
          if (item.fid && item.class === 'PIC') {
            resultNum++;
            dataList.push(item);
          }
          // 文件夹
          if (!item.fid) {
            nextCidList.push(item.cid);
          }
        });

        if (dataList.length > 0) {
          await this.saveFile(dataList);
        }

        await waitTime(timer);
      }

      for (let i = 0; i < nextCidList.length; i++) {
        await getPicFileList(nextCidList[i]);
      }
    };
    try {
      for (let i = 0; i < cidList.length; i++) {
        await getPicFileList(cidList[i]);
      }
      const end = Date.now();
      log.info('缓存图片完成,耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
    } finally {
      configService.setConfig('is_picture_115_caching', 'false');
      if (paths) {
        configService.setConfig('picture_115_cids', paths?.join(','));
      }
    }
  };
  // 随机图片
  randowPic = this.res(async ctx => {
    const ua = ctx.request.headers['user-agent'];
    const { mode } = ctx.query || {};
    const isDirect = mode === 'direct';
    const len = await file115Service.getFileLen();
    const index = generateRandomNumber(0, len);
    const fileInfo = await file115Service.getFileByIndex(index);
    const pc = fileInfo?.pc;
    const result = await one15Driver.getFile(pc as string, ua as string);
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
    const setuHtml = `${PATH.root}/app/views/setu.ejs`;
    const html = await ejs.renderFile(setuHtml, {
      url: url,
      fileName,
    });
    ctx.set('Content-Type', 'text/html');
    ctx.body = html;
  });
  // 获取缓存的图片信息
  get115PicInfo = this.res(async () => {
    const count = await file115Service.getFileLen();
    const picConfig = await configService.getConfig(['is_picture_115_caching', 'picture_115_cids']);
    return {
      count,
      paths: picConfig?.picture_115_cids?.split(',') || [],
      loading: Boolean(picConfig?.is_picture_115_caching === 'true'),
    };
  });
  // 设置图片缓存
  set115PicInfo = this.res(async ctx => {
    const { paths, type } = ctx.request.body as PicInfoParams;
    if (!paths || paths?.length === 0 || !type) {
      resError(ctx, {
        code: 400,
        message: '参数错误',
      });
      return;
    }
    const picConfig = await configService.getConfig(['is_picture_115_caching']);

    if (picConfig?.is_picture_115_caching === 'true') {
      resError(ctx, {
        code: 400,
        message: '正在缓存中，请稍后再试',
      });
      return;
    }

    if (type === 'delete') {
      await file115Service.clearAll();
    }

    configService.setConfig('is_picture_115_caching', 'true');
    // 开始缓存
    this.initRandomPic(paths);

    return {
      paths,
      loading: true,
    };
  });
  // 获取115登录信息;
  get115UserInfo = this.res(async ctx => {
    const result = await one15Driver.getUserInfo();
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
  });
  // 退出115
  exit115 = this.res(async () => {
    await one15Driver.exit();
    return true;
  });
  // 获取115登录二维码
  get115QrCode = this.res(async (ctx, next) => {
    const result = await one15Driver.getQrCode();
    return result;
  });
  // 查询二维码登录状态
  get115QrCodeStatus = this.res(async (ctx, next) => {
    const { query } = ctx.request;
    const result = await one15Driver.getQrStatus(query as unknown as TokenType);
    return result.data;
  });
  // 登录到115
  login115WithApp = this.res(async (ctx, next) => {
    const { body } = ctx.request;
    const { uid, app } = body;
    if (uid && app) {
      const result = await one15Driver.LoginQrCodeWithApp(uid, app);
      return result;
    } else {
      resError(ctx, {
        code: 400,
        message: 'uid或app不能为空',
      });
    }
  });
  // 获取文件列表
  get115FileList = this.res(async (ctx, next) => {
    const { offset, pageSize } = ctx.query || {};
    const { cid } = ctx.params;
    const result = await one15Driver.getFileList(Number(offset), Number(pageSize), cid as string);
    return result;
  });
  // 获取文件信息
  get115File = this.res(async (ctx, next) => {
    const { pc } = ctx.params;
    const ua = ctx.request.headers['user-agent'];
    const result = await one15Driver.getFile(pc as string, ua as string);
    return result;
  });
  // 清除缓存图片
  clear115Pic = this.res(async (ctx, next) => {
    await file115Service.clearAll();
    await configService.setConfig('picture_115_cids', '');
    await configService.setConfig('is_picture_115_caching', 'false');
    return 'success';
  });
}

const one15Controller = new One15Controller();
export { one15Controller };
