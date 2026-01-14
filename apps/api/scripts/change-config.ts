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

changeConfig(
  'cookie_115',
  'UID=100284233_D1_1767704572;CID=e62c1bde8ed64f9b405f814f25f7bff9;SEID=59ee3b4fefae139eef40970989122501454429fca76e109f64148edc4c0e7cd41d37c9a9f159d957a60174a8afc46500757a0d17068b83b48b5695cc;KID=26fc01368a8128cf15a67bf68298c8f1'
);
