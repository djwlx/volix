import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';

export interface UserRssSubscriptionEntity {
  id?: number;
  user_id: string;
  route: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRssSubscriptionModelType = Model<UserRssSubscriptionEntity>;

export const UserRssSubscriptionModel = sequelize.define<UserRssSubscriptionModelType>('volix_user_rss_subscription', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  route: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});
