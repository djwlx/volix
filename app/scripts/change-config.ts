import { configService } from '../service/config';
async function start() {
  const result = await configService.setConfig('picture_115_cids', '3068034200407132056,2823447377226661136');
  console.log(result, 'result');
}
start();
