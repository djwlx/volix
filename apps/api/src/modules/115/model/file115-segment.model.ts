import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import { getRequestActingUserId } from '../../../utils/request-context';

export type File115PathSegmentType = Model<{
  userId?: string;
  pc: string;
  cid: string | null;
  segment: string;
  depth: number;
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

export const File115PathSegmentModel = sequelize.define<File115PathSegmentType>(
  'volix_115_file_segment',
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
    cid: {
      type: DataTypes.STRING,
    },
    segment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
