import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import { serveUserFile, uploadFile } from './index';

const router = new Router({
  prefix: '/file',
});

router.use(authenticate()).post('/upload', http(uploadFile)).get('/:dirKey/:fileName', http(serveUserFile));

export default router;
