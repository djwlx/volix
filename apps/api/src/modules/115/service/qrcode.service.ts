import type { QrCodeStatusParams } from '@volix/types';
import { getCloud115Sdk } from './sdk.service';

export async function get115QrCodeData() {
  const sdk = await getCloud115Sdk();
  return sdk.getQrCode();
}

export async function get115QrCodeStatusData(query: QrCodeStatusParams) {
  const sdk = await getCloud115Sdk();
  const result = await sdk.getQrStatus(query);
  return result.data;
}
