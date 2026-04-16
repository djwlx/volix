import Router from '@koa/router';
import { http } from '../shared/http-handler';
import authenticate from '../../middleware/authenticate';
import {
  createAnimeSubscriptionAction,
  getAnimeSubscriptionDetail,
  getAnimeSubscriptionItems,
  getAnimeSubscriptionList,
  getAnimeSubscriptionLogs,
  toggleAnimeSubscriptionAction,
  triggerAnimeSubscriptionCheck,
  updateAnimeSubscriptionAction,
} from './index';

const router = new Router({
  prefix: '/anime-subscriptions',
});

router
  .use(authenticate())
  .get('/', http(getAnimeSubscriptionList))
  .get('/:id', http(getAnimeSubscriptionDetail))
  .post('/', http(createAnimeSubscriptionAction))
  .put('/:id', http(updateAnimeSubscriptionAction))
  .post('/:id/toggle', http(toggleAnimeSubscriptionAction))
  .post('/:id/check-now', http(triggerAnimeSubscriptionCheck))
  .get('/:id/items', http(getAnimeSubscriptionItems))
  .get('/:id/logs', http(getAnimeSubscriptionLogs));

export default router;
