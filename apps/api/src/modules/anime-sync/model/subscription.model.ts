import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type AnimeSyncSubscriptionModelType = Model<{
  id?: number;
  name: string;
  rss_url: string;
  target_openlist_path: string;
  qbit_category?: string;
  poll_interval_sec: number;
  enabled: boolean;
  last_polled_at?: Date;
  last_success_at?: Date;
}>;

export const AnimeSyncSubscriptionModel = sequelize.define<AnimeSyncSubscriptionModelType>(
  'app_anime_subscription',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rss_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_openlist_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qbit_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    poll_interval_sec: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_polled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_success_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }
);
