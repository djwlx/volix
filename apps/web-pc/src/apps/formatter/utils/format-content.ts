import type { FormatResult } from '../types';
import { tryParseNestedStringValue } from './nested';
import { encodeBase64 } from './formatters/base64';
import { formatJson } from './formatters/json';
import { formatXml } from './formatters/xml';
import { detectFormatType, getContentCandidates } from './shared';

export const formatContent = (value: string): FormatResult => {
  for (const candidate of getContentCandidates(value)) {
    const directType = detectFormatType(candidate);

    if (directType === 'json') {
      try {
        const result = formatJson(candidate);
        return {
          formatType: 'json',
          formatted: result.formatted,
          parsedJson: result.parsedJson,
          detailType: 'json',
        };
      } catch {
        continue;
      }
    }

    if (directType === 'xml') {
      try {
        return {
          formatType: 'xml',
          formatted: formatXml(candidate),
          detailType: 'xml',
        };
      } catch {
        continue;
      }
    }
  }

  const base64Result = tryParseNestedStringValue(value);
  if (base64Result?.source === 'base64') {
    return {
      formatType: 'base64',
      formatted: base64Result.formatted,
      parsedJson: base64Result.kind === 'json' ? base64Result.parsedJson : undefined,
      detailType: base64Result.kind,
    };
  }

  return {
    formatType: 'base64',
    formatted: encodeBase64(value),
    detailType: 'text',
  };
};
