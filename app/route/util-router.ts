import Router from 'koa-router';
import { utilController } from '../controller/util';

const router = new Router({
  prefix: '/util',
});

router.get('/test', utilController.test);

export default router;
