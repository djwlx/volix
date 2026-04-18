import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  createScheduledTaskAction,
  getScheduledTaskDetailAction,
  getScheduledTaskLogsAction,
  listScheduledTaskRunsAction,
  listScheduledTasksAction,
  runScheduledTaskNowAction,
  toggleScheduledTaskAction,
  updateScheduledTaskAction,
} from './controller/scheduled-task.controller';

const router = new Router({
  prefix: '/scheduled-tasks',
});

router
  .use(authenticate())
  .get('/', http(listScheduledTasksAction))
  .post('/', http(createScheduledTaskAction))
  .get('/:id', http(getScheduledTaskDetailAction))
  .put('/:id', http(updateScheduledTaskAction))
  .get('/:id/runs', http(listScheduledTaskRunsAction))
  .get('/:id/logs', http(getScheduledTaskLogsAction))
  .post('/:id/run-now', http(runScheduledTaskNowAction))
  .post('/:id/toggle', http(toggleScheduledTaskAction));

export default router;
