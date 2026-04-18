import { UserRole } from '@volix/types';
import { unauthorized } from '../../shared/http-handler';
import {
  createScheduledTask,
  getScheduledTaskDetail,
  getScheduledTaskLogs,
  listScheduledTaskRuns,
  listScheduledTasks,
  toggleScheduledTask,
  updateScheduledTask,
} from '../service/scheduled-task.service';
import { triggerScheduledTaskNow } from '../service/scheduled-task-scheduler.service';

type AppContext = Parameters<MyMiddleware>[0];

const ensureAdmin = (ctx: AppContext) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作定时任务');
  }
};

export const listScheduledTasksAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return listScheduledTasks();
};

export const createScheduledTaskAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return createScheduledTask(ctx.request.body as any, String(ctx.state.userInfo?.id || ''));
};

export const getScheduledTaskDetailAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return getScheduledTaskDetail(String(ctx.params.id || ''));
};

export const updateScheduledTaskAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return updateScheduledTask(String(ctx.params.id || ''), ctx.request.body as any);
};

export const listScheduledTaskRunsAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return listScheduledTaskRuns(String(ctx.params.id || ''));
};

export const getScheduledTaskLogsAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return getScheduledTaskLogs(String(ctx.params.id || ''));
};

export const runScheduledTaskNowAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const task = await triggerScheduledTaskNow(String(ctx.params.id || ''), 'manual');
  return {
    message: '任务已执行',
    taskId: task.id,
  };
};

export const toggleScheduledTaskAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return toggleScheduledTask(String(ctx.params.id || ''));
};
