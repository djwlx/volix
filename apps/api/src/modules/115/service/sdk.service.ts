import { create115Sdk, Sdk115 } from '../../../sdk/115';
import { AppConfigEnum } from '../../config/model/config.model';
import { getConfig } from '../../config/service/config.service';
import { getRequestActingUserId } from '../../../utils/request-context';

const cloud115SdkMap = new Map<string, Sdk115>();

const get115SdkScopeUserId = () => {
  return getRequestActingUserId() || 'public';
};

export async function initCloud115Sdk(params?: { cookie?: string }) {
  const scopeUserId = get115SdkScopeUserId();
  let cloud115Sdk = cloud115SdkMap.get(scopeUserId);
  if (!cloud115Sdk) {
    cloud115Sdk = create115Sdk();
    cloud115SdkMap.set(scopeUserId, cloud115Sdk);
  }

  if (params?.cookie !== undefined) {
    cloud115Sdk.setCookie(params.cookie);
    return cloud115Sdk;
  }

  const configs = await getConfig(AppConfigEnum.cookie_115);
  cloud115Sdk.setCookie(configs?.cookie_115);
  return cloud115Sdk;
}

export async function getCloud115Sdk() {
  const scopeUserId = get115SdkScopeUserId();
  const cloud115Sdk = cloud115SdkMap.get(scopeUserId);
  if (!cloud115Sdk) {
    return initCloud115Sdk();
  }
  return cloud115Sdk;
}
