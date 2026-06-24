import type { AxiosRequestConfig } from 'axios';
import request from '../../utils/request';
import { getRequestUserAgent } from '../../utils/request-context';
import type {
  AstrbotMessageContent,
  AstrbotMessagePart,
  AstrbotMessagePartType,
  AstrbotRequestOptions,
  AstrbotSendMessageInput,
  AstrbotSendResult,
  AstrbotUploadedFile,
  CreateAstrbotSdkOptions,
} from './types';
import { createAstrbotChatMethods } from './groups/astrbot-chat';
import { createAstrbotImMethods } from './groups/astrbot-im';
import { createAstrbotBotMethods } from './groups/astrbot-bots';
import { createAstrbotProviderMethods } from './groups/astrbot-providers';
import { createAstrbotSystemConfigMethods } from './groups/astrbot-system-config';
import { createAstrbotFileMethods } from './groups/astrbot-files';

const DEFAULT_ASTRBOT_USER_AGENT = 'djwl/volix';

const normalizePath = (path: string) => {
  const text = String(path || '').trim();
  if (!text) {
    throw new Error('AstrBot path 不能为空');
  }
  return text.startsWith('/') ? text : `/${text}`;
};

const MEDIA_SEGMENT_TYPES: AstrbotMessagePartType[] = ['image', 'record', 'video', 'file'];

// 依据上传返回的 type 或附件 MIME 推断消息段类型。MIME（如 image/jpeg）映射到对应媒体段，
// 否则回退 file。
const toMediaSegmentType = (uploadedType?: string, contentType?: string): AstrbotMessagePartType => {
  const normalizedType = String(uploadedType || '').toLowerCase();
  if (MEDIA_SEGMENT_TYPES.includes(normalizedType as AstrbotMessagePartType)) {
    return normalizedType as AstrbotMessagePartType;
  }
  const mimeValue = String(contentType || normalizedType).toLowerCase();
  if (mimeValue.startsWith('image/')) {
    return 'image';
  }
  if (mimeValue.startsWith('video/')) {
    return 'video';
  }
  if (mimeValue.startsWith('audio/')) {
    return 'record';
  }
  return 'file';
};

const normalizeUmoList = (umos?: string[]): string[] =>
  Array.from(new Set((umos || []).map(item => String(item || '').trim()).filter(Boolean)));

const resolveTargetUmos = (input?: string | string[], fallback: string[] = []): string[] => {
  if (Array.isArray(input)) {
    return normalizeUmoList(input);
  }
  if (typeof input === 'string' && input.trim()) {
    return [input.trim()];
  }
  return fallback;
};

export function createAstrbotSdk(options: CreateAstrbotSdkOptions) {
  const baseUrl = String(options?.baseUrl || '')
    .trim()
    .replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('AstrBot baseUrl 不能为空');
  }
  const userAgent = String(options?.userAgent || getRequestUserAgent() || DEFAULT_ASTRBOT_USER_AGENT).trim();
  let apiKey = String(options?.apiKey || '').trim();
  let bearerToken = String(options?.bearerToken || '').trim();

  const requestAstrbot = async <T = unknown>(params: AstrbotRequestOptions): Promise<T> => {
    if (params.requireAuth && !apiKey && !bearerToken) {
      throw new Error('AstrBot apiKey 不存在');
    }

    const config: AxiosRequestConfig = {
      baseURL: baseUrl,
      url: normalizePath(params.path),
      method: params.method || 'GET',
      params: params.params,
      data: params.data,
      headers: {
        Accept: 'application/json',
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(params.headers || {}),
      },
    };

    const response = await request<T>(config);
    // AstrBot 对不存在的路由返回 HTTP 200 + HTML 兜底页（"404 Not found…"），
    // 这里主动识别并抛错，避免静默把兜底 HTML 当成功结果返回。
    const contentType = String((response.headers as Record<string, unknown> | undefined)?.['content-type'] || '');
    const data = response.data as unknown;
    if (contentType.includes('text/html') && typeof data === 'string' && /404\s*not\s*found/i.test(data)) {
      throw new Error(`AstrBot 接口不存在或当前部署版本不支持: ${normalizePath(params.path)}`);
    }
    // AstrBot 统一返回 { status, message, data }；status 为 error 时即便 HTTP 200 也属于失败，
    // 必须主动抛错，避免把失败（如发送失败）当成功。
    if (data && typeof data === 'object') {
      const envelope = data as { status?: unknown; message?: unknown };
      if (envelope.status === 'error') {
        const message =
          typeof envelope.message === 'string' && envelope.message ? envelope.message : 'AstrBot 请求失败';
        throw new Error(message);
      }
    }
    return response.data;
  };

  let defaultUmos = normalizeUmoList(options?.umos);

  const setApiKey = (nextApiKey?: string) => {
    apiKey = String(nextApiKey || '').trim();
  };
  const setBearerToken = (nextToken?: string) => {
    bearerToken = String(nextToken || '').trim();
  };
  const setUmos = (nextUmos?: string[]) => {
    defaultUmos = normalizeUmoList(nextUmos);
  };

  const fileMethods = createAstrbotFileMethods(requestAstrbot);
  const imMethods = createAstrbotImMethods(requestAstrbot);

  // 完整发消息能力：自动上传媒体附件（仅一次）、组装消息段，再投递到一个或多个 umo
  // （缺省用配置的默认 umos）。返回每个目标的发送结果。
  const sendMessage = async (input: AstrbotSendMessageInput): Promise<AstrbotSendResult[]> => {
    const targets = resolveTargetUmos(input?.umo, defaultUmos);
    if (targets.length === 0) {
      throw new Error('AstrBot umo 不能为空');
    }
    const text = typeof input?.text === 'string' ? input.text : '';
    const attachments = input?.attachments || [];

    if (!text && attachments.length === 0) {
      throw new Error('AstrBot 消息内容不能为空');
    }

    let message: AstrbotMessageContent;
    if (attachments.length === 0) {
      message = text;
    } else {
      const segments: AstrbotMessagePart[] = [];
      if (text) {
        segments.push({ type: 'plain', text });
      }
      // 媒体只上传一次，attachment_id 在多个 umo 之间复用
      for (const attachment of attachments) {
        const uploaded = await fileMethods.uploadFile<{ data?: AstrbotUploadedFile }>(attachment);
        const file = uploaded?.data;
        if (!file?.attachment_id) {
          throw new Error('AstrBot 附件上传失败：未返回 attachment_id');
        }
        segments.push({
          type: toMediaSegmentType(file.type, attachment.contentType),
          attachment_id: file.attachment_id,
        });
      }
      message = segments;
    }

    const results: AstrbotSendResult[] = [];
    for (const umo of targets) {
      const response = await imMethods.sendImMessage({ umo, message });
      results.push({ umo, response });
    }
    return results;
  };

  return {
    getBaseUrl: () => baseUrl,
    getApiKey: () => apiKey,
    getUmos: () => defaultUmos,
    setApiKey,
    setBearerToken,
    setUmos,
    requestAstrbot,
    sendMessage,
    ...createAstrbotChatMethods(requestAstrbot),
    ...imMethods,
    ...createAstrbotBotMethods(requestAstrbot),
    ...createAstrbotProviderMethods(requestAstrbot),
    ...createAstrbotSystemConfigMethods(requestAstrbot),
    ...fileMethods,
  };
}

export type AstrbotSdk = ReturnType<typeof createAstrbotSdk>;
