import fs from 'fs';
import { pipeline } from 'stream/promises';
import { waitTime } from '../../../../utils/date';
import request from '../../../../utils/request';
import { DEFAULT_115_DOWNLOAD_UA } from './picture-cache-random-core';
import { buildPicCacheDownloadRequestUrl } from './picture-download-url';

const RETRYABLE_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
]);
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 300;

type PicCacheStreamResponse = {
  data: NodeJS.ReadableStream;
};

type PicCacheRequestConfig = {
  responseType: 'stream';
  headers: {
    'User-Agent': string;
  };
  muteErrorLog?: boolean;
};

type PicCacheRequestGet = (
  url: string,
  config: PicCacheRequestConfig
) => Promise<PicCacheStreamResponse>;

const getErrorCode = (error: unknown) => {
  return typeof (error as { code?: unknown })?.code === 'string'
    ? String((error as { code: string }).code)
    : '';
};

const getErrorStatus = (error: unknown) => {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === 'number' ? status : undefined;
};

const removeFileIfExists = async (filePath: string) => {
  await fs.promises
    .access(filePath, fs.constants.F_OK)
    .then(() => fs.promises.unlink(filePath))
    .catch(() => undefined);
};

export const isRetryablePicCacheDownloadError = (error: unknown) => {
  const code = getErrorCode(error);
  if (code && RETRYABLE_ERROR_CODES.has(code)) {
    return true;
  }

  const status = getErrorStatus(error);
  return typeof status === 'number' ? RETRYABLE_STATUS_CODES.has(status) : false;
};

export const requestPicCacheDownloadStream = async (params: {
  requestUrl: string;
  userAgent?: string;
  maxAttempts?: number;
  retryDelayMs?: number;
  requestGet?: PicCacheRequestGet;
}) => {
  const requestGet = params.requestGet || (request.get.bind(request) as PicCacheRequestGet);
  const maxAttempts = Math.max(1, Number(params.maxAttempts || DEFAULT_RETRY_ATTEMPTS));
  const retryDelayMs = Math.max(0, Number(params.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS));
  const safeUserAgent = String(params.userAgent || DEFAULT_115_DOWNLOAD_UA).trim() || DEFAULT_115_DOWNLOAD_UA;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestGet(params.requestUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': safeUserAgent,
        },
        muteErrorLog: attempt < maxAttempts,
      });
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryablePicCacheDownloadError(error)) {
        throw error;
      }
      if (retryDelayMs > 0) {
        await waitTime(retryDelayMs);
      }
    }
  }

  throw lastError;
};

export const downloadPicCacheToTempFile = async (params: {
  originUrl: string;
  cloudProxyUrl: string;
  userAgent?: string;
  tempPath: string;
  requestGet?: PicCacheRequestGet;
}) => {
  const safeUserAgent = String(params.userAgent || DEFAULT_115_DOWNLOAD_UA).trim() || DEFAULT_115_DOWNLOAD_UA;
  const requestUrl = buildPicCacheDownloadRequestUrl({
    originUrl: params.originUrl,
    cloudProxyUrl: params.cloudProxyUrl,
    userAgent: safeUserAgent,
  });

  try {
    const response = await requestPicCacheDownloadStream({
      requestUrl,
      userAgent: safeUserAgent,
      requestGet: params.requestGet,
    });
    await pipeline(response.data, fs.createWriteStream(params.tempPath));
    const stat = await fs.promises.stat(params.tempPath);
    return {
      sizeBytes: Number(stat.size || 0),
    };
  } catch (error) {
    await removeFileIfExists(params.tempPath);
    throw error;
  }
};
