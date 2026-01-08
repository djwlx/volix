import Router from '@koa/router';
import routerUser from './user-router';
import routerUtil from './util-router';
import routerFile from './file-router';
import router115 from './115-router';
import routerTask from './task-router';

const router = new Router({
  prefix: '/api',
});

router.use(router115.routes());
router.use(routerUtil.routes());
router.use(routerFile.routes());
router.use(routerTask.routes());
router.use(routerUser.routes());

export default router;
