export interface UploadedFileMeta {
  extension: string;
  name: string;
  uuid: string;
  size: number;
  mime_type: string;
  path: string;
  storage?: 'local';
  status?: 'normal' | 'deleted';
}

export interface UploadFileResponse extends UploadedFileMeta {}
