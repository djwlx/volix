import initApp from '../src/utils/dependencies';
import { log } from '../src/utils/logger';

// 启动前初始化（目录 + 数据库模型同步 + 种子数据）
async function bootstrap() {
  try {
    await initApp();
    log.info('启动前初始化完成');
  } catch (e) {
    log.error(e);
    process.exitCode = 1;
  }
}
bootstrap();
