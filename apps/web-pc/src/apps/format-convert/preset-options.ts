import {
  FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS,
  FORMAT_CONVERT_OUTPUT_FORMATS,
  FORMAT_CONVERT_AUDIO_CODECS,
  FORMAT_CONVERT_PRESET_DEFINITIONS,
  FORMAT_CONVERT_RESOLUTIONS,
  FORMAT_CONVERT_VIDEO_CODECS,
  FormatConvertCommandMode,
  FormatConvertMode,
  type FormatConvertOption,
  type FormatConvertTaskItem,
} from '@volix/types';

export type FormatConvertSourceMode = 'local' | 'cloud';

export interface FormatConvertFormDraft {
  commandMode: FormatConvertCommandMode;
  presetId: string;
  option: FormatConvertOption;
  targetFileName: string;
}

const AUDIO_ONLY_OUTPUT_FORMATS = new Set(FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS);
const getDefaultPreset = () => FORMAT_CONVERT_PRESET_DEFINITIONS[0];
export const getPresetDefinition = (presetId?: string) =>
  FORMAT_CONVERT_PRESET_DEFINITIONS.find(item => item.id === presetId) || getDefaultPreset();

export const createFormatConvertDraft = (): FormatConvertFormDraft => {
  const preset = getDefaultPreset();
  return {
    commandMode: FormatConvertCommandMode.PRESET,
    presetId: preset.id,
    targetFileName: '',
    option: {
      outputFormat: preset.outputFormat,
      ...preset.option,
    },
  };
};

export const buildPresetOptions = (_mode: FormatConvertMode) => {
  return FORMAT_CONVERT_PRESET_DEFINITIONS.map(item => ({
    labelKey: item.labelKey,
    value: item.id,
  }));
};

export const buildFormatOptions = () => {
  return [...FORMAT_CONVERT_OUTPUT_FORMATS].map(value => ({ label: value.toUpperCase(), value }));
};

export const buildVideoCodecOptions = (targetFormat: string) => {
  if (AUDIO_ONLY_OUTPUT_FORMATS.has(targetFormat)) {
    return [];
  }
  return [...FORMAT_CONVERT_VIDEO_CODECS].map(value => ({ label: value, value }));
};

export const buildAudioCodecOptions = () => {
  return [...FORMAT_CONVERT_AUDIO_CODECS].map(value => ({ label: value, value }));
};

export const buildResolutionOptions = () => {
  return [...FORMAT_CONVERT_RESOLUTIONS].map(value => ({ label: value, value }));
};

export const applyPresetToDraft = (draft: FormatConvertFormDraft, presetId: string): FormatConvertFormDraft => {
  const preset = getPresetDefinition(presetId);
  return {
    ...draft,
    commandMode: FormatConvertCommandMode.PRESET,
    presetId: preset.id,
    option: {
      outputFormat: preset.outputFormat,
      ...preset.option,
    },
  };
};

export const applyCommandModeToDraft = (
  draft: FormatConvertFormDraft,
  commandMode: FormatConvertCommandMode
): FormatConvertFormDraft => {
  if (commandMode === FormatConvertCommandMode.PRESET) {
    return applyPresetToDraft(draft, draft.presetId || getDefaultPreset().id);
  }

  return {
    ...draft,
    commandMode: FormatConvertCommandMode.CUSTOM,
    option: {
      outputFormat: draft.option.outputFormat || getDefaultPreset().outputFormat,
      customArgsText: draft.option.customArgsText || '',
    },
  };
};

export const updateDraftOption = (draft: FormatConvertFormDraft, patch: Partial<FormatConvertOption>) => {
  return {
    ...draft,
    option: {
      ...draft.option,
      ...patch,
    },
  };
};

export const getSuggestedTargetFileName = (sourceName: string, outputFormat: string) => {
  const baseName = String(sourceName || '').replace(/\.[^.]+$/, '') || 'converted';
  return `${baseName}.${outputFormat}`;
};

