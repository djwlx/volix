import type {
  ApproveAiToolCallPayload,
  CreateAiConversationPayload,
  SendAiMessagePayload,
  UpdateAiConversationPayload,
} from '@volix/types';
import { unauthorized } from '../../shared/http-handler';
import {
  createAiConversation,
  deleteAiConversation,
  getAiConversationDetail,
  listAiConversationMessages,
  listAiConversationRuns,
  listAiConversationToolCalls,
  listAiConversations,
  updateAiConversation,
  ensureAiConversationAccess,
} from '../service/ai-chat-conversation.service';
import { queryAiConversationEvents, subscribeAiConversationEvents } from '../service/ai-event-bus.service';
import {
  resolveAiToolCallApproval,
  retryAiRun,
  sendAiConversationMessage,
} from '../service/ai-chat-orchestrator.service';
import { listAiRegisteredTools } from '../service/ai-chat-tool-registry.service';

type AppContext = Parameters<MyMiddleware>[0];

const getCurrentUser = (ctx: AppContext) => {
  const user = ctx.state.userInfo;
  if (!user?.id) {
    unauthorized('未登录');
    throw new Error('unreachable');
  }
  return {
    ...user,
    requestUserAgent: String(ctx.request.headers['user-agent'] || '').trim() || undefined,
  };
};

export const createAiConversationAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return createAiConversation(user.id, ctx.request.body as CreateAiConversationPayload);
};

export const listAiConversationAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return {
    items: await listAiConversations(user.id),
  };
};

export const getAiConversationDetailAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return getAiConversationDetail(String(ctx.params.id || ''), user.id);
};

export const updateAiConversationAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return updateAiConversation(String(ctx.params.id || ''), user.id, ctx.request.body as UpdateAiConversationPayload);
};

export const deleteAiConversationAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return deleteAiConversation(String(ctx.params.id || ''), user.id);
};

export const listAiConversationMessagesAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return {
    items: await listAiConversationMessages(String(ctx.params.id || ''), user.id),
  };
};

export const listAiConversationRunsAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return {
    items: await listAiConversationRuns(String(ctx.params.id || ''), user.id),
  };
};

export const listAiConversationToolCallsAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return {
    items: await listAiConversationToolCalls(String(ctx.params.id || ''), user.id),
  };
};

export const listAiConversationEventsAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  const conversationId = String(ctx.params.id || '');
  await ensureAiConversationAccess(conversationId, user.id);
  return {
    items: await queryAiConversationEvents(conversationId, Number(ctx.query.afterSequence || 0)),
  };
};

export const listAiToolsAction: MyMiddleware = async () => {
  return {
    items: listAiRegisteredTools(),
  };
};

export const sendAiConversationMessageAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  const payload = ctx.request.body as SendAiMessagePayload;
  return sendAiConversationMessage(String(ctx.params.id || ''), user, String(payload.content || '').trim());
};

export const approveAiToolCallAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  const payload = ctx.request.body as ApproveAiToolCallPayload;
  return resolveAiToolCallApproval(String(ctx.params.id || ''), user, Boolean(payload.approved));
};

export const retryAiRunAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  return retryAiRun(String(ctx.params.id || ''), user);
};

export const streamAiConversationAction: MyMiddleware = async ctx => {
  const user = getCurrentUser(ctx);
  const conversationId = String(ctx.params.id || '');
  await ensureAiConversationAccess(conversationId, user.id);
  const afterSequence = Number(ctx.query.afterSequence || 0);

  ctx.req.setTimeout(0);
  ctx.respond = false;
  ctx.status = 200;
  ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
  ctx.set('Cache-Control', 'no-cache, no-transform');
  ctx.set('Connection', 'keep-alive');
  ctx.set('X-Accel-Buffering', 'no');

  if (typeof ctx.res.flushHeaders === 'function') {
    ctx.res.flushHeaders();
  }

  const writeEvent = (event: { id: string; sequence: number; type: string; payload: Record<string, unknown> }) => {
    ctx.res.write(`id: ${event.sequence}\n`);
    ctx.res.write(`event: ${event.type}\n`);
    ctx.res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  ctx.res.write(`event: ready\ndata: {"conversationId":"${conversationId}","afterSequence":${afterSequence}}\n\n`);

  const history = await queryAiConversationEvents(conversationId, afterSequence);
  for (const event of history) {
    writeEvent(event as any);
  }
  ctx.res.write(
    `event: history_end\ndata: {"conversationId":"${conversationId}","afterSequence":${afterSequence}}\n\n`
  );

  const heartbeat = setInterval(() => {
    ctx.res.write(`event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`);
  }, 15000);

  const unsubscribe = subscribeAiConversationEvents(conversationId, event => {
    writeEvent(event as any);
  });

  const close = () => {
    clearInterval(heartbeat);
    unsubscribe();
    ctx.res.end();
  };

  ctx.req.on('close', close);
  ctx.req.on('end', close);
};
