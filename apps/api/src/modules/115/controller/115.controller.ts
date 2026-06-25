import ejs from 'ejs';
import fs from 'fs';
import mime from 'mime-types';
import type {
  ClearPicInfoParams,
  Like115PicParams,
  PicInfoParams,
  QrCodeStatusParams,
  RetryPicInfoParams,
  SetPicRandomCacheConfigParams,
} from '@volix/types';
import { PATH } from '../../../utils/path';
import request from '../../../utils/request';
import { resSuccess } from '../../../utils/response';
import { badRequest } from '../../shared/http-handler';
import { get115FileData, get115FileListData } from '../service/file.service';
import { getRandomCacheConfig } from '../service/picture/picture-cache-random-core';
import {
  clear115PicData,
  getLiked115PicListData,
  get115PicInfoData,
  get115PicCacheFileByPcData,
  get115RandomPicCacheFileData,
  getRandom115PicFromCacheCidMeta,
  getRandom115PicMeta,
  getRandom115PicFromParentMeta,
  get115PicPathByPcData,
  like115PicData,
  retry115PicData,
  set115PicRandomCacheConfigData,
  set115PicInfoData,
} from '../service/picture.service';
import { get115QrCodeData, get115QrCodeStatusData } from '../service/qrcode.service';
import { exit115AndClearCookie, login115WithAppAndSaveCookie } from '../service/session.service';
import { get115UserInfoData } from '../service/user.service';
import { t } from '../../../utils/i18n';

export const getRandom115Pic: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const { mode } = ctx.query || {};
  const isDirect = mode === 'direct';
  const isJson = mode === 'json';
  const randomCacheConfig = await getRandomCacheConfig();

  const { url, fileName, cid, pc, path, parentPath, liked, localCacheFilePath, localCacheMimeType, notice } =
    await getRandom115PicMeta(ua as string);

  if (isDirect && localCacheFilePath) {
    ctx.set('Content-Type', localCacheMimeType || mime.lookup(fileName) || 'image/png');
    ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
    ctx.body = fs.createReadStream(localCacheFilePath);
    return;
  }

  if (isDirect) {
    const streamResult = await request.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': ua,
      },
    });
    ctx.set('Content-Type', mime.lookup(fileName) || 'image/png');
    ctx.body = streamResult.data;
    return;
  }

  if (isJson) {
    return {
      url,
      fileName,
      cid,
      pc,
      path,
      parentPath,
      liked,
      notice,
      remoteSource: false,
      autoPlayIntervalSeconds: randomCacheConfig.autoPlayIntervalSeconds,
    };
  }

  const setuHtml = `${PATH.root}/src/views/setu.ejs`;
  const html = await ejs.renderFile(setuHtml, {
    url,
    fileName,
  });

  ctx.set('Content-Type', 'text/html');
  ctx.body = html;
};

export const get115PicInfo: MyMiddleware = async () => {
  return get115PicInfoData();
};

export const getRandom115PicByParent: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const pc = String(ctx.query?.pc || '');
  const randomCacheConfig = await getRandomCacheConfig();
  const result = await getRandom115PicFromParentMeta({
    pc,
    userAgent: ua as string,
  });
  return {
    ...result,
    url: result.url,
    remoteSource: false,
    autoPlayIntervalSeconds: randomCacheConfig.autoPlayIntervalSeconds,
  };
};

export const getRandom115PicByCacheCid: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const cid = String(ctx.query?.cid || '');
  const randomCacheConfig = await getRandomCacheConfig();
  const result = await getRandom115PicFromCacheCidMeta({
    cid,
    userAgent: ua as string,
  });
  return {
    ...result,
    url: result.url,
    remoteSource: false,
    autoPlayIntervalSeconds: randomCacheConfig.autoPlayIntervalSeconds,
  };
};

export const get115PicPathByPc: MyMiddleware = async ctx => {
  const pc = String(ctx.query?.pc || '');
  return get115PicPathByPcData(pc);
};

