import ejs from 'ejs';
import mime from 'mime-types';
import type { PicInfoParams, QrCodeStatusParams } from '@volix/types';
import { PATH } from '../../../utils/path';
import request from '../../../utils/request';
import { resSuccess } from '../../../utils/response';
import { badRequest } from '../../shared/http-handler';
import { get115FileData, get115FileListData } from '../service/file.service';
import { clear115PicData, get115PicInfoData, getRandom115PicMeta, set115PicInfoData } from '../service/picture.service';
import { get115QrCodeData, get115QrCodeStatusData } from '../service/qrcode.service';
import { exit115AndClearCookie, login115WithAppAndSaveCookie } from '../service/session.service';
import { get115UserInfoData } from '../service/user.service';

export const getRandom115Pic: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const { mode } = ctx.query || {};
  const isDirect = mode === 'direct';
  const isJson = mode === 'json';
  const { url, fileName } = await getRandom115PicMeta(ua as string);

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

export const set115PicInfo: MyMiddleware = async ctx => {
  return set115PicInfoData(ctx.request.body as PicInfoParams);
};

export const clear115Pic: MyMiddleware = async () => {
  return clear115PicData();
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
    message: '未登录',
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
    badRequest('uid或app不能为空');
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
