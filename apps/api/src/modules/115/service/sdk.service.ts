import { create115Sdk, Sdk115 } from '../../../sdk/115';
import { AppConfigEnum } from '../../config/model/config.model';
import { getConfig } from '../../config/service/config.service';
import { getRequestActingUserId } from '../../../utils/request-context';
import { createScopedRuntimeMap } from './scoped-runtime-map';

const CLOUD115_SDK_TTL_MS = 30 * 60 * 1000;
const MAX_CLOUD115_SDK_ENTRIES = 64;
const cloud115SdkMap = createScopedRuntimeMap<Sdk115>({
  ttlMs: CLOUD115_SDK_TTL_MS,
  maxEntries: MAX_CLOUD115_SDK_ENTRIES,
});

const get115SdkScopeUserId = () => {
  return getRequestActingUserId() || 'public';
};

export async function initCloud115Sdk(params?: { cookie?: string }) {
  const scopeUserId = get115SdkScopeUserId();
  const cloud115Sdk = cloud115SdkMap.getOrCreate(scopeUserId, () => create115Sdk());

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
