export type LogViewerType = 'normal' | 'database';

export type LogViewerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogViewerEntry {
  timestamp: string;
  level: LogViewerLevel;
  category: string;
  message: string;
}

export interface LogViewerDatesResponse {
  dates: string[];
}

export interface LogViewerEntriesResponse {
  items: LogViewerEntry[];
  total: number;
}
