import Router from 'koa-router';
import UtilController from '../controller/util';

const router = new Router({
  prefix: '/util',
});

router
  .get('/pic', UtilController.randomPic)
  .get('/test', UtilController.test)
  .get('/115-qrcode', UtilController.get115QrCode)
  .get('/115-qrcode-status', UtilController.get115QrCodeStatus)
  .post('/115-login', UtilController.login115WithApp)
  .get('/115-login-status', UtilController.get115LoginStatus)
  .post('/115-exit', UtilController.exit115)
  .get('/115-user-info', UtilController.get115UserInfo)
  .get('/115-files', UtilController.get115FileList)
  .get('/115-file-info', UtilController.get115File)
  .get('/115-pictures', UtilController.get115PicInfo)
  .post('/115-pictures', UtilController.set115Pic);

export default router;
