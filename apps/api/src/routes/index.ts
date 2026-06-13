import Router from '@koa/router';
import routerUser from '../modules/user/user.route';
import routerUtil from '../modules/util/util.route';
import routerFile from '../modules/file/file.route';
import cloud115Router from '../modules/115/115.route';
import sqliteAdminRouter from '../modules/sqlite-admin/sqlite-admin.route';
import rssRouter from '../modules/rss/rss.route';
import formatConvertRouter from '../modules/format-convert/format-convert.route';
import logViewerRouter from '../modules/log-viewer/log-viewer.route';

const router = new Router({
  prefix: '/api',
});

router.use(cloud115Router.routes());
router.use(routerUtil.routes());
router.use(routerFile.routes());
router.use(routerUser.routes());
router.use(sqliteAdminRouter.routes());
router.use(rssRouter.routes());
router.use(formatConvertRouter.routes());
router.use(logViewerRouter.routes());

export default router;
