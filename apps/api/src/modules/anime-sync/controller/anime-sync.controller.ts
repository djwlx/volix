import { UserRole } from '@volix/types';
import type { CreateAnimeSyncSubscriptionPayload, UpdateAnimeSyncSubscriptionPayload } from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  createAnimeSyncSubscription,
  deleteAnimeSyncSubscription,
  getAnimeSyncJob,
  getAnimeSyncOverview,
  getAnimeSyncSubscription,
  listAnimeSyncJobs,
  listAnimeSyncSubscriptions,
  retryAnimeSyncJob,
  runAnimeSyncDiscover,
  runAnimeSyncPipeline,
  skipAnimeSyncJob,
  toggleAnimeSyncSubscription,
  updateAnimeSyncSubscription,
} from '../service/anime-sync.service';

const ensureAdmin = (ctx: Parameters<MyMiddleware>[0]) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }
};

const parseId = (raw: string, fieldName: string) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    badRequest(`${fieldName} 参数错误`);
  }
  return id;
};

const validateCreatePayload = (payload: CreateAnimeSyncSubscriptionPayload) => {
  if (!payload || typeof payload !== 'object') {
    badRequest('参数错误');
  }
  if (!payload.name?.trim()) {
    badRequest('订阅名称不能为空');
  }
  if (!payload.rssUrl?.trim()) {
    badRequest('RSS 地址不能为空');
  }
  if (!/^https?:\/\//.test(payload.rssUrl.trim())) {
    badRequest('RSS 地址必须是 http/https');
  }
  if (!payload.targetOpenlistPath?.trim()) {
    badRequest('目标目录不能为空');
  }
  if (payload.pollIntervalSec !== undefined) {
    const value = Number(payload.pollIntervalSec);
    if (!Number.isInteger(value) || value < 30) {
      badRequest('轮询间隔不能小于 30 秒');
    }
  }
};

const validateUpdatePayload = (payload: UpdateAnimeSyncSubscriptionPayload) => {
  if (!payload || typeof payload !== 'object') {
    badRequest('参数错误');
  }
  if (payload.name !== undefined && !payload.name.trim()) {
    badRequest('订阅名称不能为空');
  }
  if (payload.rssUrl !== undefined) {
    const rssUrl = payload.rssUrl.trim();
    if (!rssUrl) {
      badRequest('RSS 地址不能为空');
    }
    if (!/^https?:\/\//.test(rssUrl)) {
      badRequest('RSS 地址必须是 http/https');
    }
  }
  if (payload.targetOpenlistPath !== undefined && !payload.targetOpenlistPath.trim()) {
    badRequest('目标目录不能为空');
  }
  if (payload.pollIntervalSec !== undefined) {
    const value = Number(payload.pollIntervalSec);
    if (!Number.isInteger(value) || value < 30) {
      badRequest('轮询间隔不能小于 30 秒');
    }
  }
};

export const getAnimeSyncOverviewController: MyMiddleware = async () => {
  return getAnimeSyncOverview();
};

export const getAnimeSyncSubscriptionsController: MyMiddleware = async () => {
  return listAnimeSyncSubscriptions();
};

export const createAnimeSyncSubscriptionController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const payload = (ctx.request.body || {}) as CreateAnimeSyncSubscriptionPayload;
  validateCreatePayload(payload);
  return createAnimeSyncSubscription(payload);
};

export const updateAnimeSyncSubscriptionController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const id = parseId(ctx.params.id, 'id');
  const payload = (ctx.request.body || {}) as UpdateAnimeSyncSubscriptionPayload;
  validateUpdatePayload(payload);
  const result = await updateAnimeSyncSubscription(id, payload);
  if (!result) {
    badRequest('订阅不存在');
  }
  return result;
};

export const deleteAnimeSyncSubscriptionController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const id = parseId(ctx.params.id, 'id');
  const result = await deleteAnimeSyncSubscription(id);
  if (!result) {
    badRequest('订阅不存在');
  }
  return {
    success: true,
  };
};

export const toggleAnimeSyncSubscriptionController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const id = parseId(ctx.params.id, 'id');
  const result = await toggleAnimeSyncSubscription(id);
  if (!result) {
    badRequest('订阅不存在');
  }
  return result;
};

export const runAnimeSyncController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const discover = await runAnimeSyncDiscover();
  const pipeline = await runAnimeSyncPipeline();
  return {
    ...discover,
    ...pipeline,
  };
};

export const runAnimeSyncSubscriptionController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const id = parseId(ctx.params.id, 'id');
  const subscription = await getAnimeSyncSubscription(id);
  if (!subscription) {
    badRequest('订阅不存在');
  }
  const discover = await runAnimeSyncDiscover(id);
  const pipeline = await runAnimeSyncPipeline();
  return {
    ...discover,
    ...pipeline,
  };
};

export const getAnimeSyncJobsController: MyMiddleware = async ctx => {
  const subscriptionIdRaw = ctx.request.query.subscriptionId as string | undefined;
  if (!subscriptionIdRaw) {
    return listAnimeSyncJobs();
  }
  const subscriptionId = parseId(subscriptionIdRaw, 'subscriptionId');
  return listAnimeSyncJobs(subscriptionId);
};

export const getAnimeSyncJobController: MyMiddleware = async ctx => {
  const id = parseId(ctx.params.id, 'id');
  const result = await getAnimeSyncJob(id);
  if (!result) {
    badRequest('任务不存在');
  }
  return result;
};

export const retryAnimeSyncJobController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const id = parseId(ctx.params.id, 'id');
  const result = await retryAnimeSyncJob(id);
  if (!result) {
    badRequest('任务不存在');
  }
  return result;
};

export const skipAnimeSyncJobController: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const id = parseId(ctx.params.id, 'id');
  const result = await skipAnimeSyncJob(id);
  if (!result) {
    badRequest('任务不存在');
  }
  return result;
};
