import {
  FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS,
  type FormatConvertImageFormat,
  type FormatConvertImageOption,
  type FormatConvertImageSummary,
} from '@volix/types';

const IMAGE_FORMATS = new Set(FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS);
const DEFAULT_IMAGE_FORMAT: FormatConvertImageFormat = 'webp';
const DEFAULT_IMAGE_QUALITY = 82;
const MIN_IMAGE_WIDTH = 16;
const MAX_IMAGE_WIDTH = 8192;

const clampInteger = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, Math.round(value)));
};

export const normalizeFormatConvertImageOption = (
  option: Partial<FormatConvertImageOption>
): FormatConvertImageOption => {
  const rawFormat = String(option?.outputFormat || DEFAULT_IMAGE_FORMAT).toLowerCase();
  if (option?.outputFormat && !IMAGE_FORMATS.has(rawFormat)) {
    throw new Error('format-convert-image-format-not-supported');
  }
  const outputFormat = (IMAGE_FORMATS.has(rawFormat) ? rawFormat : DEFAULT_IMAGE_FORMAT) as FormatConvertImageFormat;

  const rawQuality = Number(option?.quality);
  const quality = Number.isFinite(rawQuality) ? clampInteger(rawQuality, 1, 100) : DEFAULT_IMAGE_QUALITY;

  const rawWidth = Number(option?.width);
  const width =
    Number.isFinite(rawWidth) && rawWidth > 0 ? clampInteger(rawWidth, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH) : undefined;

  return { outputFormat, quality, width };
};

export const buildFormatConvertImageSummary = (option: FormatConvertImageOption): FormatConvertImageSummary => {
  return {
    outputFormat: option.outputFormat,
    quality: option.quality,
    width: option.width,
  };
};
