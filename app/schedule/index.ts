import schedule from 'node-schedule';
import { $, cd, glob } from 'zx';
import { getNowTimeStrinng } from '../utils/date';

const root = process.cwd();

// 自动备份docker数据
// const testJob = schedule.scheduleJob('aaaa', '*/5 * * * * *', async () => {
//   const time = getNowTimeStrinng();
//   console.log('执行自动备份功能', time);
//   console.log('下次执行时间：', getNowTimeStrinng(testJob.nextInvocation()));

//   // 待开发
// });
// process.on('SIGINT', () => {
//   console.log('接收到 SIGINT 信号');

//   process.exit(0); // 正常退出
// });
// process.on('SIGTERM', () => {
//   console.log('接收到 SIGTERM 信号1111');

//   process.exit(0); // 正常退出
// });
// process.on('exit', code => {
//   console.log(`进程即将退出，退出码: ${code}`);
// });

// console.log(testJob.name, 'name');

// 自动更新docker镜像
// 待思路

// 自动删除移动硬盘中mac的元数据（防止docker访问出错）
// schedule.scheduleJob('0 0 */1 * *', async () => {
//   console.log('执行自动删除元数据功能');
//   try {
//     cd('/Volumes/MyResource');
//     const paths = await glob('**/._*', { dot: true });
//     console.log(paths, '匹配到文件路径');
//     if (paths.length) {
//       await $`rm ${paths}`;
//       console.log(paths, '已经删除');
//     }
//     cd(root);
//   } catch (e) {}
// });
