import path from 'path';
import { ENV } from './env';

// 资源文件需要通过函数转化一下
export const getRootPath = () => {
  const root = ENV.isProd ? path.resolve(__dirname, '../../../') : path.resolve(__dirname, '../../');
  return root;
};
