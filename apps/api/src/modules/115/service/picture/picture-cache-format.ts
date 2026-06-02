import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getLikedPicCacheDir } from './picture-cache-random-core';
import { configureSharpRuntime } from '../../../../utils/sharp-runtime';

configureSharpRuntime(sharp);

const webpBuildJobMap = new Map<string, Promise<FormattedLocalPicCache>>();

export type PicCacheFormat = 'origin' | 'webp';
export type PicCacheFormatOptions = {
  width?: number;
  quality: number;
};

export type LocalPicCacheSource = {
  pc: string;
  filePath: string;
  fileName: string;
  mimeType: string | false;
};

export type FormattedLocalPicCache = {
  filePath: string;
  fileName: string;
  mimeType: string | false;
};

export const normalizePicCacheFormat = (rawFormat: unknown): PicCacheFormat => {
  const normalized = String(rawFormat || '')
    .trim()
    .toLowerCase();
  return normalized === 'webp' ? 'webp' : 'origin';
};

const clampInteger = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
};

export const normalizePicCacheFormatOptions = (params?: {
  width?: unknown;
  quality?: unknown;
}): PicCacheFormatOptions => {
  const rawWidth = Number(params?.width);
  const rawQuality = Number(params?.quality);
  const width = Number.isFinite(rawWidth) && rawWidth > 0 ? clampInteger(rawWidth, 120, 4096) : undefined;
  const quality = Number.isFinite(rawQuality) ? clampInteger(rawQuality, 40, 95) : 82;
  return {
    width,
    quality,
  };
};

const getWebpCacheDir = () => path.join(getLikedPicCacheDir(), 'webp');

const getWebpCachePathByPc = (pc: string, options: PicCacheFormatOptions) => {
  const widthPart = options.width ? `w${options.width}` : 'w0';
  const qualityPart = `q${options.quality}`;
  return path.join(getWebpCacheDir(), `${pc}.${widthPart}.${qualityPart}.webp`);
};

const isFreshWebpCache = async (sourcePath: string, webpPath: string) => {
  try {
    const [sourceStat, webpStat] = await Promise.all([fs.promises.stat(sourcePath), fs.promises.stat(webpPath)]);
    return webpStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
};

const convertToWebp = async (sourcePath: string, outputPath: string, options: PicCacheFormatOptions) => {
  let transformer = sharp(sourcePath).rotate();
  if (options.width) {
    transformer = transformer.resize({
      width: options.width,
      withoutEnlargement: true,
      fit: 'inside',
    });
  }
  await transformer
    .webp({
      quality: options.quality,
      effort: 4,
    })
    .toFile(outputPath);
};

const buildWebpCacheBySource = async (
  source: LocalPicCacheSource,
  options: PicCacheFormatOptions
): Promise<FormattedLocalPicCache> => {
  await fs.promises.access(source.filePath, fs.constants.R_OK);

  const webpPath = getWebpCachePathByPc(source.pc, options);
  const fresh = await isFreshWebpCache(source.filePath, webpPath);
  if (fresh) {
    return {
      filePath: webpPath,
      fileName: path.basename(webpPath),
      mimeType: 'image/webp',
    };
  }

  const runningJob = webpBuildJobMap.get(webpPath);
  if (runningJob) {
    return runningJob;
  }

  const buildJob = (async () => {
    await fs.promises.mkdir(getWebpCacheDir(), { recursive: true });
    const tempPath = `${webpPath}.tmp.webp`;
    try {
      await convertToWebp(source.filePath, tempPath, options);
      await fs.promises.rename(tempPath, webpPath);
    } catch (error) {
      await fs.promises.unlink(tempPath).catch(() => undefined);
      throw error;
    } finally {
      webpBuildJobMap.delete(webpPath);
    }
    return {
      filePath: webpPath,
      fileName: path.basename(webpPath),
      mimeType: 'image/webp',
    };
  })();

  webpBuildJobMap.set(webpPath, buildJob);
  return buildJob;
};

export const resolvePicCacheByFormat = async (params: {
  format: PicCacheFormat;
  source: LocalPicCacheSource;
  options?: PicCacheFormatOptions;
}): Promise<FormattedLocalPicCache> => {
  const { format, source } = params;
  if (format !== 'webp') {
    return {
      filePath: source.filePath,
      fileName: source.fileName,
      mimeType: source.mimeType,
    };
  }
  return buildWebpCacheBySource(source, params.options || normalizePicCacheFormatOptions());
};

export const clearWebpCacheByPc = async (pc: string) => {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    return false;
  }
  try {
    const entries = await fs.promises.readdir(getWebpCacheDir(), {
      withFileTypes: true,
    });
    const targets = entries
      .filter(entry => entry.isFile() && entry.name.startsWith(`${normalizedPc}.`) && entry.name.endsWith('.webp'))
      .map(entry => path.join(getWebpCacheDir(), entry.name));
    if (targets.length === 0) {
      return false;
    }
    await Promise.all(targets.map(target => fs.promises.unlink(target).catch(() => undefined)));
    return true;
  } catch {
    return false;
  }
};
