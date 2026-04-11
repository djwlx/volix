import Router from '@koa/router';
import { http } from '../shared/http-handler';
import {
  clear115Pic,
  exitCloud115,
  get115File,
  get115FileList,
  get115PicInfo,
  get115QrCode,
  get115QrCodeStatus,
  get115UserInfo,
  getRandom115Pic,
  login115ByApp,
  like115Pic,
  retry115Pic,
  set115PicInfo,
} from './index';

const router = new Router({
  prefix: '/115',
});

router
  .get('/pic', http(getRandom115Pic))
  .get('/pic/info', http(get115PicInfo))
  .post('/pic/like', http(like115Pic))
  .put('/pic/info', http(set115PicInfo))
  .post('/pic/info/retry', http(retry115Pic))
  .get('/user', http(get115UserInfo))
  .post('/exit', http(exitCloud115))
  .get('/qrcode', http(get115QrCode))
  .get('/qrcode/status', http(get115QrCodeStatus))
  .post('/qrcode/login', http(login115ByApp))
  .get('/files/:cid', http(get115FileList))
  .get('/file/:pc', http(get115File))
  .delete('/pic/info', http(clear115Pic));

export default router;
