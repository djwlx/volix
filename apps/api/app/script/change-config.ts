import { configService } from '../service/config';
// 直接修改设置
async function start() {
  const result = await configService.setConfig('is_picture_115_caching', 'false');
  console.log(result, 'result');
}
start();
