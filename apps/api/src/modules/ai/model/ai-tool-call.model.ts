import type { AiToolCallStatus, AiToolRiskLevel } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export interface AiToolCallEntity {
  id: string;
  conversation_id: string;
  run_id: string;
  tool_name: string;
  risk_level: AiToolRiskLevel;
  status: AiToolCallStatus;
  requires_approval: boolean;
  arguments_json: string;
  result_json?: string | null;
  error_message?: string | null;
  started_at?: Date | null;
  finished_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export type AiToolCallModelType = Model<AiToolCallEntity>;

export const AiToolCallModel = sequelize.define<AiToolCallModelType>('app_ai_tool_call', {
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
    allowNull: false,
  },
  tool_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  risk_level: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'queued',
  },
  requires_approval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  arguments_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  result_json: {
    type: DataTypes.TEXT,
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
