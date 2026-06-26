import type { FormatComicInfo, FormatComicMangaMode } from '@volix/types';

const ARRAY_FIELDS = new Set<keyof FormatComicInfo>(['genres', 'tags', 'characters', 'teams', 'locations']);
const NUMBER_FIELDS = new Set<keyof FormatComicInfo>(['count', 'pageCount', 'year', 'month', 'day']);
const BOOLEAN_FIELDS = new Set<keyof FormatComicInfo>(['blackAndWhite']);
const XML_TAG_MAP: Record<keyof FormatComicInfo, string> = {
  title: 'Title',
  series: 'Series',
  number: 'Number',
  count: 'Count',
  volume: 'Volume',
  pageCount: 'PageCount',
  summary: 'Summary',
  notes: 'Notes',
  genres: 'Genre',
  tags: 'Tags',
  writer: 'Writer',
  penciller: 'Penciller',
  inker: 'Inker',
  colorist: 'Colorist',
  letterer: 'Letterer',
  coverArtist: 'CoverArtist',
  editor: 'Editor',
  publisher: 'Publisher',
  imprint: 'Imprint',
  web: 'Web',
  languageISO: 'LanguageISO',
  format: 'Format',
  ageRating: 'AgeRating',
  blackAndWhite: 'BlackAndWhite',
  manga: 'Manga',
  characters: 'Characters',
  teams: 'Teams',
  locations: 'Locations',
  storyArc: 'StoryArc',
  seriesGroup: 'SeriesGroup',
  scanInformation: 'ScanInformation',
  year: 'Year',
  month: 'Month',
  day: 'Day',
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const decodeXml = (value: string) =>
  value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');

const normalizeList = (value: string) =>
  value
    .split(/[,/\n\r]+/)
    .map(item => item.trim())
    .filter(Boolean);

const readXmlTag = (xml: string, tagName: string) => {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match?.[1] ? decodeXml(match[1].trim()) : '';
};

const writeXmlTag = (tagName: string, value: string | number | boolean) => {
  const normalized = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  if (!normalized.trim()) {
    return '';
  }
  return `  <${tagName}>${escapeXml(normalized)}</${tagName}>`;
};

const isComicMangaMode = (value: string): value is FormatComicMangaMode =>
  value === 'Unknown' || value === 'No' || value === 'Yes' || value === 'YesAndRightToLeft';

export const parseComicInfoXml = (xml: string): FormatComicInfo => {
  const result: FormatComicInfo = {};

  for (const [field, tagName] of Object.entries(XML_TAG_MAP) as Array<[keyof FormatComicInfo, string]>) {
    const rawValue = readXmlTag(xml, tagName);
    if (!rawValue) {
      continue;
    }
    if (ARRAY_FIELDS.has(field)) {
      result[field] = normalizeList(rawValue) as never;
      continue;
    }
    if (NUMBER_FIELDS.has(field)) {
      const parsed = Number.parseInt(rawValue, 10);
      if (Number.isFinite(parsed)) {
        result[field] = parsed as never;
      }
      continue;
    }
    if (BOOLEAN_FIELDS.has(field)) {
      result[field] = /^(yes|true|1)$/i.test(rawValue) as never;
      continue;
    }
    if (field === 'manga') {
      if (isComicMangaMode(rawValue)) {
        result.manga = rawValue;
      }
      continue;
    }
    result[field] = rawValue as never;
  }

  return result;
};

export const buildComicInfoXml = (info: FormatComicInfo) => {
  const lines = ['<?xml version="1.0" encoding="utf-8"?>', '<ComicInfo>'];

  for (const [field, tagName] of Object.entries(XML_TAG_MAP) as Array<[keyof FormatComicInfo, string]>) {
    const value = info[field];
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      const joined = value
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .join(', ');
      if (joined) {
        lines.push(writeXmlTag(tagName, joined));
      }
      continue;
    }
    lines.push(writeXmlTag(tagName, value));
  }

  lines.push('</ComicInfo>');
  return lines.filter(Boolean).join('\n');
};

const hasMeaningfulValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.some(item => String(item || '').trim());
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'boolean') {
    return true;
  }
  return Boolean(String(value || '').trim());
};

export const countComicInfoFields = (info: FormatComicInfo) =>
  (Object.keys(XML_TAG_MAP) as Array<keyof FormatComicInfo>).filter(field => hasMeaningfulValue(info[field])).length;

export const mergeComicInfo = (
  existing: FormatComicInfo | undefined,
  incoming: FormatComicInfo,
  strategy: 'merge' | 'replace' = 'merge'
): FormatComicInfo => {
  if (strategy === 'replace') {
    return { ...incoming };
  }

  const merged: FormatComicInfo = { ...(existing || {}) };
  for (const field of Object.keys(XML_TAG_MAP) as Array<keyof FormatComicInfo>) {
    const value = incoming[field];
    if (!hasMeaningfulValue(value)) {
      continue;
    }
    merged[field] = value as never;
  }
  return merged;
};
