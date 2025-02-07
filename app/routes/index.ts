import Router from 'koa-router';
import userRouter from './user-router';
import utilRouter from './util-router';
import fileRouter from './file-router';

const router = new Router({
  prefix: '/api',
});

// router.use(userRouter.routes());
router.use(utilRouter.routes());
// router.use(fileRouter.routes());

export default router;
