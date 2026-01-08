import path from 'path';

// 因为ts编译和运行的路径问题，需要转化一下
export const getRootPath = () => {
  const root = path.resolve(__dirname, '../../');
  return root;
};
