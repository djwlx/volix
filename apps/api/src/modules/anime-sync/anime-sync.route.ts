import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  createAnimeSyncSubscriptionController,
  deleteAnimeSyncSubscriptionController,
  getAnimeSyncJobController,
  getAnimeSyncJobsController,
  getAnimeSyncOverviewController,
  getAnimeSyncSubscriptionsController,
  retryAnimeSyncJobController,
  runAnimeSyncController,
  runAnimeSyncSubscriptionController,
  skipAnimeSyncJobController,
  toggleAnimeSyncSubscriptionController,
  updateAnimeSyncSubscriptionController,
} from './index';

const router = new Router({
  prefix: '/anime-sync',
});

router.use(authenticate());

router
  .get('/overview', http(getAnimeSyncOverviewController))
  .get('/subscriptions', http(getAnimeSyncSubscriptionsController))
  .post('/subscriptions', http(createAnimeSyncSubscriptionController))
  .put('/subscriptions/:id', http(updateAnimeSyncSubscriptionController))
  .delete('/subscriptions/:id', http(deleteAnimeSyncSubscriptionController))
  .post('/subscriptions/:id/toggle', http(toggleAnimeSyncSubscriptionController))
  .post('/run', http(runAnimeSyncController))
  .post('/subscriptions/:id/run', http(runAnimeSyncSubscriptionController))
  .get('/jobs', http(getAnimeSyncJobsController))
  .get('/jobs/:id', http(getAnimeSyncJobController))
  .post('/jobs/:id/retry', http(retryAnimeSyncJobController))
  .post('/jobs/:id/skip', http(skipAnimeSyncJobController));

export default router;
