import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export interface AiEventEntity {
  id: string;
  conversation_id: string;
  run_id?: string | null;
  sequence: number;
  type: string;
  payload_json: string;
  created_at?: Date;
  updated_at?: Date;
}

export type AiEventModelType = Model<AiEventEntity>;

export const AiEventModel = sequelize.define<AiEventModelType>('app_ai_event', {
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
  sequence: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payload_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
});
