import schedule from 'node-schedule';
import { getNowTimeStrinng } from '../utils/date';
import ConfigService from '../service/config';
import { JobType } from './job-list';

interface JobJson {
  id: number;
  name?: string;
  type: JobType;
  cron: string;
  status: 'running' | 'paused';
  params: Record<string, any>;
  // 不会存储
  job?: schedule.Job;
}

class JobManager {
  private jobList: JobJson[] = [];

  constructor() {
    this.initJobList();
  }

  // 读取数据库，初始化任务列表
  async initJobList() {
    const jobConfig = await ConfigService.getConfig('backup_config');
    if (jobConfig) {
    }
  }

  async addJob(jobItem: Pick<JobJson, 'type' | 'params'>, run: boolean = true) {
    const result = await ConfigService.getConfig('backup_config');
    console.log(result, 'result');
    const fff = await ConfigService.setConfig('backup_config', []);
    console.log(fff, 'fff');
    // const nowList = result;
  }

  // deleteJob(id: JobItem['id']) {}

  // resetJob(id: JobItem['id']) {}

  // startJob(id: JobItem['id']) {
  // const findJob = this.jobList.find((item) => item.id === id);
  // if (findJob) {
  //   const thisJob = schedule.scheduleJob(findJob.name, findJob.cron, async () => findJob.callBack(thisJob));
  //   findJob.job = thisJob;
  //   findJob.status = 'running';
  // }
  // }

  // stopJob(id: JobItem['id']) {
  //   // const findJob = this.jobList.find((item) => item.id === id);
  //   // if (findJob) {
  //   //   findJob.job?.cancel();
  //   //   findJob.status = 'static';
  //   // }
  // }

  // 运行所有任务
  // async run() {
  //   // this.jobList = this.jobList.map((jobItem) => {
  //   //   const thisJob = schedule.scheduleJob(jobItem.name, jobItem.cron, async () => jobItem.callBack(thisJob));
  //   //   return {
  //   //     ...jobItem,
  //   //     status: 'running',
  //   //     job: thisJob,
  //   //   };
  //   // });
  // }
}

const jobManager = new JobManager();
jobManager.addJob({
  type: 'backup',
  params: {},
});

// const jonItem: JobItem = {
//   id: 1,
//   name: '自动控制台输出',
//   cron: '*/5 * * * * *',
//   callBack: async (job) => {
//     const time = getNowTimeStrinng();
//     console.log('执行自动备份功能', time);
//     console.log('下次执行时间：', getNowTimeStrinng(job.nextInvocation()));
//   },
// };

// jobManager.addJob(jonItem);

export default jobManager;
