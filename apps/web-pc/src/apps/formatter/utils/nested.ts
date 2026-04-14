import type { ParsedStringValue } from '../types';
import { tryDecodeBase64 } from './formatters/base64';
import { formatJson } from './formatters/json';
import { formatXml } from './formatters/xml';
import { detectFormatType, getContentCandidates, tryNormalizeEscapedContent } from './shared';

export const tryParseNestedStringValue = (value: string, depth = 0): ParsedStringValue | null => {
  if (depth > 4) {
    return null;
  }

  for (const candidate of getContentCandidates(value)) {
    const directType = detectFormatType(candidate);

    if (directType === 'json') {
      try {
        const result = formatJson(candidate);
        return {
          kind: 'json',
          source: 'direct',
          formatted: result.formatted,
          parsedJson: result.parsedJson,
        };
      } catch {
        continue;
      }
    }

    if (directType === 'xml') {
      try {
        return {
          kind: 'xml',
          source: 'direct',
          formatted: formatXml(candidate),
        };
      } catch {
        continue;
      }
    }
  }

  const normalizedValue = tryNormalizeEscapedContent(value);
  const decodedBase64 = tryDecodeBase64(normalizedValue);
  if (!decodedBase64) {
    return null;
  }

  const nestedDecoded = tryParseNestedStringValue(decodedBase64, depth + 1);
  if (nestedDecoded?.kind === 'json') {
    return {
      kind: 'json',
      source: 'base64',
      formatted: nestedDecoded.formatted,
      parsedJson: nestedDecoded.parsedJson,
      decodedText: decodedBase64,
    };
  }

  if (nestedDecoded?.kind === 'xml') {
    return {
      kind: 'xml',
      source: 'base64',
      formatted: nestedDecoded.formatted,
      decodedText: decodedBase64,
    };
  }

  return {
    kind: 'text',
    source: 'base64',
    formatted: decodedBase64,
    decodedText: decodedBase64,
  };
};
