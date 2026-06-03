import { formatContent } from './utils/format-content';
import type { FormatResult, FormatSourceMode } from './types';

export interface FormatterPanelState {
  status: 'idle' | 'ready';
  formatType: FormatResult['formatType'] | null;
  detailType: FormatResult['detailType'] | null;
  sourceMode: FormatSourceMode | null;
  formatted: string;
  parsedJson: FormatResult['parsedJson'] | null;
  outputMode: 'empty' | 'formatted' | 'json-tree';
}

export const buildFormatterPanelState = (source: string): FormatterPanelState => {
  if (!source.trim()) {
    return {
      status: 'idle',
      formatType: null,
      detailType: null,
      sourceMode: null,
      formatted: '',
      parsedJson: null,
      outputMode: 'empty',
    };
  }

  const result = formatContent(source);
  const parsedJson = result.parsedJson || null;

  return {
    status: 'ready',
    formatType: result.formatType,
    detailType: result.detailType || null,
    sourceMode: result.sourceMode,
    formatted: result.formatted,
    parsedJson,
    outputMode: result.detailType === 'json' && parsedJson ? 'json-tree' : 'formatted',
  };
};
