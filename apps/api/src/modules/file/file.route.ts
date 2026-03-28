import Router from '@koa/router';
import { http } from '../shared/http-handler';
import { downloadFile, uploadFile } from './index';

const router = new Router({
  prefix: '/file',
});

router.post('/upload', http(uploadFile)).get('/download/:fileId', http(downloadFile));

export default router;
