import Router from '@koa/router';
import routerUser from '../modules/user/user.route';
import routerUtil from '../modules/util/util.route';
import routerFile from '../modules/file/file.route';
import cloud115Router from '../modules/115/115.route';
import routerTask from '../modules/task/task.route';
import routerAnimeSync from '../modules/anime-sync/anime-sync.route';

const router = new Router({
  prefix: '/api',
});

router.use(cloud115Router.routes());
router.use(routerUtil.routes());
router.use(routerFile.routes());
router.use(routerTask.routes());
router.use(routerUser.routes());
router.use(routerAnimeSync.routes());

export default router;
