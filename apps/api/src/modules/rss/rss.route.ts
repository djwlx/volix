import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  addCurrentUserRssSubscription,
  clearCurrentUserRssStorage,
  getRssItemResource,
  getRssCachedResource,
  getCurrentUserRssSetting,
  getCurrentUserRssSubscriptions,
  getRssFeed,
  getRssStorage,
  removeCurrentUserRssSubscription,
  updateCurrentUserRssSetting,
} from './index';

const router = new Router({
  prefix: '/rss',
});

router
  .get('/resource-cache/:cacheKey', http(getRssCachedResource))
  .get('/resource/:subscriptionKey/:itemKey/:fileName', http(getRssItemResource))
  .use(authenticate())
  .get('/feed', http(getRssFeed))
  .get('/setting', http(getCurrentUserRssSetting))
  .put('/setting', http(updateCurrentUserRssSetting))
  .get('/storage', http(getRssStorage))
  .post('/storage/clear', http(clearCurrentUserRssStorage))
  .get('/subscriptions', http(getCurrentUserRssSubscriptions))
  .post('/subscriptions', http(addCurrentUserRssSubscription))
  .delete('/subscriptions', http(removeCurrentUserRssSubscription));

export default router;
