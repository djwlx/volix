export type FormatType = 'json' | 'xml' | 'base64';
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type NestedSource = 'direct' | 'base64';

export type ParsedStringValue =
  | { kind: 'json'; source: NestedSource; formatted: string; parsedJson: JsonValue; decodedText?: string }
  | { kind: 'xml'; source: NestedSource; formatted: string; decodedText?: string }
  | { kind: 'text'; source: 'base64'; formatted: string; decodedText: string };

export interface FormatResult {
  formatType: FormatType;
  formatted: string;
  parsedJson?: JsonValue;
  detailType?: 'json' | 'xml' | 'text';
}
