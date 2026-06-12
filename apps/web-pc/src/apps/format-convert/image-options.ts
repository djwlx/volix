import {
  FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS,
  type FormatConvertImageFormat,
  type FormatConvertImageOption,
} from '@volix/types';

export interface ImageConvertFormDraft {
  option: FormatConvertImageOption;
  targetFileName: string;
}

export const createImageConvertDraft = (): ImageConvertFormDraft => ({
  option: { outputFormat: 'webp', quality: 82 },
  targetFileName: '',
});

export const buildImageFormatOptions = () =>
  [...FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS].map(value => ({ label: value.toUpperCase(), value }));

export const resolveImageExtension = (outputFormat: FormatConvertImageFormat) =>
  outputFormat === 'jpeg' ? 'jpg' : outputFormat;

export const buildImageTargetFileName = (sourceName: string, outputFormat: FormatConvertImageFormat) => {
  const baseName = String(sourceName || '').replace(/\.[^.]+$/, '') || 'converted';
  return `${baseName}.${resolveImageExtension(outputFormat)}`;
};

export const updateImageDraftOption = (
  draft: ImageConvertFormDraft,
  patch: Partial<FormatConvertImageOption>
): ImageConvertFormDraft => ({
  ...draft,
  option: { ...draft.option, ...patch },
});
