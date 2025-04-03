import schedule from 'node-schedule';
import qbittorrent from '../controller/qbittorrent';
import { log } from '../utils/logger';
import { getNowTimeStrinng } from '../utils/date';

export const jobList: {
  name: string;
  job: schedule.Job;
}[] = [];

interface JobParam {
  key: string;
  description: string;
  cron: schedule.Spec;
  callback: () => Promise<void>;
}

export const createJob = (params: JobParam) => {
  const { key, description, cron, callback } = params;
  const job = schedule.scheduleJob(cron, async () => {
    await callback();
    log.info(`${description} 执行完成，下次执行时间 ${getNowTimeStrinng(job.nextInvocation())}`);
  });

  if (description) {
    log.info(`定时任务 ${description} 创建成功，下一次执行时间 ${getNowTimeStrinng(job.nextInvocation())} `);
  }

  jobList.push({
    name: key,
    job,
  });
};

export const initSchedule = () => {
  createJob({
    key: 'autoRefreshQbitCookie',
    description: '每天0点和12点刷新qbit的cookie',
    cron: '0 0,12 * * *',
    callback: async () => {
      await qbittorrent.login();
    },
  });

  createJob({
    key: 'autoOpenQbit',
    description: '每天早上9点30打开qbit',
    cron: '30 9 * * *',
    callback: async () => {
      await qbittorrent.startAll();
    },
  });

  createJob({
    key: 'autoCloseQbit',
    description: '每天凌晨1点关闭qbit',
    cron: '0 1 * * *',
    callback: async () => {
      await qbittorrent.pauseAll();
    },
  });
};
