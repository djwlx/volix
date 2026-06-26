export type FormatComicMangaMode = 'Unknown' | 'No' | 'Yes' | 'YesAndRightToLeft';

export interface FormatComicInfo {
  title?: string;
  series?: string;
  number?: string;
  count?: number;
  volume?: string;
  pageCount?: number;
  summary?: string;
  notes?: string;
  genres?: string[];
  tags?: string[];
  writer?: string;
  penciller?: string;
  inker?: string;
  colorist?: string;
  letterer?: string;
  coverArtist?: string;
  editor?: string;
  publisher?: string;
  imprint?: string;
  web?: string;
  languageISO?: string;
  format?: string;
  ageRating?: string;
  blackAndWhite?: boolean;
  manga?: FormatComicMangaMode;
  characters?: string[];
  teams?: string[];
  locations?: string[];
  storyArc?: string;
  seriesGroup?: string;
  scanInformation?: string;
  year?: number;
  month?: number;
  day?: number;
}

export interface FormatComicMetadataOption {
  metadata: FormatComicInfo;
  normalizeExtension?: boolean;
  mergeStrategy?: 'merge' | 'replace';
}

export interface FormatComicAnalysis {
  archiveFormat: 'zip' | 'unknown';
  fileExtension: string;
  expectedExtension: '.cbz';
  extensionMatches: boolean;
  hasComicInfo: boolean;
  entriesCount: number;
  imageCount: number;
  pageCount: number;
  comicInfo?: FormatComicInfo;
}

export interface AnalyzeLocalComicFileResult {
  analysis: FormatComicAnalysis;
}

export interface FormatComicSummary {
  mergeStrategy: 'merge' | 'replace';
  targetExtension: '.cbz';
  normalizedExtension: boolean;
  metadataWritten: boolean;
  metadataFieldCount: number;
}
