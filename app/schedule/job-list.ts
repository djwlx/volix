// 定时任务

const JobList = {
  backup: {
    callback: async () => {
      console.log('定时任务执行');
    },
  },
};
export type JobType = keyof typeof JobList;
export default JobList;
