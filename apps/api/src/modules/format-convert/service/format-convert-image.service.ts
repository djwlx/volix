import fs from 'fs';
import sharp from 'sharp';
import type { FormatConvertImageInfo, FormatConvertImageOption } from '@volix/types';
import { configureSharpRuntime } from '../../../utils/sharp-runtime';

configureSharpRuntime(sharp);

export const probeImageFile = async (filePath: string): Promise<FormatConvertImageInfo> => {
  const [metadata, stat] = await Promise.all([sharp(filePath).metadata(), fs.promises.stat(filePath)]);
  return {
    format: String(metadata.format || ''),
    width: Number(metadata.width || 0),
    height: Number(metadata.height || 0),
    sizeBytes: Number(stat.size || 0),
  };
};

export const resolveImageOutputExtension = (outputFormat: FormatConvertImageOption['outputFormat']) => {
  return outputFormat === 'jpeg' ? 'jpg' : outputFormat;
};

export const convertImageFile = async (inputPath: string, outputPath: string, option: FormatConvertImageOption) => {
  let transformer = sharp(inputPath).rotate();
  if (option.width) {
    transformer = transformer.resize({ width: option.width, withoutEnlargement: true, fit: 'inside' });
  }
  const quality = option.quality;
  if (option.outputFormat === 'jpeg') {
    transformer = transformer.jpeg({ quality });
  } else if (option.outputFormat === 'png') {
    transformer = transformer.png({ quality });
  } else if (option.outputFormat === 'avif') {
    transformer = transformer.avif({ quality });
  } else {
    transformer = transformer.webp({ quality });
  }
  await transformer.toFile(outputPath);
};
