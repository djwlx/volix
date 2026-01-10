import { ConfigKeyType, configService } from '../src/service';

function changeConfig(key: ConfigKeyType, value: string) {
  configService
    .setConfig(key, value)
    .then(() => {
      console.log(`配置项 ${key} 已更新为 ${value}`);
      process.exit(0);
    })
    .catch(e => {
      console.error('更新配置失败:', e);
      process.exit(1);
    });
}

changeConfig('' as any, '');
