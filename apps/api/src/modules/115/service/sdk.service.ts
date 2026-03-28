import { create115Sdk, Sdk115 } from '../../../sdk/115';
import { AppConfigEnum } from '../../config/model/config.model';
import { getConfig } from '../../config/service/config.service';

let cloud115Sdk: Sdk115 | undefined;

export async function initCloud115Sdk(params?: { cookie?: string }) {
  if (!cloud115Sdk) {
    cloud115Sdk = create115Sdk();
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
  if (!cloud115Sdk) {
    return initCloud115Sdk();
  }
  return cloud115Sdk;
}
