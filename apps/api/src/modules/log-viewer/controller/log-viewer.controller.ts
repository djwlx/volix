import fs from 'fs';
import { UserRole } from '@volix/types';
import type { LogViewerLevel, LogViewerType } from '@volix/types';
import { t } from '../../../utils/i18n';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { getLogFilePath, listLogDates, readLogEntries } from '../service/log-viewer.service';

const VALID_LEVELS: LogViewerLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const ensureAdmin = (ctx: Parameters<MyMiddleware>[0]) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized(t({ id: 'user.admin.only', defaultMessage: '仅管理员可操作' }));
  }
};

const parseType = (raw: unknown): LogViewerType => {
  if (raw === 'normal' || raw === 'database') {
    return raw;
  }
  return badRequest(t({ id: 'logViewer.error.invalidType', defaultMessage: '日志类型错误' }));
};

const parseLevels = (raw: unknown): LogViewerLevel[] => {
  const text = Array.isArray(raw) ? raw.join(',') : String(raw || '');
  return text
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter((item): item is LogViewerLevel => VALID_LEVELS.includes(item as LogViewerLevel));
};

export const getLogDatesAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const type = parseType(ctx.query.type);
  return {
    dates: await listLogDates(type),
  };
};

export const getLogEntriesAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const type = parseType(ctx.query.type);
  const date = String(ctx.query.date || '');
  return readLogEntries(type, date, {
    levels: parseLevels(ctx.query.levels),
    keyword: String(ctx.query.keyword || ''),
    page: Number(ctx.query.page) || 1,
    pageSize: Number(ctx.query.pageSize) || undefined,
  });
};

export const downloadLogAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const type = parseType(ctx.query.type);
  const date = String(ctx.query.date || '');
  const { filePath, fileName } = getLogFilePath(type, date);
  const exists = await fs.promises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    badRequest(t({ id: 'logViewer.error.fileNotFound', defaultMessage: '日志文件不存在' }));
  }
  ctx.response.set('Content-Type', 'text/plain; charset=utf-8');
  ctx.response.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  ctx.body = fs.createReadStream(filePath);
};
