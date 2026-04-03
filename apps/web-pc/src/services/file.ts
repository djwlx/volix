import { http } from '@/utils';
import type { UploadFileResponse } from '@volix/types';

export const uploadLocalFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<UploadFileResponse>('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
