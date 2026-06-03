import { buildCloudProxyUrl } from './picture-cloud-proxy';

export const buildPicCacheDownloadRequestUrl = (params: {
  originUrl: string;
  cloudProxyUrl: string;
  userAgent?: string;
}) => {
  return buildCloudProxyUrl(params.originUrl, params.cloudProxyUrl, params.userAgent);
};
