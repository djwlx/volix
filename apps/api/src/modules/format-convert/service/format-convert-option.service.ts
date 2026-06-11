import {
  FORMAT_CONVERT_PRESET_DEFINITIONS,
  FormatConvertCommandMode,
  type FormatConvertOption,
  type FormatConvertSummary,
  type FormatConvertTaskItem,
} from '@volix/types';

const CUSTOM_ARGS_BLOCKLIST = new Set(['-i', '-y', '-n', '-filter_complex_script']);
const PATH_LIKE_REGEXP = /(^\/)|(\.\.?\/)|\.(mp4|mkv|mov|webm|mp3|aac|wav|flac|txt|json)$/i;
const AUDIO_ONLY_OUTPUT_FORMATS = new Set(['mp3', 'aac', 'wav', 'flac']);

const DEFAULT_OPTION: Pick<FormatConvertOption, 'resolution' | 'encodingPreset' | 'keepAudio'> = {
  resolution: 'source',
  encodingPreset: 'medium',
  keepAudio: true,
};

export const FORMAT_CONVERT_PRESETS = FORMAT_CONVERT_PRESET_DEFINITIONS;

const tokenizeCustomArgs = (customArgsText?: string) => {
  return String(customArgsText || '')
    .trim()
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean);
};

const validateCustomArgs = (extraArgs: string[]) => {
  let expectValue = false;
  for (const token of extraArgs) {
    if (CUSTOM_ARGS_BLOCKLIST.has(token)) {
      throw new Error('format-convert-custom-args-disallowed-option');
    }
    if (token.startsWith('-')) {
      expectValue = true;
      continue;
    }
    if (!expectValue || PATH_LIKE_REGEXP.test(token)) {
      throw new Error('format-convert-custom-args-disallowed-option');
    }
    expectValue = false;
  }
};

const findPreset = (presetId?: string) => {
  return FORMAT_CONVERT_PRESETS.find(item => item.id === String(presetId || '').trim());
};

const sanitizePresetOption = (option: FormatConvertOption): FormatConvertOption => {
  const nextOption = {
    ...option,
    extraArgs: undefined,
    customArgsText: undefined,
  };

  if (AUDIO_ONLY_OUTPUT_FORMATS.has(nextOption.outputFormat)) {
    nextOption.videoCodec = undefined;
    nextOption.resolution = 'source';
  }

  return nextOption;
};

export const normalizeFormatConvertOption = (payload: {
  commandMode: FormatConvertCommandMode;
  presetId?: string;
  option: FormatConvertOption;
}) => {
  const baseOption = {
    ...DEFAULT_OPTION,
    ...payload.option,
  };

  if (payload.commandMode === FormatConvertCommandMode.PRESET) {
    const preset = findPreset(payload.presetId);
    if (!preset) {
      throw new Error('format-convert-preset-not-found');
    }
    return sanitizePresetOption({
      ...DEFAULT_OPTION,
      ...preset.option,
      ...payload.option,
      outputFormat: payload.option.outputFormat || preset.outputFormat,
    } as FormatConvertOption);
  }

  const extraArgs = tokenizeCustomArgs(baseOption.customArgsText);
  validateCustomArgs(extraArgs);

  return {
    ...baseOption,
    extraArgs,
    customArgsText: extraArgs.join(' '),
  };
};

export const normalizeFormatConvertTaskOption = (
  task: Pick<FormatConvertTaskItem, 'commandMode' | 'presetId' | 'option'>
) => {
  return normalizeFormatConvertOption({
    commandMode: task.commandMode,
    presetId: task.presetId,
    option: task.option,
  });
};

export const buildFormatConvertSummary = (payload: {
  commandMode: FormatConvertCommandMode;
  presetId?: string;
  option: FormatConvertOption;
}): FormatConvertSummary => {
  return {
    commandMode: payload.commandMode,
    presetId: payload.presetId,
    outputFormat: payload.option.outputFormat,
    videoCodec: payload.option.videoCodec,
    audioCodec: payload.option.audioCodec,
    resolution: payload.option.resolution,
    videoBitrateKbps: payload.option.videoBitrateKbps,
    audioBitrateKbps: payload.option.audioBitrateKbps,
    crf: payload.option.crf,
    encodingPreset: payload.option.encodingPreset,
    keepAudio: payload.option.keepAudio,
    customArgsText: payload.option.customArgsText,
  };
};
