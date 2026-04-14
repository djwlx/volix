import type { FormatType } from '../types';

export const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const detectFormatType = (value: string): Exclude<FormatType, 'base64'> | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('<')) {
    return 'xml';
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }

  return null;
};

const unwrapQuotedString = (value: string) => {
  const trimmed = value.trim();
  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");

  if (!hasDoubleQuotes && !hasSingleQuotes) {
    return value;
  }

  return trimmed.slice(1, -1);
};

const decodeEscapedString = (value: string) =>
  value
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

export const tryNormalizeEscapedContent = (value: string) => {
  const trimmed = value.trim();
  const candidates = [trimmed, unwrapQuotedString(trimmed)];

  for (const candidate of candidates) {
    const onceDecoded = decodeEscapedString(candidate);
    const onceNormalized = onceDecoded.trim();
    if (onceNormalized !== trimmed && detectFormatType(onceNormalized)) {
      return onceNormalized;
    }

    const twiceDecoded = decodeEscapedString(onceDecoded);
    const twiceNormalized = twiceDecoded.trim();
    if (twiceNormalized !== trimmed && detectFormatType(twiceNormalized)) {
      return twiceNormalized;
    }
  }

  return trimmed;
};

export const getContentCandidates = (value: string) => {
  const trimmed = value.trim();
  const normalized = tryNormalizeEscapedContent(value);

  if (normalized === trimmed) {
    return [trimmed];
  }

  return [trimmed, normalized];
};

export const isProbablyText = (value: string) => {
  if (!value) {
    return false;
  }

  let printable = 0;
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126) || code > 159) {
      printable += 1;
    }
  }

  return printable / value.length > 0.85;
};
