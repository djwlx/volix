import type { RequestOpenlist } from '../core/request-openlist';
import type { OpenlistOfflineDownloadTool } from '../core/openlist.types';

export const createOpenlistPublicModule = (requestOpenlist: RequestOpenlist) => ({
  getPublicSettings: () =>
    requestOpenlist<Record<string, string | number | boolean | null>>(
      {
        url: '/api/public/settings',
        method: 'GET',
      },
      false
    ),
  getOfflineDownloadTools: () =>
    requestOpenlist<OpenlistOfflineDownloadTool[]>(
      {
        url: '/api/public/offline_download_tools',
        method: 'GET',
      },
      false
    ),
  getArchiveExtensions: () =>
    requestOpenlist<string[]>(
      {
        url: '/api/public/archive_extensions',
        method: 'GET',
      },
      false
    ),
});