export const get115PicCacheFileByPc: MyMiddleware = async ctx => {
  const pc = String(ctx.params?.pc || '');
  const ua = ctx.request.headers['user-agent'];
  const format = String(ctx.query?.format || '');
  const source = await get115PicCacheFileByPcData(pc, String(ua || ''), format, {
    width: String(ctx.query?.w || ''),
    quality: String(ctx.query?.q || ''),
  });

  if (source.kind === 'local') {
    ctx.set('Content-Type', source.mimeType || 'application/octet-stream');
    ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(source.fileName)}"`);
    ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
    ctx.body = fs.createReadStream(source.filePath);
    return;
  }

  const streamResult = await request.get(source.url, {
    responseType: 'stream',
    headers: {
      'User-Agent': ua,
    },
  });
  ctx.set('Content-Type', source.mimeType || mime.lookup(source.fileName) || 'image/png');
  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.body = streamResult.data;
};

export const get115RandomPicCacheFile: MyMiddleware = async ctx => {
  const cacheFileName = String(ctx.params?.cacheFileName || '');
  const ua = ctx.request.headers['user-agent'];
  const source = await get115RandomPicCacheFileData(cacheFileName, String(ua || ''));

  if (source.kind === 'local') {
    ctx.set('Content-Type', source.mimeType || 'application/octet-stream');
    ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(source.fileName)}"`);
    ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
    ctx.body = fs.createReadStream(source.filePath);
    return;
  }

  const streamResult = await request.get(source.url, {
    responseType: 'stream',
    headers: {
      'User-Agent': ua,
    },
  });
  ctx.set('Content-Type', source.mimeType || mime.lookup(source.fileName) || 'image/png');
  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.body = streamResult.data;
};

export const get115LikedPicList: MyMiddleware = async ctx => {
  const offset = Number(ctx.query?.offset || 0);
  const pageSize = Number(ctx.query?.pageSize || 50);
  const ua = ctx.request.headers['user-agent'];

  return getLiked115PicListData(
    {
      offset,
      pageSize,
    },
    String(ua || '')
  );
};

export const set115PicInfo: MyMiddleware = async ctx => {
  return set115PicInfoData(ctx.request.body as PicInfoParams);
};

export const set115PicRandomCacheConfig: MyMiddleware = async ctx => {
  return set115PicRandomCacheConfigData(ctx.request.body as SetPicRandomCacheConfigParams);
};

export const clear115Pic: MyMiddleware = async ctx => {
  const body = (ctx.request.body || {}) as ClearPicInfoParams;
  const queryPaths = typeof ctx.query?.paths === 'string' ? ctx.query.paths.split(',') : [];
  const queryFolderPaths = typeof ctx.query?.folderPaths === 'string' ? ctx.query.folderPaths.split(',') : [];
  return clear115PicData({
    paths: body.paths?.length ? body.paths : queryPaths,
    folderPaths: body.folderPaths?.length ? body.folderPaths : queryFolderPaths,
  });
};

export const retry115Pic: MyMiddleware = async ctx => {
  return retry115PicData(ctx.request.body as RetryPicInfoParams);
};

export const like115Pic: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  return like115PicData(ctx.request.body as Like115PicParams, String(ua || ''));
};

export const get115UserInfo: MyMiddleware = async ctx => {
  const result = await get115UserInfoData();
  if (result) {
    resSuccess(ctx, {
      data: result,
    });
    return;
  }

  resSuccess(ctx, {
    code: 1,
    message: t('auth.unauthorized'),
  });
};

export const exitCloud115: MyMiddleware = async () => {
  await exit115AndClearCookie();
  return true;
};

export const get115QrCode: MyMiddleware = async () => {
  return get115QrCodeData();
};

export const get115QrCodeStatus: MyMiddleware = async ctx => {
  const { query } = ctx.request;
  return get115QrCodeStatusData(query as unknown as QrCodeStatusParams);
};

export const login115ByApp: MyMiddleware = async ctx => {
  const { uid, app } = ctx.request.body;
  if (!uid || !app) {
    badRequest(t('pic115Api.loginParamsRequired'));
  }

  return login115WithAppAndSaveCookie(uid, app);
};

export const get115FileList: MyMiddleware = async ctx => {
  const { offset, pageSize } = ctx.query || {};
  const { cid } = ctx.params;
  return get115FileListData(Number(offset), Number(pageSize), cid as string);
};

export const get115File: MyMiddleware = async ctx => {
  const { pc } = ctx.params;
  const ua = ctx.request.headers['user-agent'];
  return get115FileData(pc as string, ua as string);
};
