import type { JsonValue } from '../../types';

export const formatJson = (value: string) => {
  const parsed = JSON.parse(value) as JsonValue;
  return {
    formatted: JSON.stringify(parsed, null, 2),
    parsedJson: parsed,
  };
};
