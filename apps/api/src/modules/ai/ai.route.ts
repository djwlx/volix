import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  approveAiToolCallAction,
  createAiConversationAction,
  deleteAiConversationAction,
  getAiConversationDetailAction,
  listAiConversationAction,
  listAiConversationEventsAction,
  listAiConversationMessagesAction,
  listAiConversationRunsAction,
  listAiConversationToolCallsAction,
  listAiToolsAction,
  retryAiRunAction,
  sendAiConversationMessageAction,
  streamAiConversationAction,
  updateAiConversationAction,
} from './controller/ai-chat.controller';

const router = new Router({
  prefix: '/ai',
});

router.use(authenticate());
router.get('/tools', http(listAiToolsAction));
router.get('/conversations', http(listAiConversationAction));
router.post('/conversations', http(createAiConversationAction));
router.get('/conversations/:id', http(getAiConversationDetailAction));
router.patch('/conversations/:id', http(updateAiConversationAction));
router.delete('/conversations/:id', http(deleteAiConversationAction));
router.get('/conversations/:id/messages', http(listAiConversationMessagesAction));
router.get('/conversations/:id/runs', http(listAiConversationRunsAction));
router.get('/conversations/:id/tool-calls', http(listAiConversationToolCallsAction));
router.get('/conversations/:id/events', http(listAiConversationEventsAction));
router.get('/conversations/:id/stream', streamAiConversationAction);
router.post('/conversations/:id/messages', http(sendAiConversationMessageAction));
router.post('/tool-calls/:id/approve', http(approveAiToolCallAction));
router.post('/runs/:id/retry', http(retryAiRunAction));

export default router;
