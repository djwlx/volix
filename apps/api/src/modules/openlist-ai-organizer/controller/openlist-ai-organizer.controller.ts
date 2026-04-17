import type {
  AnalyzeOpenlistAiOrganizerPayload,
  ExecuteOpenlistAiOrganizerPayload,
  ReviseOpenlistAiOrganizerAnalyzeTaskPayload,
} from '@volix/types';
import { UserRole } from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { browseOpenlistAiOrganizerPath } from '../service/openlist-ai-organizer.service';
import {
  createAnalyzeOpenlistAiOrganizerTask,
  createExecuteOpenlistAiOrganizerTask,
  createReviseOpenlistAiOrganizerAnalyzeTask,
  createRetryOpenlistAiOrganizerTask,
  queryOpenlistAiOrganizerTaskDetail,
  queryOpenlistAiOrganizerTaskList,
} from '../service/openlist-ai-organizer-task.service';

type AppContext = Parameters<MyMiddleware>[0];

const ensureAdmin = (ctx: AppContext) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作 AI 文件整理工具');
  }
};

export const browseOpenlistAiOrganizerAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return browseOpenlistAiOrganizerPath(String(ctx.query.path || '/'));
};

export const analyzeOpenlistAiOrganizerAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return createAnalyzeOpenlistAiOrganizerTask(ctx.request.body as AnalyzeOpenlistAiOrganizerPayload);
};

export const executeOpenlistAiOrganizerAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return createExecuteOpenlistAiOrganizerTask(ctx.request.body as ExecuteOpenlistAiOrganizerPayload);
};

export const reviseOpenlistAiOrganizerAnalyzeTaskAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return createReviseOpenlistAiOrganizerAnalyzeTask(
    String(ctx.params.id || ''),
    ctx.request.body as ReviseOpenlistAiOrganizerAnalyzeTaskPayload
  );
};

export const retryOpenlistAiOrganizerTaskAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return createRetryOpenlistAiOrganizerTask(String(ctx.params.id || ''));
};

export const getOpenlistAiOrganizerTaskListAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return queryOpenlistAiOrganizerTaskList();
};

export const getOpenlistAiOrganizerTaskDetailAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const task = await queryOpenlistAiOrganizerTaskDetail(String(ctx.params.id || ''));
  if (!task) {
    badRequest('任务不存在');
  }
  return task;
};
