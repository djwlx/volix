import { calculateTimeDifference, getNowTimeStrinng, waitTime } from '../../utils/date';
import driver115 from './index';
import File115Service from '../../service/file115';
import ConfigService from '../../service/config';
import { log } from '../../utils/logger';

class Util115 {
  // 缓存到数据库，下次直接调接口
  async saveFile(dataList: any[]) {
    const list = dataList.map((item) => {
      return {
        name: item.n,
        json: item,
        class: item.class,
        pc: item.pc,
      };
    });
    await File115Service.setFileList(list);
  }

  getPicFileList(fileList: any[]) {
    return fileList.filter((item) => {
      return item.fid && item.class === 'PIC';
    });
  }

  // 初始化随机图片，延迟处理，防止触发风控
  async initRandomPic(paths?: string[]) {
    // '2823447377226661136' setu
    // '3068034200407132056' 图包
    const uidList = paths ? paths : ['3068034200407132056', '2823447377226661136'];
    const limit = 500;
    const timer = 3000;
    const start = Date.now();
    let resultNum = 0;
    log.info('开始缓存图片');
    const getPicFileList = async (cid: string) => {
      const result = await driver115.getFileList(0, 1, cid);
      const count = result.count;
      const nextCidList: string[] = [];

      for (let i = 0; i < count; i += limit) {
        const dataList: any = [];
        const nowResult = await driver115.getFileList(i, limit, cid);
        const fileList: any = nowResult.data;
        fileList.forEach((item) => {
          // 图片
          if (item.fid && item.class === 'PIC') {
            resultNum++;
            dataList.push(item);
          }
          // 文件夹
          if (!item.fid) {
            nextCidList.push(item.cid);
          }
        });

        if (dataList.length > 0) {
          await this.saveFile(dataList);
        }

        await waitTime(timer);
      }

      for (let i = 0; i < nextCidList.length; i++) {
        await getPicFileList(nextCidList[i]);
      }
    };

    for (let i = 0; i < uidList.length; i++) {
      await getPicFileList(uidList[i]);
    }
    const end = Date.now();
    log.info('缓存图片完成,耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
    this.updateConfig(uidList);
  }

  // 完成之后更新config
  async updateConfig(paths?: string[]) {
    const len = await File115Service.getFileLen();
    await ConfigService.setConfig('115_picture_info', {
      count: len,
      paths,
      loading: false,
    });
  }
}

export default new Util115();
