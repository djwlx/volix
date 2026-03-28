import Router from '@koa/router';
import { http } from '../shared/http-handler';
import { testUtil } from './index';

const router = new Router({
  prefix: '/util',
});

router.get('/test', http(testUtil));

export default router;
