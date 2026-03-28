import { FindOptions, Op } from 'sequelize';
import { log } from '../../../utils/logger';
import { AppConfigEnum, ConfigModel, ConfigModelType, ConfigType } from '../model/config.model';

function getConfigJson(data: ConfigModelType[]) {
  if (!data || data.length === 0) {
    return null;
  }

  const configJson: Partial<Record<AppConfigEnum, string>> = data.reduce((acc, item) => {
    const { config_name, config_content } = item.dataValues;
    acc[config_name] = config_content;
    return acc;
  }, {} as Partial<Record<AppConfigEnum, string>>);

  return configJson;
}

export async function getConfig(key?: AppConfigEnum | AppConfigEnum[]) {
  try {
    const params: FindOptions<ConfigType> = {
      attributes: ['config_name', 'config_content'],
      where: {},
    };

    if (key) {
      params.where = {
        config_name: {
          [Op.in]: Array.isArray(key) ? key : [key],
        },
      };
    }

    const res = await ConfigModel.findAll(params);
    return getConfigJson(res);
  } catch (e) {
    log.error(e);
    return null;
  }
}

export async function setConfig(key: AppConfigEnum, configContent: string) {
  try {
    const config = await ConfigModel.findOne({
      where: {
        config_name: key,
      },
    });

    if (config) {
      await config.update({
        config_content: configContent,
      });
      const result = await config.save();
      return result.dataValues;
    }

    const res = await ConfigModel.create({
      config_name: key,
      config_content: configContent,
    });
    return res.dataValues;
  } catch (e) {
    log.error(e);
  }
}

export async function clearConfig(key: AppConfigEnum | AppConfigEnum[]) {
  try {
    const res = await ConfigModel.destroy({
      where: {
        config_name: {
          [Op.in]: Array.isArray(key) ? key : [key],
        },
      },
    });
    return res;
  } catch (e) {
    log.error(e);
  }
}
