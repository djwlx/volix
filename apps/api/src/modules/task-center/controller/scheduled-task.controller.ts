import type {
  CreateScheduledTaskPayload,
  ListScheduledTasksResponse,
  TriggerScheduledTaskResponse,
  UpdateScheduledTaskPayload,
} from '@volix/types';
import { badRequest, notFound, unauthorized } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';
import { getUserAstrbotConfig } from '../../user/service/user-config.service';
import {
  createUserTask,
  deleteUserTask,
  getUserTask,
  isValidCronExpression,
  listUserTasks,
  updateUserTask,
} from '../service/scheduled-task.service';
import { rescheduleTask, runScheduledTask, unscheduleTask } from '../service/scheduled-task-scheduler.service';
import { normalizeUmoList } from '../service/task-param-utils';
import { isSupportedTaskType } from '../service/task-type-registry';

const ensureLoginUserId = (ctx: any) => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized(t('auth.unauthorized'));
  }
  return userId as string | number;
};

const validateNameAndCron = (name: string, cron: string) => {
  if (!String(name || '').trim()) {
    badRequest(t('taskCenter.name.required'));
  }
  if (!isValidCronExpression(cron)) {
    badRequest(t('taskCenter.cron.invalid'));
  }
};

export const listScheduledTasks: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const [tasks, astrbotConfig] = await Promise.all([listUserTasks(userId), getUserAstrbotConfig(userId)]);
  const result: ListScheduledTasksResponse = {
    tasks,
    defaults: {
      taskTypeDefaults: {
        astrbot_random_pic: {
          umos: normalizeUmoList(astrbotConfig?.umos),
        },
      },
    },
  };
  return result;
};

export const createScheduledTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const payload = (ctx.request.body || {}) as CreateScheduledTaskPayload;

  if (!isSupportedTaskType(payload.type)) {
    badRequest(t('taskCenter.taskType.invalid'));
  }
  validateNameAndCron(payload.name, String(payload.cron || ''));

  const task = await createUserTask(userId, {
    name: payload.name,
    type: payload.type,
    enabled: Boolean(payload.enabled),
    cron: String(payload.cron || ''),
    params: payload.params,
  });

  rescheduleTask(userId, task);
  return task;
};

export const updateScheduledTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const payload = (ctx.request.body || {}) as UpdateScheduledTaskPayload;

  const id = String(payload.id || '').trim();
  if (!id) {
    badRequest(t('taskCenter.id.required'));
  }
  validateNameAndCron(payload.name, String(payload.cron || ''));

  const task = await updateUserTask(userId, id, {
    name: payload.name,
    enabled: Boolean(payload.enabled),
    cron: String(payload.cron || ''),
    params: payload.params,
  });
  if (!task) {
    notFound(t('taskCenter.task.notFound'));
    return;
  }

  rescheduleTask(userId, task);
  return task;
};

export const deleteScheduledTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const id = String(ctx.params?.id || '').trim();
  if (!id) {
    badRequest(t('taskCenter.id.required'));
  }

  const removed = await deleteUserTask(userId, id);
  if (!removed) {
    notFound(t('taskCenter.task.notFound'));
    return;
  }
  unscheduleTask(id);
  return { id };
};

export const triggerScheduledTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const id = String(ctx.params?.id || '').trim();
  if (!id) {
    badRequest(t('taskCenter.id.required'));
  }

  const task = await getUserTask(userId, id);
  if (!task) {
    notFound(t('taskCenter.task.notFound'));
    return;
  }

  // 任务执行链路较慢，异步触发，立即返回，结果记录在任务运行状态中
  void runScheduledTask(
    { id: task.id, name: task.name, userId: String(userId), type: task.type, params: task.params },
    'manual'
  );

  const response: TriggerScheduledTaskResponse = { id, accepted: true };
  return response;
};
