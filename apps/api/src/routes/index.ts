import Router from '@koa/router';
import animeSubscriptionRouter from '../modules/anime-subscription/anime-subscription.route';
import openlistAiOrganizerRouter from '../modules/openlist-ai-organizer/openlist-ai-organizer.route';
import routerUser from '../modules/user/user.route';
import routerUtil from '../modules/util/util.route';
import routerFile from '../modules/file/file.route';
import cloud115Router from '../modules/115/115.route';

const router = new Router({
  prefix: '/api',
});

router.use(cloud115Router.routes());
router.use(animeSubscriptionRouter.routes());
router.use(openlistAiOrganizerRouter.routes());
router.use(routerUtil.routes());
router.use(routerFile.routes());
router.use(routerUser.routes());

export default router;
