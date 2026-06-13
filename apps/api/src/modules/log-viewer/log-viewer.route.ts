import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import { downloadLogAction, getLogDatesAction, getLogEntriesAction } from './controller/log-viewer.controller';

const router = new Router({
  prefix: '/log-viewer',
});

router.use(authenticate());
router.get('/dates', http(getLogDatesAction));
router.get('/entries', http(getLogEntriesAction));
router.get('/download', http(downloadLogAction));

export default router;
