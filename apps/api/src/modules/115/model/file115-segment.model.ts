import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type File115PathSegmentType = Model<{
  pc: string;
  cid: string | null;
  segment: string;
  depth: number;
}>;

export const File115PathSegmentModel = sequelize.define<File115PathSegmentType>('volix_115_file_segment', {
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
});
