import {
  FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS,
  FORMAT_CONVERT_PRESET_DEFINITIONS,
  FormatConvertCommandMode,
  type FormatConvertMediaInfo,
  type FormatConvertOption,
  type FormatConvertSummary,
  type FormatConvertTaskItem,
} from '@volix/types';

const CUSTOM_ARGS_BLOCKLIST = new Set(['-i', '-y', '-n', '-filter_complex_script']);
const PATH_LIKE_REGEXP =
  /(^\/)|(\.\.?\/)|\.(mp4|mkv|mov|webm|mp3|mp2|aac|ac3|eac3|dts|truehd|wav|flac|m4a|opus|wv|txt|json)$/i;
const AUDIO_ONLY_OUTPUT_FORMATS = new Set(FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS);
export const AUDIO_EXTRACT_AUTO_PRESET_ID = 'audio-extract-auto';
const LOSSLESS_WAV_PCM_CODECS = new Set(['pcm_s16le', 'pcm_s24le', 'pcm_s32le', 'pcm_f32le', 'pcm_f64le']);

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

export const isAudioExtractAutoPreset = (presetId?: string) => {
  return String(presetId || '').trim() === AUDIO_EXTRACT_AUTO_PRESET_ID;
};

const sanitizeAudioOnlyOption = (option: FormatConvertOption): FormatConvertOption => {
  if (!AUDIO_ONLY_OUTPUT_FORMATS.has(option.outputFormat)) {
    return option;
  }

  return {
    ...option,
    videoCodec: undefined,
    videoBitrateKbps: undefined,
    crf: undefined,
    encodingPreset: undefined,
    resolution: 'source',
  };
};

const sanitizePresetOption = (option: FormatConvertOption): FormatConvertOption => {
  const nextOption = {
    ...option,
    extraArgs: undefined,
    customArgsText: undefined,
  };

  return sanitizeAudioOnlyOption(nextOption);
};

const resolveAudioExtractAutoPlan = (sourceMediaInfo?: FormatConvertMediaInfo) => {
  const codecName = String(sourceMediaInfo?.audio?.codecName || '')
    .trim()
    .toLowerCase();
  if (codecName === 'aac') {
    return { outputExtension: 'm4a', outputFormat: 'm4a' as const };
  }
  if (codecName === 'mp3') {
    return { outputExtension: 'mp3', outputFormat: 'mp3' as const };
  }
  if (codecName === 'mp2') {
    return { outputExtension: 'mp2', outputFormat: 'mp2' as const };
  }
  if (codecName === 'flac') {
    return { outputExtension: 'flac', outputFormat: 'flac' as const };
  }
  if (codecName === 'ac3') {
    return { outputExtension: 'ac3', outputFormat: 'ac3' as const };
  }
  if (codecName === 'eac3') {
    return { outputExtension: 'eac3', outputFormat: 'eac3' as const };
  }
  if (codecName === 'dts') {
    return { outputExtension: 'dts', outputFormat: 'dts' as const };
  }
  if (codecName === 'truehd') {
    return { outputExtension: 'truehd', outputFormat: 'truehd' as const };
  }
  if (codecName === 'opus') {
    return { outputExtension: 'opus', outputFormat: 'opus' as const };
  }
  if (codecName === 'wavpack') {
    return { outputExtension: 'wv', outputFormat: 'wv' as const };
  }
  if (LOSSLESS_WAV_PCM_CODECS.has(codecName)) {
    return { outputExtension: 'wav', outputFormat: 'wav' as const };
  }
  throw new Error('format-convert-audio-extract-auto-unsupported-codec');
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

  return sanitizeAudioOnlyOption({
    ...baseOption,
    extraArgs,
    customArgsText: extraArgs.join(' '),
  });
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

export interface FormatConvertExecutionPlan {
  option: FormatConvertOption;
  outputExtension: string;
  audioTrackIndex?: number;
}

export const resolveFormatConvertExecutionPlan = (payload: {
  commandMode: FormatConvertCommandMode;
  presetId?: string;
  option: FormatConvertOption;
  sourceMediaInfo?: FormatConvertMediaInfo;
}): FormatConvertExecutionPlan => {
  const option = normalizeFormatConvertOption(payload);
  if (!isAudioExtractAutoPreset(payload.presetId)) {
    return {
      option,
      outputExtension: option.outputFormat,
    };
  }

  const resolved = resolveAudioExtractAutoPlan(payload.sourceMediaInfo);
  return {
    outputExtension: resolved.outputExtension,
    audioTrackIndex: 0,
    option: sanitizeAudioOnlyOption({
      ...option,
      outputFormat: resolved.outputFormat,
      audioCodec: 'copy',
      audioBitrateKbps: undefined,
      keepAudio: true,
    }),
  };
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
