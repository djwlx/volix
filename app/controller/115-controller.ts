import ejs from 'ejs';
import { one15Driver } from '../drive';
import { configService, file115Service } from '../service';
import { generateRandomNumber } from '../utils/number';
import { getRootPath } from '../utils/path';
import request from '../utils/request';
import mime from 'mime-types';
import { resError } from '../utils/response';
import { log } from '../utils/logger';
import { calculateTimeDifference, waitTime } from '../utils/date';
import { BaseController } from './base-controller';

class One15Controller extends BaseController {
  // 文件信息存到数据库中
  private saveFile = async (dataList: any[]) => {
    const list = dataList.map((item) => {
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
        fileList.forEach((item) => {
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

    for (let i = 0; i < cidList.length; i++) {
      await getPicFileList(cidList[i]);
    }
    const end = Date.now();
    log.info('缓存图片完成,耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
    configService.setConfig('is_picture_115_caching', 'false');
    if (paths) {
      configService.setConfig('picture_115_cids', paths?.join(','));
    }
  };
  // 随机图片
  randowPic = this.res(async (ctx, next) => {
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
    const setuHtml = `${getRootPath()}/app/views/setu.ejs`;
    const html = await ejs.renderFile(setuHtml, {
      url: url,
    });
    ctx.set('Content-Type', 'text/html');
    ctx.body = html;
  });
  // 获取缓存的图片信息
  get115PicInfo = this.res(async (ctx, next) => {
    const count = await file115Service.getFileLen();
    const picConfig = await configService.getConfig(['is_picture_115_caching', 'picture_115_cids']);
    return {
      count,
      paths: picConfig?.picture_115_cids?.split(',') || [],
      loading: Boolean(picConfig?.is_picture_115_caching === 'true'),
    };
  });
  // 设置图片缓存
  set115PicInfo = this.res(async (ctx, next) => {
    const { paths, type } = ctx.request.body;
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
}

const one15Controller = new One15Controller();
export { one15Controller };
