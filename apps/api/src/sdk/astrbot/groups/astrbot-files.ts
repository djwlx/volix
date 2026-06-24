import FormData from 'form-data';
import type { AstrbotRequest, AstrbotUploadFileInput } from '../types';

export const createAstrbotFileMethods = (request: AstrbotRequest) => ({
  // 上传附件，返回 { attachment_id, filename, type }，可用于消息段引用
  uploadFile: <T = unknown>(input: AstrbotUploadFileInput) => {
    const form = new FormData();
    form.append('file', input.file, {
      filename: input.filename,
      ...(input.contentType ? { contentType: input.contentType } : {}),
    });
    return request<T>({
      path: '/api/v1/file',
      method: 'POST',
      data: form,
      headers: form.getHeaders(),
      requireAuth: true,
    });
  },
});
