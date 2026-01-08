import Router from '@koa/router';
import { fileController } from '../controller';

const router = new Router({
  prefix: '/file',
});

router.post('/upload', fileController.upload).get('/download/:fileId', fileController.download);

export default router;
