import configModel from '../models/config';

type ConfigNameType = '115_login_info' | '115_picture_info';

class ConfigService {
  static async getConfig(configName: ConfigNameType) {
    try {
      const res = await configModel.findOne({
        where: {
          configName,
        },
      });
      return res?.dataValues?.configContent;
    } catch (e) {
      // console.log(e);
    }
  }

  static async setConfig(configName: ConfigNameType, configContent: any) {
    try {
      const config = await configModel.findOne({
        where: {
          configName,
        },
      });
      if (config) {
        const res = await configModel.update(
          {
            configContent,
          },
          {
            where: {
              configName,
            },
          }
        );
        return res;
      } else {
        const res = await configModel.create({
          configName,
          configContent,
        });
        return res;
      }
    } catch (e) {
      console.log(e);
    }
  }

  static async clearConfig(configName: ConfigNameType) {
    try {
      const res = await configModel.destroy({
        where: {
          configName,
        },
      });
      return res;
    } catch (e) {
      console.log(e);
    }
  }
}

export default ConfigService;
