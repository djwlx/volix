import { TaskModel } from '../model';

export enum TaskTypeEnum {
  // 自动停止全部qbit任务
  autoStopQbit = 'autoStopQbit',
  // 自动开启全部qbit任务
  autoStartQbit = 'autoStartQbit',
}

export enum TaskStatusEnum {
  enable = 'active',
  disable = 'disable',
}

class TaskService {
  query = async (param: any) => {
    return TaskModel.findOne({ where: param });
  };

  add = async (param: any) => {
    return TaskModel.create(param);
  };
}

const taskService = new TaskService();

export { taskService };
