import type { AiRunStatus } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export interface AiRunEntity {
  id: string;
  conversation_id: string;
  trigger_message_id: string;
  status: AiRunStatus;
  model?: string | null;
  current_step: number;
  error_message?: string | null;
  started_at?: Date | null;
  finished_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export type AiRunModelType = Model<AiRunEntity>;

export const AiRunModel = sequelize.define<AiRunModelType>('app_ai_run', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  trigger_message_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'queued',
  },
  model: {
    type: DataTypes.STRING,
  },
  current_step: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  error_message: {
    type: DataTypes.TEXT,
  },
  started_at: {
    type: DataTypes.DATE,
  },
  finished_at: {
    type: DataTypes.DATE,
  },
});
