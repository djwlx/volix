import type { AiConversationStatus } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export interface AiConversationEntity {
  id: string;
  user_id: string;
  title: string;
  status: AiConversationStatus;
  last_message_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export type AiConversationModelType = Model<AiConversationEntity>;

export const AiConversationModel = sequelize.define<AiConversationModelType>('app_ai_conversation', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
  last_message_at: {
    type: DataTypes.DATE,
  },
});
