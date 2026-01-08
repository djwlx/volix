// import schedule from 'node-schedule';
// import { qbitDriver } from '../drive';
// import { log } from '../utils/logger';
// import { getNowTimeStrinng } from '../utils/date';
// import { configService } from '../service';

// enum TaskId {
//   enable_qbit = 'enable_qbit',
// }

// export const jobList: {
//   name: string;
//   job: schedule.Job;
// }[] = [];

// interface JobParam {
//   key: string;
//   description: string;
//   cron: schedule.Spec;
//   callback: () => Promise<void>;
// }

// export const jobStatus = {
//   qbit: true,
// };

// export const createJob = (params: JobParam) => {
//   const { key, description, cron, callback } = params;
//   const job = schedule.scheduleJob(cron, async () => {
//     await callback();
//     log.info(`${description} 执行完成，下次执行时间 ${getNowTimeStrinng(job.nextInvocation())}`);
//   });

//   if (description) {
//     log.info(`定时任务 ${description} 创建成功，下一次执行时间 ${getNowTimeStrinng(job.nextInvocation())} `);
//   }

//   jobList.push({
//     name: key,
//     job,
//   });
// };

// export const initSchedule = async () => {
//   const taskConfig = await configService.getConfig(['qbit_task_enable']);
//   if (taskConfig?.qbit_task_enable === 'true') {
//     createJob({
//       key: 'autoOpenQbit',
//       description: '每天早上9点30打开qbit',
//       cron: '30 9 * * *',
//       callback: async () => {
//         if (jobStatus.qbit) {
//           await qbitDriver.startAll();
//         } else {
//           console.log('已经手动暂停定时任务');
//         }
//       },
//     });

//     createJob({
//       key: 'autoCloseQbit',
//       description: '每天凌晨1点关闭qbit',
//       cron: '0 1 * * *',
//       callback: async () => {
//         if (jobStatus.qbit) {
//           await qbitDriver.pauseAll();
//         } else {
//           console.log('已经手动暂停定时任务');
//         }
//       },
//     });
//   }

//   // const rule = new schedule.RecurrenceRule();
//   // rule.second = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; // 每分钟的 0,5,10,...55 秒执行
//   // createJob({
//   //   key: 'testtest',
//   //   description: '测试测试',
//   //   cron: rule,
//   //   callback: async () => {
//   //     console.log(jobStatus, 'status');
//   //   },
//   // });
// };
