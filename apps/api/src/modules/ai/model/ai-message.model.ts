import type { AiChatMessageRole, AiChatMessageStatus } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export interface AiMessageEntity {
  id: string;
  conversation_id: string;
  run_id?: string | null;
  tool_call_id?: string | null;
  role: AiChatMessageRole;
  content: string;
  status: AiChatMessageStatus;
  meta_json?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type AiMessageModelType = Model<AiMessageEntity>;

export const AiMessageModel = sequelize.define<AiMessageModelType>('app_ai_message', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  run_id: {
    type: DataTypes.STRING,
  },
  tool_call_id: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'completed',
  },
  meta_json: {
    type: DataTypes.TEXT,
  },
});
