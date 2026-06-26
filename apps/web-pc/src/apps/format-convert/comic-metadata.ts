import type { FormatComicAnalysis, FormatComicInfo } from '@volix/types';

export interface ComicMetadataDraft {
  metadata: FormatComicInfo;
}

export const createComicMetadataDraft = (): ComicMetadataDraft => ({
  metadata: {
    manga: 'Unknown',
    genres: [],
    tags: [],
    characters: [],
    teams: [],
    locations: [],
  },
});

export const hydrateComicMetadataDraft = (analysis?: FormatComicAnalysis | null): ComicMetadataDraft => ({
  metadata: {
    ...createComicMetadataDraft().metadata,
    ...(analysis?.comicInfo || {}),
  },
});

export const buildComicTargetFileName = (sourceName: string) => {
  const baseName = String(sourceName || '').replace(/\.[^.]+$/, '') || 'comic';
  return `${baseName}.cbz`;
};
