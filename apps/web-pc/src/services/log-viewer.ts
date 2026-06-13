import { http } from '@/utils';
import type { LogViewerDatesResponse, LogViewerEntriesResponse, LogViewerLevel, LogViewerType } from '@volix/types';

export const getLogDates = (type: LogViewerType) => {
  return http.get<LogViewerDatesResponse>('/log-viewer/dates', { params: { type } });
};

export const getLogEntries = (params: {
  type: LogViewerType;
  date: string;
  levels?: LogViewerLevel[];
  keyword?: string;
  page?: number;
  pageSize?: number;
}) => {
  return http.get<LogViewerEntriesResponse>('/log-viewer/entries', {
    params: {
      type: params.type,
      date: params.date,
      levels: params.levels?.length ? params.levels.join(',') : undefined,
      keyword: params.keyword || undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
};

export const downloadLogFile = async (type: LogViewerType, date: string): Promise<Blob> => {
  const blob = await http.get<Blob>('/log-viewer/download', {
    params: { type, date },
    responseType: 'blob',
  });
  return blob as unknown as Blob;
};
