import Router from 'koa-router';
import { utilController } from '../controller/util-controller';

const router = new Router({
  prefix: '/util',
});

router
  .get('/test', utilController.test)
  .get('/task/:id', utilController.getTask)
  .patch('/task/:id', utilController.setTask);

export default router;
