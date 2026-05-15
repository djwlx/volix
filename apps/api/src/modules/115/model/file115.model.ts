import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import { getRequestActingUserId } from '../../../utils/request-context';

export type File115Type = Model<{
  userId?: string;
  pc: string;
  class: string;
  cid: string | null;
  parentCid: string | null;
  fullPath: string | null;
  isLiked: boolean | null;
  localCacheFileName: string | null;
}>;

const applyScopedUserWhere = (options?: { where?: Record<string, unknown> }) => {
  const userId = getRequestActingUserId();
  if (!userId || !options) {
    return;
  }
  options.where = {
    ...(options.where || {}),
    user_id: userId,
  };
};

export const File115Model = sequelize.define<File115Type>(
  'volix_115_file',
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'user_id',
    },
    pc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class: {
      type: DataTypes.STRING,
    },
    cid: {
      type: DataTypes.STRING,
    },
    parentCid: {
      type: DataTypes.STRING,
      field: 'parent_cid',
    },
    fullPath: {
      type: DataTypes.STRING,
      field: 'full_path',
    },
    isLiked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_liked',
    },
    localCacheFileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'local_cache_file_name',
    },
  },
  {
    hooks: {
      beforeFind: options => {
        applyScopedUserWhere(options as { where?: Record<string, unknown> });
      },
      beforeCount: options => {
        applyScopedUserWhere(options as { where?: Record<string, unknown> });
      },
      beforeBulkUpdate: options => {
        applyScopedUserWhere(options as { where?: Record<string, unknown> });
      },
      beforeBulkDestroy: options => {
        applyScopedUserWhere(options as { where?: Record<string, unknown> });
      },
      beforeBulkCreate: instances => {
        const userId = getRequestActingUserId();
        if (!userId) {
          return;
        }
        instances.forEach(instance => {
          instance.setDataValue('userId', userId);
        });
      },
      beforeCreate: instance => {
        const userId = getRequestActingUserId();
        if (userId) {
          instance.setDataValue('userId', userId);
        }
      },
      beforeUpdate: instance => {
        const userId = getRequestActingUserId();
        if (userId) {
          instance.setDataValue('userId', userId);
        }
      },
    },
  }
);
