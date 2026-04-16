import initApp from '../src/utils/dependencies';
import { runAiScreenAndRenameTool } from '../src/modules/ai';

async function main() {
  await initApp();

  const result = await runAiScreenAndRenameTool({
    instruction: '优先保留系列正片，广告图、下载站引流图、明显无意义命名尽量筛掉；重命名保持简洁稳定。',
    items: [
      {
        id: '1',
        name: '[AD] click-to-download-banner-final.png',
        path: '/demo/ads/[AD] click-to-download-banner-final.png',
        note: '疑似下载站广告图',
      },
      {
        id: '2',
        name: 'My Trip to Kyoto 2024 FINAL FINAL.jpg',
        path: '/demo/photos/My Trip to Kyoto 2024 FINAL FINAL.jpg',
      },
      {
        id: '3',
        name: 'IMG_20240101_123456.jpg',
        path: '/demo/camera/IMG_20240101_123456.jpg',
        note: '普通相机直出',
      },
      {
        id: '4',
        name: 'series-s01e03-1080p-clean-v2.mkv',
        path: '/demo/video/series-s01e03-1080p-clean-v2.mkv',
      },
    ],
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
