import type { InternalAiMessage } from '../types/ai.types';
import type { AiChatMessageRole, RetryAiRunResponse, SendAiMessageResponse, UserRole } from '@volix/types';
import { runInternalAiJson } from './ai-client.service';
import { taskLog } from '../../../utils/logger';
import { buildAiChatAgentPrompt } from '../prompt/chat-agent.prompt';
import {
  createAiMessageRecord,
  createAiRunRecord,
  createAiToolCallRecord,
  ensureAiConversationAccess,
  getAiMessageRecord,
  getAiRunRecord,
  getAiConversationDetail,
  getAiToolCallRecord,
  updateAiMessageRecord,
  updateAiRunRecord,
  updateAiToolCallRecord,
} from './ai-chat-conversation.service';
import { emitAiConversationEvent } from './ai-event-bus.service';
import { executeAiRegisteredTool, listAiRegisteredTools } from './ai-chat-tool-registry.service';
import { serializeJson } from './ai-chat-shared.service';
import { badRequest } from '../../shared/http-handler';
import { AiMessageModel } from '../model/ai-message.model';
import { AiRunModel } from '../model/ai-run.model';
import { AiToolCallModel } from '../model/ai-tool-call.model';
import { toAiChatMessage } from './ai-chat-shared.service';
import { toAiToolCall } from './ai-chat-shared.service';
import { buildAiAssistantReplyFromToolResult, findRepeatedReadToolCall } from './ai-chat-loop-guard.service';

interface PlannerReplyResult {
  kind: 'reply';
  reply: string;
}

interface PlannerToolCallResult {
  kind: 'tool_call';
  toolName: string;
  arguments: Record<string, unknown>;
}

type PlannerResult = PlannerReplyResult | PlannerToolCallResult;

const MAX_AGENT_STEPS = 6;
const STREAM_CHUNK_SIZE = 48;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const chunkText = (text: string) => {
  if (!text) {
    return [];
  }
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += STREAM_CHUNK_SIZE) {
    chunks.push(text.slice(index, index + STREAM_CHUNK_SIZE));
  }
  return chunks;
};

const buildPlannerMessages = async (conversationId: string): Promise<InternalAiMessage[]> => {
  const tools = listAiRegisteredTools();
  const rows = await AiMessageModel.findAll({
    where: {
      conversation_id: conversationId,
    },
    order: [['created_at', 'ASC']],
  });
  const history = rows.map(item => toAiChatMessage(item.dataValues));
  const messages: InternalAiMessage[] = [
    {
      role: 'system',
      content: buildAiChatAgentPrompt(tools),
    },
  ];

  for (const item of history.slice(-18)) {
    if (item.role === 'tool') {
      messages.push({
        role: 'system',
        content: `工具结果(${item.toolCallId || 'unknown'}): ${item.content}`,
      });
      continue;
    }
    messages.push({
      role: item.role as Exclude<AiChatMessageRole, 'tool'>,
      content: item.content,
    });
  }

  return messages;
};

const planNextStep = async (conversationId: string, runId: string) => {
  const messages = await buildPlannerMessages(conversationId);
  return runInternalAiJson<PlannerResult>(messages, {
    temperature: 0.1,
    traceId: runId,
    toolName: 'ai_chat_orchestrator',
  });
};

const resolveRepeatedReadToolCall = async (
  conversationId: string,
  triggerMessageId: string,
  toolName: string,
  args: Record<string, unknown>
) => {
  const runs = await AiRunModel.findAll({
    where: {
      conversation_id: conversationId,
      trigger_message_id: triggerMessageId,
    },
    attributes: ['id'],
  });
  const runIds = runs.map(item => String(item.dataValues.id)).filter(Boolean);
  if (!runIds.length) {
    return null;
  }
  const rows = await AiToolCallModel.findAll({
    where: {
      conversation_id: conversationId,
      run_id: runIds,
      tool_name: toolName,
      status: 'completed',
    },
    order: [['created_at', 'DESC']],
    limit: 8,
  });

  return findRepeatedReadToolCall(
    rows.map(item => toAiToolCall(item.dataValues)),
    toolName,
    args
  );
};

