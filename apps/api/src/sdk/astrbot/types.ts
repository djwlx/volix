import type { Method } from 'axios';

export interface CreateAstrbotSdkOptions {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  userAgent?: string;
  umos?: string[];
}

export interface AstrbotRequestOptions {
  path: string;
  method?: Method;
  params?: Record<string, unknown>;
  data?: unknown;
  requireAuth?: boolean;
  headers?: Record<string, string>;
}

export interface AstrbotUploadFileInput {
  file: Buffer | NodeJS.ReadableStream;
  filename: string;
  contentType?: string;
}

export interface AstrbotUploadedFile {
  attachment_id: string;
  filename?: string;
  type?: string;
  [key: string]: unknown;
}

export interface AstrbotSendMessageInput {
  // 不传则使用 createAstrbotSdk 配置的默认 umos（可多个目标）
  umo?: string | string[];
  text?: string;
  attachments?: AstrbotUploadFileInput[];
}

export interface AstrbotSendResult {
  umo: string;
  response: unknown;
}

export type AstrbotRequest = <T = unknown>(options: AstrbotRequestOptions) => Promise<T>;

export type AstrbotMessagePartType = 'text' | 'plain' | 'image' | 'file' | 'audio' | 'record' | 'video' | 'reply';

export interface AstrbotMessagePart {
  type: AstrbotMessagePartType;
  text?: string;
  attachment_id?: string;
  url?: string;
  filename?: string;
  mime_type?: string;
  [key: string]: unknown;
}

export type AstrbotMessageContent = string | AstrbotMessagePart[];
