import Router from '@koa/router';
import { one15Controller } from '../controller';

const router = new Router({
  prefix: '/115',
});

router
  .get('/pic', one15Controller.randowPic)
  .get('/pic/info', one15Controller.get115PicInfo)
  .put('/pic/info', one15Controller.set115PicInfo)
  .get('/user', one15Controller.get115UserInfo)
  .post('/exit', one15Controller.exit115)
  .get('/qrcode', one15Controller.get115QrCode)
  .get('/qrcode/status', one15Controller.get115QrCodeStatus)
  .post('/qrcode/login', one15Controller.login115WithApp)
  .get('/files/:cid', one15Controller.get115FileList)
  .get('/file/:pc', one15Controller.get115File)
  .delete('/pic/info', one15Controller.clear115Pic);

export default router;