const streamAssistantReply = async (conversationId: string, runId: string, reply: string) => {
  const message = await createAiMessageRecord({
    conversationId,
    runId,
    role: 'assistant',
    content: '',
    status: 'streaming',
  });
  await emitAiConversationEvent(conversationId, 'message.created', { message }, { runId });
  let content = '';
  for (const chunk of chunkText(reply)) {
    content += chunk;
    await emitAiConversationEvent(
      conversationId,
      'message.delta',
      {
        messageId: message.id,
        delta: chunk,
      },
      { runId }
    );
    await sleep(15);
  }
  const finalMessage = await updateAiMessageRecord(message.id, {
    content,
    status: 'completed',
  });
  await emitAiConversationEvent(conversationId, 'message.completed', { message: finalMessage }, { runId });
  return finalMessage;
};

const executeToolCall = async (
  conversationId: string,
  runId: string,
  toolCallId: string,
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  }
) => {
  const toolCallRecord = await getAiToolCallRecord(toolCallId);
  if (!toolCallRecord) {
    badRequest('工具调用不存在');
    throw new Error('unreachable');
  }
  const toolCall = toolCallRecord.dataValues;
  const startedToolCall = await updateAiToolCallRecord(toolCallId, {
    status: 'running',
    started_at: new Date(),
  });
  await emitAiConversationEvent(
    conversationId,
    'tool_call.started',
    {
      toolCall: startedToolCall,
    },
    { runId }
  );

  try {
    const parsedArgs = JSON.parse(toolCall.arguments_json || '{}') as Record<string, unknown>;
    const result = await executeAiRegisteredTool(
      toolCall.tool_name,
      {
        user,
      },
      parsedArgs
    );
    const updated = await updateAiToolCallRecord(toolCallId, {
      status: 'completed',
      result_json: serializeJson(result),
      finished_at: new Date(),
    });
    await createAiMessageRecord({
      conversationId,
      runId,
      toolCallId,
      role: 'tool',
      content: JSON.stringify(
        {
          toolName: updated.toolName,
          result,
        },
        null,
        2
      ),
      status: 'completed',
    });
    await emitAiConversationEvent(
      conversationId,
      'tool_call.completed',
      {
        toolCall: updated,
      },
      { runId }
    );
    return updated;
  } catch (error) {
    const message = (error as Error)?.message || 'tool_execution_failed';
    taskLog.error(`[AI_CHAT][run:${runId}][tool:${toolCall.tool_name}][error] ${message}`);
    const failed = await updateAiToolCallRecord(toolCallId, {
      status: 'failed',
      error_message: message,
      finished_at: new Date(),
    });
    await emitAiConversationEvent(
      conversationId,
      'tool_call.failed',
      {
        toolCall: failed,
      },
      { runId }
    );
    throw error;
  }
};

