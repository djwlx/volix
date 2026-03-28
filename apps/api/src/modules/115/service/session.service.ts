import { AppConfigEnum } from '../../config/model/config.model';
import { clearConfig, setConfig } from '../../config/service/config.service';
import { Cloud115AppType } from '../types/115.types';
import { getCloud115Sdk } from './sdk.service';

export async function login115WithAppAndSaveCookie(uid: string, app: Cloud115AppType) {
  const sdk = await getCloud115Sdk();
  const result = await sdk.loginWithApp(uid, app);
  await setConfig(AppConfigEnum.cookie_115, result.cookie);
  return result.data;
}

export async function exit115AndClearCookie() {
  const sdk = await getCloud115Sdk();
  sdk.clearCookie();
  await clearConfig(AppConfigEnum.cookie_115);
}