export const replaceTargetFileExtension = (targetFileName: string, outputFormat: string) => {
  const trimmed = String(targetFileName || '').trim();
  if (!trimmed) {
    return '';
  }
  const baseName = trimmed.replace(/\.[^.]+$/, '') || 'converted';
  return `${baseName}.${outputFormat}`;
};

export const syncDraftOutputFormatFromFilename = (draft: FormatConvertFormDraft, targetFileName: string) => {
  const matched = String(targetFileName || '')
    .toLowerCase()
    .match(/\.([^.]+)$/);
  const extension = matched?.[1] || '';
  if (!FORMAT_CONVERT_OUTPUT_FORMATS.includes(extension as never)) {
    return {
      ...draft,
      targetFileName,
    };
  }

  return {
    ...draft,
    targetFileName,
    option: {
      ...draft.option,
      outputFormat: extension as never,
    },
  };
};

const mapVideoCodec = (videoCodec?: string) => {
  if (videoCodec === 'h264') {
    return 'libx264';
  }
  if (videoCodec === 'h265') {
    return 'libx265';
  }
  return videoCodec || '';
};

const mapAudioCodec = (audioCodec?: string) => {
  if (audioCodec === 'opus') {
    return 'libopus';
  }
  return audioCodec || '';
};

const escapePreviewArg = (value: string) => {
  return `"${String(value || '').replace(/"/g, '\\"')}"`;
};

export const buildFormatConvertCommandPreview = (
  draft: FormatConvertFormDraft,
  sourcePath: string,
  outputPath: string
) => {
  const args = ['ffmpeg', '-y', '-i', escapePreviewArg(sourcePath)];
  const isAudioOnlyOutput = AUDIO_ONLY_OUTPUT_FORMATS.has(draft.option.outputFormat);

  if (draft.commandMode === FormatConvertCommandMode.PRESET) {
    const option = draft.option;

    if (option.videoCodec) {
      args.push('-c:v', mapVideoCodec(option.videoCodec));
    }
    if (option.audioCodec) {
      args.push('-c:a', mapAudioCodec(option.audioCodec));
    }
    if (option.resolution && option.resolution !== 'source') {
      args.push('-vf', `scale=-2:${option.resolution.replace('p', '')}`);
    }
    if (typeof option.crf === 'number') {
      args.push('-crf', String(option.crf));
    }
    if (typeof option.videoBitrateKbps === 'number') {
      args.push('-b:v', `${option.videoBitrateKbps}k`);
    }
    if (typeof option.audioBitrateKbps === 'number') {
      args.push('-b:a', `${option.audioBitrateKbps}k`);
    }
    if (isAudioOnlyOutput) {
      args.push('-vn');
    }
    if (option.encodingPreset && !isAudioOnlyOutput) {
      args.push('-preset', option.encodingPreset);
    }
    if (option.keepAudio === false) {
      args.push('-an');
    }
  } else if (draft.option.customArgsText?.trim()) {
    args.push(...draft.option.customArgsText.trim().split(/\s+/));
  }

  args.push(escapePreviewArg(outputPath));
  return args.join(' ');
};

export const createCloudTaskPayload = (
  sourcePath: string,
  sourceName: string,
  targetDirPath: string,
  draft: FormatConvertFormDraft
) => {
  return {
    mode: FormatConvertMode.CLOUD,
    commandMode: draft.commandMode,
    presetId: draft.commandMode === FormatConvertCommandMode.PRESET ? draft.presetId : undefined,
    source: {
      type: 'openlist' as const,
      path: sourcePath,
      fileName: sourceName,
    },
    target: {
      type: 'openlist' as const,
      dirPath: targetDirPath,
      fileName: draft.targetFileName || getSuggestedTargetFileName(sourceName, draft.option.outputFormat),
    },
    option: draft.option,
  };
};

export const applyTaskToDraft = (task: Pick<FormatConvertTaskItem, 'commandMode' | 'presetId' | 'option'>) => {
  return {
    commandMode: task.commandMode,
    presetId: task.presetId || getDefaultPreset().id,
    targetFileName: '',
    option: task.option,
  };
};
