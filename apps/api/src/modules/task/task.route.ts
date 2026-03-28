import Router from '@koa/router';
import { http } from '../shared/http-handler';
import { testTask } from './index';

const router = new Router({
  prefix: '/task',
});

router.post('/:id', http(testTask));

export default router;
