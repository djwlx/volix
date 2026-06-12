import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  cleanupFormatConvertTaskFiles,
  createCloudFormatConvertTask,
  deleteFormatConvertTask,
  deleteFormatConvertTasks,
  createLocalFormatConvertTask,
  downloadFormatConvertLog,
  downloadFormatConvertResult,
  getFormatConvertTasks,
  listOpenlistFsForFormatConvert,
  retryFormatConvertTask,
} from './controller/format-convert.controller';

const router = new Router({
  prefix: '/format-convert',
});

router.use(authenticate());
router
  .post('/local-task', http(createLocalFormatConvertTask))
  .post('/cloud-task', http(createCloudFormatConvertTask))
  .get('/tasks', http(getFormatConvertTasks))
  .post('/task/:id/retry', http(retryFormatConvertTask))
  .post('/task/:id/cleanup', http(cleanupFormatConvertTaskFiles))
  .post('/task/:id/delete', http(deleteFormatConvertTask))
  .post('/tasks/delete', http(deleteFormatConvertTasks))
  .get('/task/:id/result', http(downloadFormatConvertResult))
  .get('/task/:id/log', http(downloadFormatConvertLog))
  .get('/openlist/fs', http(listOpenlistFsForFormatConvert));

export default router;
