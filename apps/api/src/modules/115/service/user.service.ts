import { getCloud115Sdk } from './sdk.service';

export async function get115UserInfoData() {
  const sdk = await getCloud115Sdk();
  return sdk.getUserInfo();
}