const continueAiRun = async (
  conversationId: string,
  runId: string,
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  }
) => {
  const runRecord = await getAiRunRecord(runId);
  if (!runRecord) {
    throw new Error(`run_not_found:${runId}`);
  }
  const triggerMessageId = String(runRecord.dataValues.trigger_message_id);

  for (let step = 1; step <= MAX_AGENT_STEPS; step += 1) {
    taskLog.info(`[AI_CHAT][run:${runId}][step:${step}] planner_start conversation=${conversationId}`);
    await updateAiRunRecord(runId, {
      status: 'running',
      current_step: step,
      ...(step === 1 ? { started_at: new Date() } : {}),
    });

    const plannerResult = await planNextStep(conversationId, runId);
    taskLog.info(
      `[AI_CHAT][run:${runId}][step:${step}] planner_result kind=${plannerResult.kind}${
        plannerResult.kind === 'tool_call' ? ` tool=${plannerResult.toolName}` : ''
      }`
    );

    if (plannerResult.kind === 'reply') {
      await streamAssistantReply(conversationId, runId, plannerResult.reply);
      const finalRun = await updateAiRunRecord(runId, {
        status: 'completed',
        finished_at: new Date(),
      });
      taskLog.info(`[AI_CHAT][run:${runId}][finish] completed`);
      await emitAiConversationEvent(conversationId, 'run.completed', { run: finalRun }, { runId });
      return finalRun;
    }

    const toolDefinitions = listAiRegisteredTools();
    const toolDefinition = toolDefinitions.find(item => item.name === plannerResult.toolName);
    if (!toolDefinition) {
      throw new Error(`unknown_tool:${plannerResult.toolName}`);
    }

    if (toolDefinition.riskLevel === 'read') {
      const repeatedToolCall = await resolveRepeatedReadToolCall(
        conversationId,
        triggerMessageId,
        plannerResult.toolName,
        plannerResult.arguments || {}
      );
      if (repeatedToolCall) {
        taskLog.warn(
          `[AI_CHAT][run:${runId}][step:${step}] repeated_read_tool_call ${plannerResult.toolName}, fallback_to_reply`
        );
        await streamAssistantReply(
          conversationId,
          runId,
          buildAiAssistantReplyFromToolResult(plannerResult.toolName, repeatedToolCall.result)
        );
        const finalRun = await updateAiRunRecord(runId, {
          status: 'completed',
          finished_at: new Date(),
        });
        await emitAiConversationEvent(conversationId, 'run.completed', { run: finalRun }, { runId });
        return finalRun;
      }
    }

    const toolCall = await createAiToolCallRecord({
      conversationId,
      runId,
      toolName: plannerResult.toolName,
      riskLevel: toolDefinition.riskLevel,
      requiresApproval: toolDefinition.requiresApproval,
      arguments: plannerResult.arguments || {},
    });
    taskLog.info(`[AI_CHAT][run:${runId}][tool] created ${plannerResult.toolName}`);

    await emitAiConversationEvent(conversationId, 'tool_call.created', { toolCall }, { runId });

    if (toolCall.requiresApproval) {
      const waitingRun = await updateAiRunRecord(runId, {
        status: 'waiting_approval',
      });
      taskLog.info(`[AI_CHAT][run:${runId}][tool] waiting_approval ${plannerResult.toolName}`);
      await emitAiConversationEvent(
        conversationId,
        'tool_call.waiting_approval',
        {
          toolCall,
        },
        { runId }
      );
      await emitAiConversationEvent(conversationId, 'run.waiting_approval', { run: waitingRun }, { runId });
      return waitingRun;
    }

    await executeToolCall(conversationId, runId, toolCall.id, user);
  }

  throw new Error('agent_step_limit_reached');
};

const startAiRun = async (
  conversationId: string,
  triggerMessageId: string,
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  }
) => {
  const run = await createAiRunRecord({
    conversationId,
    triggerMessageId,
  });
  await emitAiConversationEvent(conversationId, 'run.started', { run }, { runId: run.id });
  void continueAiRun(conversationId, run.id, user).catch(async error => {
    const errorMessage = (error as Error)?.message || 'run_failed';
    taskLog.error(`[AI_CHAT][run:${run.id}][error] ${errorMessage}`);
    const failedRun = await updateAiRunRecord(run.id, {
      status: 'failed',
      error_message: errorMessage,
      finished_at: new Date(),
    });
    await emitAiConversationEvent(
      conversationId,
      'run.failed',
      {
        run: failedRun,
      },
      { runId: run.id }
    );
  });
  return run;
};

export const sendAiConversationMessage = async (
  conversationId: string,
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  },
  content: string
): Promise<SendAiMessageResponse> => {
  const conversation = await ensureAiConversationAccess(conversationId, user.id);
  taskLog.info(
    `[AI_CHAT][conversation:${conversation.dataValues.id}][message] from=${user.id} content=${content.slice(0, 200)}`
  );
  const message = await createAiMessageRecord({
    conversationId: conversation.dataValues.id,
    role: 'user',
    content,
    status: 'completed',
  });
  await emitAiConversationEvent(conversation.dataValues.id, 'message.created', { message });
  const run = await startAiRun(conversation.dataValues.id, message.id, user);
  return {
    conversation: await getAiConversationDetail(conversation.dataValues.id, user.id),
    message,
    run,
  };
};

