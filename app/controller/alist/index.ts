import { AxiosRequestConfig } from 'axios';
import request from '../../utils/request';
import { generateRandomNumber } from '../../utils/number';
import { ENV } from '../../utils/env';
import { getRootPath } from '../../utils/path';
import fs from 'fs';
import ejs from 'ejs';
import { getOrMakeDir } from '../../utils/file';
import { log } from '../../utils/logger';

class Alist {
  private token: string;
  private url: string;
  private ua: string;
  constructor(paramUA?: string) {
    this.token = '';
    this.url = ENV.isProd ? 'http://localhost:5244' : 'http://localhost:5244';
    this.ua = paramUA
      ? paramUA
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';
  }

  alistRequest = async (
    config: AxiosRequestConfig & {
      notUrl?: boolean;
    },
    notToken?: boolean
  ) => {
    if (!notToken && !this.token) {
      await this.getToken();
    }
    const { url, notUrl, ...rest } = config;

    const requestConfig: any = {
      url: notUrl ? config.url : `${this.url}${config.url}`,
      headers: {
        'User-Agent': this.ua,
      },
    };

    if (!notToken && this.token) {
      requestConfig.headers.Authorization = this.token;
    }

    return request({
      ...requestConfig,
      ...rest,
    });
  };

  getFileInfo = async (name: string) => {
    const result = await this.alistRequest({
      method: 'POST',
      url: '/api/fs/get',
      data: {
        path: `/115/xPicture/setu/${name}`,
      },
    });
    return result.data?.data;
  };

  getFile = async (name: string, url: string) => {
    const saveDir = getOrMakeDir(`${getRootPath()}/uploads/setu`);
    const savePath = `${saveDir}/${name}`;
    // 本地如果有直接返回，否则下载下来
    if (fs.existsSync(savePath)) {
      return fs.readFileSync(savePath);
    }

    const file = await this.alistRequest({
      method: 'GET',
      url,
      notUrl: true,
      responseType: 'arraybuffer',
    });
    // 异步保存在本地
    fs.writeFile(savePath, file.data, (error) => {
      if (error) {
        log.error(error);
      }
    });
    return Buffer.from(file.data);
  };

  getFileList = async (path: string) => {
    return this.alistRequest({
      method: 'POST',
      url: '/api/fs/list',
      data: {
        path: path,
      },
    });
  };

  getRandowFile = async (direct: boolean) => {
    const result = await this.getFileList('/115/xPicture/setu');
    const total = result.data?.data?.total;
    const content = result.data?.data?.content;
    const random = generateRandomNumber(0, total);
    const fileName = content[random].name;
    const fileInfo = await this.getFileInfo(fileName);
    const realUrl = fileInfo.raw_url;

    if (direct) {
      const fileContent = await this.getFile(fileName, realUrl);
      return {
        file: fileContent,
        name: fileName,
      };
    } else {
      const setuHtml = `${getRootPath()}/app/views/setu.ejs`;
      const html = await ejs.renderFile(setuHtml, {
        url: realUrl,
      });

      return {
        name: fileName,
        html,
      };
    }
  };

  getToken = async () => {
    const result = await this.alistRequest(
      {
        method: 'POST',
        url: '/api/auth/login',
        data: {
          username: 'admin',
          password: '160295',
        },
      },
      true
    );
    const token = result.data?.data?.token;
    this.token = token;
  };
}
export default Alist;
