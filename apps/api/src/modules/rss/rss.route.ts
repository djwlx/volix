import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  addCurrentUserRssSubscription,
  getRssCachedResource,
  getCurrentUserRssSetting,
  getCurrentUserRssSubscriptions,
  getRssFeed,
  getRssFeedHistory,
  removeCurrentUserRssSubscription,
  updateCurrentUserRssSetting,
} from './index';

const router = new Router({
  prefix: '/rss',
});

router
  .get('/resource-cache/:cacheKey', http(getRssCachedResource))
  .use(authenticate())
  .get('/feed', http(getRssFeed))
  .get('/feed-history', http(getRssFeedHistory))
  .get('/setting', http(getCurrentUserRssSetting))
  .put('/setting', http(updateCurrentUserRssSetting))
  .get('/subscriptions', http(getCurrentUserRssSubscriptions))
  .post('/subscriptions', http(addCurrentUserRssSubscription))
  .delete('/subscriptions', http(removeCurrentUserRssSubscription));

export default router;
