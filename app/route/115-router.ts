import Router from 'koa-router';
import { one15Controller } from '../controller';

const router = new Router({
  prefix: '/115',
});

router
  .get('/pic', one15Controller.randowPic)
  .get('/pic/info', one15Controller.get115PicInfo)
  .post('/pic/info', one15Controller.set115PicInfo);

export default router;
