import Router from 'koa-router';
import routerUser from './user-router';
import routerUtil from './util-router';
import routerFile from './file-router';
import router115 from './115-router';

const router = new Router({
  prefix: '/api',
});

router.use(router115.routes());
router.use(routerUtil.routes());

// router.use(routerUser.routes());
// router.use(routerFile.routes());

export default router;
