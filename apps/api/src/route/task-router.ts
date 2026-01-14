import Router from '@koa/router';
import { taskController } from '../controller';

const router = new Router({
  prefix: '/task',
});

router.post('/:id', taskController.test);

export default router;
