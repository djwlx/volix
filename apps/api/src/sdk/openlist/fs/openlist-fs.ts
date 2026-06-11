import path from 'path';
import type { RequestOpenlist } from '../core/request-openlist';
import type {
  OpenlistArchiveDecompressParams,
  OpenlistArchiveListParams,
  OpenlistDirectoryTreeParams,
  OpenlistFsBatchRenameParams,
  OpenlistFsGetData,
  OpenlistFsGetParams,
  OpenlistFsListData,
  OpenlistFsListParams,
  OpenlistFsMkdirParams,
  OpenlistFsMoveCopyParams,
  OpenlistFsObject,
  OpenlistFsOtherParams,
  OpenlistFsRegexRenameParams,
  OpenlistFsRemoveParams,
  OpenlistFsRenameParams,
  OpenlistFsSearchParams,
  OpenlistOfflineDownloadTaskParams,
  OpenlistUploadFormParams,
  OpenlistUploadStreamParams,
} from '../core/openlist.types';

const buildOpenlistFilePath = (dirPath: string, filename: string) => {
  const normalizedDir = dirPath.trim() ? dirPath : '/';
  return encodeURI(path.posix.join(normalizedDir, filename));
};

export const createOpenlistFsModule = (requestOpenlist: RequestOpenlist) => ({
  listFs: (params: OpenlistFsListParams) =>
    requestOpenlist<OpenlistFsListData>({
      url: '/api/fs/list',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
        page: params.page ?? 1,
        per_page: params.perPage ?? 0,
        refresh: params.refresh ?? false,
      },
    }),
  getFs: (params: OpenlistFsGetParams) =>
    requestOpenlist<OpenlistFsGetData>({
      url: '/api/fs/get',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
      },
    }),
  searchFs: (params: OpenlistFsSearchParams) =>
    requestOpenlist<OpenlistFsListData>({
      url: '/api/fs/search',
      method: 'POST',
      data: {
        parent: params.parent,
        keywords: params.keywords,
        scope: params.scope ?? 0,
        password: params.password || '',
        page: params.page ?? 1,
        per_page: params.perPage ?? 20,
      },
    }),
  getDirectoryTree: (params: OpenlistDirectoryTreeParams) =>
    requestOpenlist<OpenlistFsObject[]>({
      url: '/api/fs/dirs',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
      },
    }),
  getFsOther: (params: OpenlistFsOtherParams) =>
    requestOpenlist<Record<string, unknown>>({
      url: '/api/fs/other',
      method: 'POST',
      data: {
        path: params.path,
        method: params.method || '',
        password: params.password || '',
      },
    }),
  mkdir: (params: OpenlistFsMkdirParams) =>
    requestOpenlist<null>({
      url: '/api/fs/mkdir',
      method: 'POST',
      data: {
        path: params.path,
      },
    }),
  rename: (params: OpenlistFsRenameParams) =>
    requestOpenlist<null>({
      url: '/api/fs/rename',
      method: 'POST',
      data: {
        path: params.path,
        name: params.name,
      },
    }),
  batchRename: (params: OpenlistFsBatchRenameParams) =>
    requestOpenlist<null>({
      url: '/api/fs/batch_rename',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        rename_objects: params.renameObjects.map(item => ({
          src_name: item.srcName,
          new_name: item.newName,
        })),
      },
    }),
  regexRename: (params: OpenlistFsRegexRenameParams) =>
    requestOpenlist<null>({
      url: '/api/fs/regex_rename',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        names: params.names,
        regex: params.regex,
        replace: params.replace,
      },
    }),
  move: (params: OpenlistFsMoveCopyParams) =>
    requestOpenlist<null>({
      url: '/api/fs/move',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        dst_dir: params.dstDir,
        names: params.names,
      },
    }),
  recursiveMove: (params: OpenlistFsMoveCopyParams) =>
    requestOpenlist<null>({
      url: '/api/fs/recursive_move',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        dst_dir: params.dstDir,
        names: params.names,
      },
    }),
  copy: (params: OpenlistFsMoveCopyParams) =>
    requestOpenlist<null>({
      url: '/api/fs/copy',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        dst_dir: params.dstDir,
        names: params.names,
      },
    }),
  remove: (params: OpenlistFsRemoveParams) =>
    requestOpenlist<null>({
      url: '/api/fs/remove',
      method: 'POST',
      data: {
        dir: params.dir,
        names: params.names,
      },
    }),
  removeEmptyDirectory: (params: { srcDir: string }) =>
    requestOpenlist<null>({
      url: '/api/fs/remove_empty_directory',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
      },
    }),
  uploadFileByStream: (params: OpenlistUploadStreamParams) =>
    requestOpenlist<null>({
      url: '/api/fs/put',
      method: 'PUT',
      data: params.stream,
      headers: {
        'Content-Type': 'application/octet-stream',
        'File-Path': buildOpenlistFilePath(params.path, params.filename),
        'As-Task': params.asTask ? 'true' : 'false',
        ...(params.password ? { Password: params.password } : {}),
      },
    }),
  uploadFileByForm: (params: OpenlistUploadFormParams) =>
    requestOpenlist<null>({
      url: '/api/fs/form',
      method: 'PUT',
      data: params.formData,
      headers: {
        'File-Path': params.path,
        'As-Task': params.asTask ? 'true' : 'false',
        ...(params.password ? { Password: params.password } : {}),
        ...(params.headers || {}),
      },
    }),
  addOfflineDownloadTask: (params: OpenlistOfflineDownloadTaskParams) =>
    requestOpenlist<null>({
      url: '/api/fs/add_offline_download',
      method: 'POST',
      data: {
        path: params.path,
        urls: params.urls,
        tool: params.tool || '',
        delete_policy: params.deletePolicy || '',
      },
    }),
  decompressArchive: (params: OpenlistArchiveDecompressParams) =>
    requestOpenlist<null>({
      url: '/api/fs/archive/decompress',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        name: params.name,
        dst_dir: params.dstDir,
        password: params.password || '',
      },
    }),
  getArchiveMeta: (params: OpenlistFsGetParams) =>
    requestOpenlist<Record<string, unknown>>({
      url: '/api/fs/archive/meta',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
      },
    }),
  listArchiveContents: (params: OpenlistArchiveListParams) =>
    requestOpenlist<OpenlistFsListData>({
      url: '/api/fs/archive/list',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
        page: params.page ?? 1,
        per_page: params.perPage ?? 20,
      },
    }),
});
