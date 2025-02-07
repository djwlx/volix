import schedule from 'node-schedule';
import { getNowTimeStrinng } from '../utils/date';

interface JobItem {
  id?: string | number;
  status?: 'running' | 'static';
  cron: string;
  callBack: (job: schedule.Job) => void | Promise<void>;
  name: string;
  job?: schedule.Job;
}

class JobManager {
  private jobList: JobItem[] = [];

  constructor() {}

  async initJobList() {}

  getRunningJobList() {
    return this.jobList?.filter(item => item.status === 'running');
  }

  addJob(jobItem: JobItem, isOverride?: boolean) {
    this.jobList.push(jobItem);
  }

  deleteJob(id: JobItem['id']) {}

  resetJob(id: JobItem['id']) {}

  startJob(id: JobItem['id']) {
    const findJob = this.jobList.find(item => item.id === id);
    if (findJob) {
      const thisJob = schedule.scheduleJob(findJob.name, findJob.cron, async () => findJob.callBack(thisJob));
      findJob.job = thisJob;
      findJob.status = 'running';
    }
  }

  stopJob(id: JobItem['id']) {
    const findJob = this.jobList.find(item => item.id === id);
    if (findJob) {
      findJob.job?.cancel();
      findJob.status = 'static';
    }
  }

  // 运行所有任务
  async run() {
    this.jobList = this.jobList.map(jobItem => {
      const thisJob = schedule.scheduleJob(jobItem.name, jobItem.cron, async () => jobItem.callBack(thisJob));
      return {
        ...jobItem,
        status: 'running',
        job: thisJob,
      };
    });
  }
}

const jobManager = new JobManager();

// const jonItem: JobItem = {
//   id: 1,
//   name: '自动控制台输出',
//   cron: '*/5 * * * * *',
//   callBack: async job => {
//     const time = getNowTimeStrinng();
//     console.log('执行自动备份功能', time);
//     console.log('下次执行时间：', getNowTimeStrinng(job.nextInvocation()));
//   },
// };

// jobManager.addJob(jonItem);

export default jobManager;
