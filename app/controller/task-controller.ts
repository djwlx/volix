import { BaseController } from './base-controller';

class TaskController extends BaseController {
  test = this.res(async (ctx, next) => {
    return {};
  });
}

const taskController = new TaskController();
export { taskController };
