import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import type { FormatComicAnalysis, FormatComicInfo, FormatComicMetadataOption, FormatComicSummary } from '@volix/types';
import {
  buildComicInfoXml,
  countComicInfoFields,
  mergeComicInfo,
  parseComicInfoXml,
} from './format-convert-comic-info.service';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const COMIC_INFO_FILE_NAME = 'comicinfo.xml';

const getNormalizedExtension = (filePath: string) => path.extname(filePath).toLowerCase();

const openArchive = (filePath: string) => new AdmZip(filePath);

const findComicInfoEntry = (archive: AdmZip) =>
  archive.getEntries().find(entry => path.basename(entry.entryName).toLowerCase() === COMIC_INFO_FILE_NAME);

const listImageEntries = (archive: AdmZip) =>
  archive
    .getEntries()
    .filter(entry => !entry.isDirectory && IMAGE_EXTENSIONS.has(path.extname(entry.entryName).toLowerCase()));

const readComicInfo = (archive: AdmZip): FormatComicInfo | undefined => {
  const entry = findComicInfoEntry(archive);
  if (!entry) {
    return undefined;
  }
  const xml = entry.getData().toString('utf8');
  return parseComicInfoXml(xml);
};

export const analyzeComicArchive = async (filePath: string): Promise<FormatComicAnalysis> => {
  const archive = openArchive(filePath);
  const extension = getNormalizedExtension(filePath);
  const comicInfo = readComicInfo(archive);
  const imageEntries = listImageEntries(archive);

  return {
    archiveFormat: 'zip',
    fileExtension: extension,
    expectedExtension: '.cbz',
    extensionMatches: extension === '.cbz',
    hasComicInfo: Boolean(comicInfo),
    entriesCount: archive.getEntries().filter(entry => !entry.isDirectory).length,
    imageCount: imageEntries.length,
    pageCount: imageEntries.length,
    comicInfo,
  };
};

export const fillComicMetadataForArchive = async ({
  sourcePath,
  outputPath,
  metadata,
  normalizeExtension = true,
  mergeStrategy = 'merge',
}: {
  sourcePath: string;
  outputPath: string;
} & FormatComicMetadataOption): Promise<{
  sourceAnalysis: FormatComicAnalysis;
  resultAnalysis: FormatComicAnalysis;
  summary: FormatComicSummary;
}> => {
  const sourceAnalysis = await analyzeComicArchive(sourcePath);
  const archive = openArchive(sourcePath);
  const mergedComicInfo = mergeComicInfo(sourceAnalysis.comicInfo, metadata, mergeStrategy);
  const xml = buildComicInfoXml(mergedComicInfo);

  for (const entry of archive.getEntries()) {
    if (path.basename(entry.entryName).toLowerCase() === COMIC_INFO_FILE_NAME) {
      archive.deleteFile(entry.entryName);
    }
  }

  archive.addFile('ComicInfo.xml', Buffer.from(xml, 'utf8'));
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  archive.writeZip(outputPath);

  const resultAnalysis = await analyzeComicArchive(outputPath);
  return {
    sourceAnalysis,
    resultAnalysis,
    summary: {
      mergeStrategy,
      targetExtension: '.cbz',
      normalizedExtension: normalizeExtension && path.extname(outputPath).toLowerCase() === '.cbz',
      metadataWritten: true,
      metadataFieldCount: countComicInfoFields(mergedComicInfo),
    },
  };
};
