import path from 'path';
import { ENV } from './env';

// 因为ts编译和运行的路径问题，需要转化一下
export const getRootPath = () => {
  const root = ENV.isProd ? path.resolve(__dirname, '../../../') : path.resolve(__dirname, '../../');
  return root;
};
