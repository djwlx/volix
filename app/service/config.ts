import { ConfigModel } from '../model';
import { log } from '../utils/logger';
import { Model, Op } from 'sequelize';

interface AppConfigType {
  // 115登录信息
  cookie_115: string;
  // 115图片信息
  is_picture_115_caching: string;
  // 115图片缓存目录cid,
  picture_115_cids: string;
  // qbit自动停启任务
  qbit_task_enable: string;
}

export type ConfigKeyType = keyof AppConfigType;

class ConfigService {
  // 组装成json
  private getConfigJson(data: Model<any, any>[]) {
    if (!data || data.length === 0) {
      return null;
    }
    const configJson: Partial<AppConfigType> = data.reduce((acc, item) => {
      const { config_name, config_content } = item.dataValues;
      acc[config_name] = config_content;
      return acc;
    }, {});
    return configJson;
  }
  // 获取配置
  async getConfig(configName: ConfigKeyType | ConfigKeyType[]) {
    try {
      const res = await ConfigModel.findAll({
        attributes: ['config_name', 'config_content'],
        where: {
          config_name: {
            [Op.in]: Array.isArray(configName) ? configName : [configName],
          },
        },
      });
      return this.getConfigJson(res);
    } catch (e) {
      log.error(e);
    }
  }
  // 设置配置
  async setConfig(configName: ConfigKeyType, configContent: string) {
    try {
      const config = await ConfigModel.findOne({
        where: {
          config_name: configName,
        },
      });
      if (config) {
        await config.update({
          config_content: configContent,
        });
        const result = await config.save();
        return result.dataValues;
      } else {
        const res = await ConfigModel.create({
          config_name: configName,
          config_content: configContent,
        });
        return res.dataValues;
      }
    } catch (e) {
      log.error(e);
    }
  }
  // 清除配置
  async clearConfig(configName: ConfigKeyType | ConfigKeyType[]) {
    try {
      const res = await ConfigModel.destroy({
        where: {
          config_name: {
            [Op.in]: Array.isArray(configName) ? configName : [configName],
          },
        },
      });
      return res;
    } catch (e) {
      log.error(e);
    }
  }
}

const configService = new ConfigService();

export { configService };
