import { configService } from '../service/config';
// 直接修改设置
async function start() {
  const result = await configService.setConfig('qbit_task_enable', 'false');
  console.log(result, 'result');
}
start();
