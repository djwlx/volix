import Router from '@koa/router';
import { http } from '../shared/http-handler';
import authenticate from '../../middleware/authenticate';
import {
  createScheduledTask,
  deleteScheduledTask,
  listScheduledTasks,
  triggerScheduledTask,
  updateScheduledTask,
} from './controller/scheduled-task.controller';

const router = new Router({
  prefix: '/task-center',
});

router
  .use(authenticate())
  .get('/tasks', http(listScheduledTasks))
  .post('/tasks', http(createScheduledTask))
  .put('/tasks', http(updateScheduledTask))
  .delete('/tasks/:id', http(deleteScheduledTask))
  .post('/tasks/:id/trigger', http(triggerScheduledTask));

export default router;
