import Router from '@koa/router';
import { http } from '../shared/http-handler';
import {
  clear115Pic,
  exitCloud115,
  get115File,
  get115FileList,
  get115LikedPicList,
  get115PicCacheFileByPc,
  get115RandomPicCacheFile,
  get115PicInfo,
  get115PicPathByPc,
  get115QrCode,
  get115QrCodeStatus,
  get115UserInfo,
  getRandom115Pic,
  getRandom115PicByParent,
  login115ByApp,
  like115Pic,
  retry115Pic,
  set115PicInfo,
  set115PicRandomCacheConfig,
} from './index';
import { resolve115ActingUser } from './middleware/resolve-acting-user';

const router = new Router({
  prefix: '/115',
});

router.use(resolve115ActingUser());

router
  .get('/pic', http(getRandom115Pic))
  .get('/pic/parent-random', http(getRandom115PicByParent))
  .get('/pic/path', http(get115PicPathByPc))
  .get('/pic/cache/:pc', http(get115PicCacheFileByPc))
  .get('/pic/random-cache/:cacheFileName', http(get115RandomPicCacheFile))
  .get('/pic/likes', http(get115LikedPicList))
  .get('/pic/info', http(get115PicInfo))
  .post('/pic/like', http(like115Pic))
  .put('/pic/info', http(set115PicInfo))
  .put('/pic/random-cache-config', http(set115PicRandomCacheConfig))
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
