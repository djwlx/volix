import { EventEmitter } from 'events';
import { Op } from 'sequelize';
import { AiEventModel } from '../model/ai-event.model';
import { createAiEntityId, serializeJson, toAiEvent } from './ai-chat-shared.service';

const aiEventBus = new EventEmitter();

export const emitAiConversationEvent = async (
  conversationId: string,
  type: string,
  payload: Record<string, unknown>,
  options?: {
    runId?: string | null;
  }
) => {
  const latest = await AiEventModel.findOne({
    where: {
      conversation_id: conversationId,
    },
    order: [['sequence', 'DESC']],
  });
  const record = await AiEventModel.create({
    id: createAiEntityId('aie'),
    conversation_id: conversationId,
    run_id: options?.runId || null,
    sequence: Number(latest?.dataValues.sequence || 0) + 1,
    type,
    payload_json: serializeJson(payload),
  });
  const event = toAiEvent(record.dataValues);
  aiEventBus.emit(`conversation:${conversationId}`, event);
  return event;
};

export const queryAiConversationEvents = async (conversationId: string, afterSequence = 0) => {
  const rows = await AiEventModel.findAll({
    where: {
      conversation_id: conversationId,
      sequence: {
        [Op.gt]: afterSequence,
      },
    },
    order: [['sequence', 'ASC']],
  });
  return rows.map(item => toAiEvent(item.dataValues));
};

export const subscribeAiConversationEvents = (
  conversationId: string,
  listener: (event: ReturnType<typeof toAiEvent>) => void
) => {
  const key = `conversation:${conversationId}`;
  aiEventBus.on(key, listener);
  return () => {
    aiEventBus.off(key, listener);
  };
};
