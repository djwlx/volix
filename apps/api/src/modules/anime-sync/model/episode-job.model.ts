import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import { AnimeSyncJobStatus } from '@volix/types';

export type AnimeSyncEpisodeJobModelType = Model<{
  id?: number;
  subscription_id: number;
  episode_key: string;
  title: string;
  magnet: string;
  torrent_url?: string;
  qbit_hash?: string;
  status: AnimeSyncJobStatus;
  retry_count: number;
  last_error?: string;
  meta_json?: string;
  discovered_at?: Date;
  completed_at?: Date;
}>;

export const AnimeSyncEpisodeJobModel = sequelize.define<AnimeSyncEpisodeJobModelType>(
  'app_anime_episode_job',
  {
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    episode_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    magnet: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    torrent_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qbit_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: AnimeSyncJobStatus.DISCOVERED,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discovered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['subscription_id', 'episode_key'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);
