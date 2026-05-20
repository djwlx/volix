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
import { getFile115ByPc } from '../service/file-db.service';
import { getLocalRandomPicCacheByPc, getRandomCacheConfig } from '../service/picture/picture-cache-random-core';
import { ensureRandomLocalPicCacheByFile } from '../service/picture/picture-cache-fs-folder';
import {
  clear115PicData,
  getLiked115PicListData,
  get115PicInfoData,
  get115PicCacheFileByPcData,
  get115RandomPicCacheFileData,
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

const isEnabledQueryFlag = (value: unknown) => {
  const text = String(value || '')
    .trim()
    .toLowerCase();
  return text === '1' || text === 'true' || text === 'yes' || text === 'on';
};

const toRandomPicResponseUrl = (rawUrl: string, pc: string, preferProxy: boolean) => {
  if (!preferProxy) {
    return rawUrl;
  }
  if (rawUrl.startsWith('/api/115/pic/')) {
    return rawUrl;
  }
  return `/api/115/pic/cache/${encodeURIComponent(pc)}`;
};

const toAbsoluteRemoteUrl = (value: string) => {
  const text = String(value || '').trim();
  if (!/^https?:\/\//i.test(text)) {
    return '';
  }
  try {
    const url = new URL(text);
    const normalizedPath = String(url.pathname || '').trim();
    if (!normalizedPath || normalizedPath === '/') {
      url.pathname = '/api/115/pic';
    }
    return url.toString();
  } catch {
    return '';
  }
};

const buildRemoteEndpointUrl = (endpoint: string, params: Record<string, string | undefined>) => {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const buildRemoteParentRandomEndpoint = (endpoint: string) => {
  const url = new URL(endpoint);
  if (url.pathname.endsWith('/pic/parent-random')) {
    return url.toString();
  }
  if (url.pathname.endsWith('/pic')) {
    url.pathname = `${url.pathname}/parent-random`;
  } else if (url.pathname.endsWith('/pic/')) {
    url.pathname = `${url.pathname}parent-random`;
  }
  return url.toString();
};

const isSelfReferencingRandomPicEndpoint = (
  ctx: {
    request?: {
      headers?: Record<string, unknown>;
    };
  },
  endpoint: string
) => {
  const host = String(ctx.request?.headers?.host || '')
    .trim()
    .toLowerCase();
  if (!host) {
    return false;
  }
  try {
    const url = new URL(endpoint);
    const endpointHost = String(url.host || '')
      .trim()
      .toLowerCase();
    const endpointPath = String(url.pathname || '').trim();
    if (!endpointHost || endpointHost !== host) {
      return false;
    }
    return endpointPath === '/api/115/pic' || endpointPath === '/api/115/pic/parent-random';
  } catch {
    return false;
  }
};

const parseRemoteRandomPicPayload = (payload: unknown) => {
  const wrapped = payload as { data?: unknown } | undefined;
  const data = wrapped && typeof wrapped === 'object' && 'data' in wrapped ? wrapped.data : payload;
  const item = (data || {}) as Record<string, unknown>;
  const url = String(item.url || '').trim();
  if (!url) {
    return null;
  }
  const fileName = String(item.fileName || '').trim() || 'unknown.jpg';
  const cid = String(item.cid || '').trim();
  const pc = String(item.pc || '').trim();
  const path = String(item.path || '').trim();
  const parentPath = String(item.parentPath || '').trim();
  const liked = Boolean(item.liked);
  const noticeText = String(item.notice || '').trim();
  return {
    url,
    fileName,
    cid,
    pc,
    path,
    parentPath,
    liked,
    notice: noticeText || undefined,
  };
};

const getConfiguredRandomPicOptions = async () => {
  const config = await getRandomCacheConfig();
  return {
    endpoint: toAbsoluteRemoteUrl(config.randomPicEndpoint || ''),
    localProxyEnabled: Boolean(config.localProxyEnabled),
  };
};

const getRemoteRandomPicMeta = async (endpoint: string, userAgent: string) => {
  const result = await request.get(endpoint, {
    headers: {
      'User-Agent': userAgent,
    },
  });
  const parsed = parseRemoteRandomPicPayload(result.data);
  if (!parsed) {
    badRequest('随机图片端点返回数据无效');
    return {
      url: '',
      fileName: 'unknown.jpg',
      cid: '',
      pc: '',
      path: '',
      parentPath: '',
      liked: false,
      notice: undefined,
    };
  }
  return parsed;
};

const ensureLocalProxyUrlByPc = async (pc: string, userAgent: string) => {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    badRequest('随机图片缺少 pc，无法本地代理');
  }
  const file = await getFile115ByPc(normalizedPc);
  if (!file) {
    badRequest('未找到随机图片缓存记录，无法本地代理');
  }
  const safeFile = file as NonNullable<typeof file>;
  await ensureRandomLocalPicCacheByFile(safeFile, userAgent, {
    force: true,
  });
  const cached = await getLocalRandomPicCacheByPc(normalizedPc);
  if (!cached) {
    badRequest('随机图片本地缓存失败');
  }
  const safeCached = cached as NonNullable<typeof cached>;
  return safeCached.url;
};

export const getRandom115Pic: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const { mode, proxy } = ctx.query || {};
  const isDirect = mode === 'direct';
  const isJson = mode === 'json';
  const randomPicOptions = await getConfiguredRandomPicOptions();
  const preferProxy = randomPicOptions.localProxyEnabled || isEnabledQueryFlag(proxy);
  const remoteEndpoint = randomPicOptions.endpoint;

  if (remoteEndpoint) {
    if (isSelfReferencingRandomPicEndpoint(ctx, remoteEndpoint)) {
      badRequest('随机图片端点不能指向当前服务随机图接口');
    }

    if (isDirect) {
      const remoteDirectUrl = buildRemoteEndpointUrl(remoteEndpoint, {
        mode: 'direct',
        proxy: preferProxy || randomPicOptions.localProxyEnabled ? '1' : undefined,
      });
      const streamResult = await request.get(remoteDirectUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': ua,
        },
      });
      const contentType = String(streamResult.headers['content-type'] || '').trim();
      if (contentType) {
        ctx.set('Content-Type', contentType);
      }
      ctx.body = streamResult.data;
      return;
    }

    const remoteJsonUrl = buildRemoteEndpointUrl(remoteEndpoint, {
      mode: 'json',
      proxy: preferProxy || randomPicOptions.localProxyEnabled ? '1' : undefined,
    });
    const remoteMeta = await getRemoteRandomPicMeta(remoteJsonUrl, String(ua || ''));

    if (isJson) {
      return remoteMeta;
    }

    const setuHtml = `${PATH.root}/src/views/setu.ejs`;
    const html = await ejs.renderFile(setuHtml, {
      url: remoteMeta.url,
      fileName: remoteMeta.fileName,
    });

    ctx.set('Content-Type', 'text/html');
    ctx.body = html;
    return;
  }

  const { url, fileName, cid, pc, path, parentPath, liked, localCacheFilePath, localCacheMimeType, notice } =
    await getRandom115PicMeta(ua as string);
  const responseUrl =
    randomPicOptions.localProxyEnabled && pc
      ? await ensureLocalProxyUrlByPc(pc, String(ua || ''))
      : toRandomPicResponseUrl(url, pc, preferProxy);

  if (isDirect && randomPicOptions.localProxyEnabled && pc) {
    const source = await getLocalRandomPicCacheByPc(pc);
    if (source) {
      ctx.set('Content-Type', source.mimeType || mime.lookup(source.fileName) || 'image/png');
      ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
      ctx.body = fs.createReadStream(source.filePath);
      return;
    }
  }

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
      url: responseUrl,
      fileName,
      cid,
      pc,
      path,
      parentPath,
      liked,
      notice,
    };
  }

  const setuHtml = `${PATH.root}/src/views/setu.ejs`;
  const html = await ejs.renderFile(setuHtml, {
    url: responseUrl,
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
  const randomPicOptions = await getConfiguredRandomPicOptions();
  const preferProxy = randomPicOptions.localProxyEnabled || isEnabledQueryFlag(ctx.query?.proxy);
  const remoteEndpoint = randomPicOptions.endpoint;

  if (remoteEndpoint) {
    if (isSelfReferencingRandomPicEndpoint(ctx, remoteEndpoint)) {
      badRequest('随机图片端点不能指向当前服务随机图接口');
    }
    const remoteParentEndpoint = buildRemoteParentRandomEndpoint(remoteEndpoint);
    const remoteParentUrl = buildRemoteEndpointUrl(remoteParentEndpoint, {
      mode: 'json',
      pc,
      proxy: preferProxy || randomPicOptions.localProxyEnabled ? '1' : undefined,
    });
    return getRemoteRandomPicMeta(remoteParentUrl, String(ua || ''));
  }

  const result = await getRandom115PicFromParentMeta({
    pc,
    userAgent: ua as string,
  });
  const responseUrl =
    randomPicOptions.localProxyEnabled && result.pc
      ? await ensureLocalProxyUrlByPc(result.pc, String(ua || ''))
      : toRandomPicResponseUrl(result.url, result.pc, preferProxy);
  return {
    ...result,
    url: responseUrl,
  };
};

export const get115PicPathByPc: MyMiddleware = async ctx => {
  const pc = String(ctx.query?.pc || '');
  return get115PicPathByPcData(pc);
};

export const get115PicCacheFileByPc: MyMiddleware = async ctx => {
  const pc = String(ctx.params?.pc || '');
  const ua = ctx.request.headers['user-agent'];
  const source = await get115PicCacheFileByPcData(pc, String(ua || ''));

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
  const source = await get115RandomPicCacheFileData(cacheFileName);

  ctx.set('Content-Type', source.mimeType || 'application/octet-stream');
  ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(source.fileName)}"`);
  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.body = fs.createReadStream(source.filePath);
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
