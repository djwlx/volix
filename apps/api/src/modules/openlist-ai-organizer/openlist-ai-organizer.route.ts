import Router from '@koa/router';
import { http } from '../shared/http-handler';
import authenticate from '../../middleware/authenticate';
import {
  analyzeOpenlistAiOrganizerAction,
  browseOpenlistAiOrganizerAction,
  executeOpenlistAiOrganizerAction,
  getOpenlistAiOrganizerTaskDetailAction,
  getOpenlistAiOrganizerTaskListAction,
  reviseOpenlistAiOrganizerAnalyzeTaskAction,
  retryOpenlistAiOrganizerTaskAction,
} from './index';

const router = new Router({
  prefix: '/openlist-ai-organizer',
});

router
  .use(authenticate())
  .get('/browse', http(browseOpenlistAiOrganizerAction))
  .get('/tasks', http(getOpenlistAiOrganizerTaskListAction))
  .get('/tasks/:id', http(getOpenlistAiOrganizerTaskDetailAction))
  .post('/analyze', http(analyzeOpenlistAiOrganizerAction))
  .post('/tasks/:id/revise', http(reviseOpenlistAiOrganizerAnalyzeTaskAction))
  .post('/tasks/:id/retry', http(retryOpenlistAiOrganizerTaskAction))
  .post('/execute', http(executeOpenlistAiOrganizerAction));

export default router;
