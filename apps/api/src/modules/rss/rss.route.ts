import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  addCurrentUserRssSubscription,
  clearCurrentUserRssStorage,
  getRssCachedResource,
  getCurrentUserRssSetting,
  getCurrentUserRssSubscriptions,
  getRssFeed,
  getRssStorage,
  removeCurrentUserRssSubscription,
  updateCurrentUserRssSubscriptionEnabled,
  updateCurrentUserRssSetting,
} from './index';

const router = new Router({
  prefix: '/rss',
});

router
  .use(authenticate())
  .get('/resource-cache/:cacheKey', http(getRssCachedResource))
  .get('/feed', http(getRssFeed))
  .get('/setting', http(getCurrentUserRssSetting))
  .put('/setting', http(updateCurrentUserRssSetting))
  .get('/storage', http(getRssStorage))
  .post('/storage/clear', http(clearCurrentUserRssStorage))
  .get('/subscriptions', http(getCurrentUserRssSubscriptions))
  .post('/subscriptions', http(addCurrentUserRssSubscription))
  .put('/subscriptions/enabled', http(updateCurrentUserRssSubscriptionEnabled))
  .delete('/subscriptions', http(removeCurrentUserRssSubscription));

export default router;
