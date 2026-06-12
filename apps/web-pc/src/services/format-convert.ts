import axios from 'axios';
import { http } from '@/utils';
import { clearAuthToken, getAuthToken, getTokenHeaderKey } from '@/utils/auth';
import { getStoredLocale } from '@/i18n';
import type {
  CreateFormatConvertTaskRequest,
  CreateFormatConvertTaskResult,
  FormatConvertOpenlistBrowserResult,
  GetFormatConvertTaskListResult,
} from '@volix/types';

export function createLocalFormatConvertTask(
  file: File,
  payload: Omit<CreateFormatConvertTaskRequest, 'mode' | 'source' | 'option'> & {
    option?: CreateFormatConvertTaskRequest['option'];
  },
  options?: {
    onUploadProgress?: (percent: number) => void;
  }
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('payload', JSON.stringify(payload));
  return http.post<CreateFormatConvertTaskResult>('/format-convert/local-task', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: event => {
      const total = Number(event.total || 0);
      const loaded = Number(event.loaded || 0);
      const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      options?.onUploadProgress?.(percent);
    },
  });
}

export function createCloudFormatConvertTask(payload: CreateFormatConvertTaskRequest) {
  return http.post<CreateFormatConvertTaskResult>('/format-convert/cloud-task', payload);
}

export function getFormatConvertTasks() {
  return http.get<GetFormatConvertTaskListResult>('/format-convert/tasks');
}

export function retryFormatConvertTask(taskId: number) {
  return http.post<{ success: boolean }>(`/format-convert/task/${taskId}/retry`);
}

export function cleanupFormatConvertTask(taskId: number) {
  return http.post<{ success: boolean }>(`/format-convert/task/${taskId}/cleanup`);
}

export function deleteFormatConvertTask(taskId: number) {
  return http.post<{ success: boolean }>(`/format-convert/task/${taskId}/delete`);
}

export function deleteFormatConvertTasks(taskIds: number[]) {
  return http.post<{ success: boolean; deletedCount: number }>('/format-convert/tasks/delete', {
    taskIds,
  });
}

export function browseFormatConvertOpenlist(params?: { path?: string; page?: number; perPage?: number }) {
  return http.get<FormatConvertOpenlistBrowserResult>('/format-convert/openlist/fs', {
    params: {
      path: params?.path || '/',
      page: params?.page || 1,
      perPage: params?.perPage || 20,
    },
  });
}

export const getFormatConvertResultDownloadUrl = (taskId: number) => `/api/format-convert/task/${taskId}/result`;

const parseDownloadFilename = (contentDisposition?: string | null, fallback = 'converted.bin') => {
  const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const plainMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return decodeURIComponent(plainMatch[1]);
  }

  return fallback;
};

const toDownloadError = async (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return error;
  }

  const status = error.response?.status;
  const data = error.response?.data;
  if (status === 401 || status === 403) {
    clearAuthToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text) as { message?: string };
      return {
        ...error,
        response: {
          ...error.response,
          data: {
            message: json.message || error.message,
          },
        },
      };
    } catch {
      return error;
    }
  }

  return error;
};

const downloadFormatConvertArtifact = async (downloadUrl: string, fallbackFilename: string) => {
  try {
    const response = await axios.get<Blob>(downloadUrl, {
      baseURL: '',
      responseType: 'blob',
      headers: {
        [getTokenHeaderKey()]: getAuthToken() || '',
        'volix-language': getStoredLocale(),
      },
    });

    const filename = parseDownloadFilename(response.headers['content-disposition'], fallbackFilename);
    const objectUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    throw await toDownloadError(error);
  }
};

export async function downloadFormatConvertResult(taskId: number) {
  await downloadFormatConvertArtifact(getFormatConvertResultDownloadUrl(taskId), `task-${taskId}-result.bin`);
}