export const retryAiRun = async (
  runId: string,
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  }
): Promise<RetryAiRunResponse> => {
  const runRecord = await getAiRunRecord(runId);
  if (!runRecord) {
    badRequest('运行记录不存在');
    throw new Error('unreachable');
  }

  const runEntity = runRecord.dataValues;
  const conversation = await ensureAiConversationAccess(runEntity.conversation_id, user.id);
  if (runEntity.status !== 'failed') {
    badRequest('只有失败的回复才可以重试');
  }

  const triggerMessage = await getAiMessageRecord(runEntity.trigger_message_id);
  taskLog.info(`[AI_CHAT][run:${runId}][retry] triggerMessage=${triggerMessage.id}`);
  const nextRun = await startAiRun(conversation.dataValues.id, triggerMessage.id, user);

  return {
    conversation: await getAiConversationDetail(conversation.dataValues.id, user.id),
    triggerMessage,
    run: nextRun,
  };
};

export const resolveAiToolCallApproval = async (
  toolCallId: string,
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  },
  approved: boolean
) => {
  const toolCallRecord = await getAiToolCallRecord(toolCallId);
  if (!toolCallRecord) {
    badRequest('工具调用不存在');
    throw new Error('unreachable');
  }
  const toolCall = toolCallRecord.dataValues;
  await ensureAiConversationAccess(toolCall.conversation_id, user.id);

  if (toolCall.status !== 'waiting_approval') {
    badRequest('该工具调用当前不在待确认状态');
  }

  if (!approved) {
    const rejected = await updateAiToolCallRecord(toolCallId, {
      status: 'rejected',
      finished_at: new Date(),
    });
    const failedRun = await updateAiRunRecord(toolCall.run_id, {
      status: 'completed',
      finished_at: new Date(),
    });
    await createAiMessageRecord({
      conversationId: toolCall.conversation_id,
      runId: toolCall.run_id,
      toolCallId,
      role: 'assistant',
      content: `已取消工具调用 ${rejected.toolName}。`,
      status: 'completed',
    });
    await emitAiConversationEvent(
      toolCall.conversation_id,
      'tool_call.rejected',
      { toolCall: rejected },
      { runId: toolCall.run_id }
    );
    await emitAiConversationEvent(
      toolCall.conversation_id,
      'run.completed',
      { run: failedRun },
      { runId: toolCall.run_id }
    );
    taskLog.info(`[AI_CHAT][run:${toolCall.run_id}][tool] rejected ${rejected.toolName}`);
    return rejected;
  }

  const approvedToolCall = await updateAiToolCallRecord(toolCallId, {
    status: 'queued',
  });
  await emitAiConversationEvent(
    toolCall.conversation_id,
    'tool_call.approved',
    {
      toolCall: approvedToolCall,
    },
    { runId: toolCall.run_id }
  );
  void executeToolCall(toolCall.conversation_id, toolCall.run_id, toolCallId, user)
    .then(() => continueAiRun(toolCall.conversation_id, toolCall.run_id, user))
    .catch(async error => {
      const errorMessage = (error as Error)?.message || 'run_failed';
      taskLog.error(`[AI_CHAT][run:${toolCall.run_id}][error] ${errorMessage}`);
      const failedRun = await updateAiRunRecord(toolCall.run_id, {
        status: 'failed',
        error_message: errorMessage,
        finished_at: new Date(),
      });
      await emitAiConversationEvent(
        toolCall.conversation_id,
        'run.failed',
        { run: failedRun },
        { runId: toolCall.run_id }
      );
    });

  return approvedToolCall;
};
