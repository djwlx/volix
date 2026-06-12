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
  type FormatConvertPreset,
  type FormatConvertTaskItem,
} from '@volix/types';

export type FormatConvertSourceMode = 'local' | 'cloud';

const VIDEO_CODEC_DISPLAY: Record<string, string> = {
  h264: 'H.264',
  h265: 'H.265',
  vp9: 'VP9',
  av1: 'AV1',
};

const RESOLUTION_DISPLAY: Record<string, string> = {
  '2160p': '4k',
  '1440p': '2k',
};

export const getVideoCodecDisplay = (value?: string) => VIDEO_CODEC_DISPLAY[String(value || '')] || String(value || '');

export const getResolutionDisplay = (value?: string) => RESOLUTION_DISPLAY[String(value || '')] || String(value || '');

export const buildPresetLabel = (preset: FormatConvertPreset, t: (key: string) => string) => {
  const isAudioOnly = AUDIO_ONLY_OUTPUT_FORMATS.has(preset.outputFormat);
  const typeLabel = t(isAudioOnly ? 'formatConvert.preset.typeAudio' : 'formatConvert.preset.typeVideo');
  const { videoCodec, resolution, audioCodec } = preset.option;
  const tokens: string[] = [preset.outputFormat];

  if (!isAudioOnly && videoCodec && videoCodec !== 'copy') {
    tokens.push(getVideoCodecDisplay(videoCodec));
  }
  if (!isAudioOnly && resolution && resolution !== 'source') {
    tokens.push(getResolutionDisplay(resolution));
  }
  if (audioCodec && audioCodec !== 'copy' && audioCodec.toLowerCase() !== preset.outputFormat.toLowerCase()) {
    tokens.push(audioCodec);
  }

  return `${typeLabel}_${tokens.join('_')}`;
};

export const getPresetLabel = (presetId: string | undefined, t: (key: string) => string) => {
  const preset = FORMAT_CONVERT_PRESET_DEFINITIONS.find(item => item.id === presetId);
  return preset ? buildPresetLabel(preset, t) : presetId || '';
};

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

export const buildPresetOptions = (_mode: FormatConvertMode, t: (key: string) => string) => {
  return FORMAT_CONVERT_PRESET_DEFINITIONS.map(item => ({
    label: buildPresetLabel(item, t),
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
  return [...FORMAT_CONVERT_RESOLUTIONS].map(value => ({ label: getResolutionDisplay(value), value }));
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

const trimBatchToken = (value?: string) =>
  String(value || '')
    .trim()
    .replace(/^_+|_+$/g, '');

const buildBatchTargetTokens = (draft: FormatConvertFormDraft) => {
  const option = draft.option;
  const rawTokens = [
    option.outputFormat,
    option.resolution && option.resolution !== 'source' ? option.resolution : '',
    option.audioCodec && option.audioCodec !== 'copy' ? option.audioCodec : '',
  ];

  return rawTokens.reduce<string[]>((tokens, token) => {
    const normalized = trimBatchToken(token);
    if (!normalized || tokens.includes(normalized)) {
      return tokens;
    }
    tokens.push(normalized);
    return tokens;
  }, []);
};

export const buildFormatConvertTargetFileName = (
  sourceName: string,
  draft: FormatConvertFormDraft,
  batchMode = false
) => {
  if (!batchMode) {
    return draft.targetFileName || getSuggestedTargetFileName(sourceName, draft.option.outputFormat);
  }

  const baseName = String(sourceName || '').replace(/\.[^.]+$/, '') || 'converted';
  const suffix = buildBatchTargetTokens(draft).join('_');
  return `${baseName}_${suffix}.${draft.option.outputFormat}`;
};

export const isBatchTargetFileNameLocked = (selectedFileCount: number) => selectedFileCount > 1;

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
      fileName: buildFormatConvertTargetFileName(sourceName, draft),
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
