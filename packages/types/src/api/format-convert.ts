export enum FormatConvertMode {
  LOCAL = 'local',
  CLOUD = 'cloud',
}

export enum FormatConvertCommandMode {
  PRESET = 'preset',
  CUSTOM = 'custom',
}

export enum FormatConvertTaskStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  DOWNLOAD_FAILED = 'download_failed',
  CONVERTING = 'converting',
  CONVERT_FAILED = 'convert_failed',
  UPLOADING = 'uploading',
  UPLOAD_FAILED = 'upload_failed',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

export enum FormatConvertTaskStage {
  PREPARE = 'prepare',
  DOWNLOAD = 'download',
  CONVERT = 'convert',
  UPLOAD = 'upload',
  FINALIZE = 'finalize',
}

export enum FormatConvertSourceType {
  UPLOAD = 'upload',
  OPENLIST = 'openlist',
}

export enum FormatConvertTargetType {
  DOWNLOAD = 'download',
  OPENLIST = 'openlist',
}

export const FORMAT_CONVERT_TASK_STATUSES = Object.freeze(Object.values(FormatConvertTaskStatus));
export const FORMAT_CONVERT_RUNTIME_ACTIVE_STATUSES = Object.freeze([
  FormatConvertTaskStatus.DOWNLOADING,
  FormatConvertTaskStatus.CONVERTING,
  FormatConvertTaskStatus.UPLOADING,
]);
export const FORMAT_CONVERT_FAILED_STATUSES = Object.freeze([
  FormatConvertTaskStatus.DOWNLOAD_FAILED,
  FormatConvertTaskStatus.CONVERT_FAILED,
  FormatConvertTaskStatus.UPLOAD_FAILED,
]);
export const FORMAT_CONVERT_RECOVERABLE_STATUSES = Object.freeze([
  FormatConvertTaskStatus.DOWNLOADING,
  FormatConvertTaskStatus.DOWNLOAD_FAILED,
  FormatConvertTaskStatus.CONVERTING,
  FormatConvertTaskStatus.CONVERT_FAILED,
  FormatConvertTaskStatus.UPLOADING,
  FormatConvertTaskStatus.UPLOAD_FAILED,
]);
export const FORMAT_CONVERT_TERMINAL_STATUSES = Object.freeze([
  FormatConvertTaskStatus.COMPLETED,
  FormatConvertTaskStatus.CANCELED,
]);

export const FORMAT_CONVERT_STATUS_TRANSITIONS = Object.freeze({
  [FormatConvertTaskStatus.PENDING]: [
    FormatConvertTaskStatus.DOWNLOADING,
    FormatConvertTaskStatus.CONVERTING,
    FormatConvertTaskStatus.CANCELED,
  ],
  [FormatConvertTaskStatus.DOWNLOADING]: [
    FormatConvertTaskStatus.CONVERTING,
    FormatConvertTaskStatus.DOWNLOAD_FAILED,
    FormatConvertTaskStatus.CANCELED,
  ],
  [FormatConvertTaskStatus.DOWNLOAD_FAILED]: [FormatConvertTaskStatus.PENDING, FormatConvertTaskStatus.CANCELED],
  [FormatConvertTaskStatus.CONVERTING]: [
    FormatConvertTaskStatus.UPLOADING,
    FormatConvertTaskStatus.COMPLETED,
    FormatConvertTaskStatus.CONVERT_FAILED,
    FormatConvertTaskStatus.CANCELED,
  ],
  [FormatConvertTaskStatus.CONVERT_FAILED]: [FormatConvertTaskStatus.PENDING, FormatConvertTaskStatus.CANCELED],
  [FormatConvertTaskStatus.UPLOADING]: [
    FormatConvertTaskStatus.COMPLETED,
    FormatConvertTaskStatus.UPLOAD_FAILED,
    FormatConvertTaskStatus.CANCELED,
  ],
  [FormatConvertTaskStatus.UPLOAD_FAILED]: [FormatConvertTaskStatus.PENDING, FormatConvertTaskStatus.CANCELED],
  [FormatConvertTaskStatus.COMPLETED]: [],
  [FormatConvertTaskStatus.CANCELED]: [],
} as const);

export const FORMAT_CONVERT_MODE_STATUS_FLOW = Object.freeze({
  [FormatConvertMode.LOCAL]: [
    FormatConvertTaskStatus.PENDING,
    FormatConvertTaskStatus.CONVERTING,
    FormatConvertTaskStatus.COMPLETED,
  ],
  [FormatConvertMode.CLOUD]: [
    FormatConvertTaskStatus.PENDING,
    FormatConvertTaskStatus.DOWNLOADING,
    FormatConvertTaskStatus.CONVERTING,
    FormatConvertTaskStatus.UPLOADING,
    FormatConvertTaskStatus.COMPLETED,
  ],
} as const);

export const FORMAT_CONVERT_OUTPUT_FORMATS = Object.freeze(['mp4', 'mkv', 'mov', 'webm', 'mp3', 'aac', 'wav', 'flac']);
export const FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS = Object.freeze(['mp3', 'aac', 'wav', 'flac']);
export const FORMAT_CONVERT_VIDEO_CODECS = Object.freeze(['copy', 'h264', 'h265', 'vp9', 'av1']);
export const FORMAT_CONVERT_AUDIO_CODECS = Object.freeze(['copy', 'aac', 'mp3', 'opus', 'pcm_s16le', 'flac']);
export const FORMAT_CONVERT_RESOLUTIONS = Object.freeze(['source', '1080p', '720p', '480p']);
export const FORMAT_CONVERT_ENCODING_PRESETS = Object.freeze(['ultrafast', 'fast', 'medium', 'slow', 'veryslow']);

export type FormatConvertOutputFormat = (typeof FORMAT_CONVERT_OUTPUT_FORMATS)[number];
export type FormatConvertVideoCodec = (typeof FORMAT_CONVERT_VIDEO_CODECS)[number];
export type FormatConvertAudioCodec = (typeof FORMAT_CONVERT_AUDIO_CODECS)[number];
export type FormatConvertResolution = (typeof FORMAT_CONVERT_RESOLUTIONS)[number];
export type FormatConvertEncodingPreset = (typeof FORMAT_CONVERT_ENCODING_PRESETS)[number];

export interface FormatConvertOption {
  outputFormat: FormatConvertOutputFormat;
  videoCodec?: FormatConvertVideoCodec;
  audioCodec?: FormatConvertAudioCodec;
  resolution?: FormatConvertResolution;
  videoBitrateKbps?: number;
  audioBitrateKbps?: number;
  crf?: number;
  encodingPreset?: FormatConvertEncodingPreset;
  keepAudio?: boolean;
  extraArgs?: string[];
  customArgsText?: string;
}

export interface FormatConvertMediaVideoInfo {
  codecName: string;
  width: number;
  height: number;
  frameRate: number;
  bitRateKbps: number;
}

export interface FormatConvertMediaAudioInfo {
  codecName: string;
  sampleRateHz: number;
  channels: number;
  channelLayout: string;
  bitRateKbps: number;
}

export interface FormatConvertMediaInfo {
  formatName: string;
  durationSeconds: number;
  sizeBytes: number;
  bitRateKbps: number;
  hasVideo: boolean;
  hasAudio: boolean;
  video?: FormatConvertMediaVideoInfo;
  audio?: FormatConvertMediaAudioInfo;
}

export interface FormatConvertSummary {
  commandMode: FormatConvertCommandMode;
  presetId?: string;
  outputFormat: FormatConvertOutputFormat;
  videoCodec?: FormatConvertVideoCodec;
  audioCodec?: FormatConvertAudioCodec;
  resolution?: FormatConvertResolution;
  videoBitrateKbps?: number;
  audioBitrateKbps?: number;
  crf?: number;
  encodingPreset?: FormatConvertEncodingPreset;
  keepAudio?: boolean;
  customArgsText?: string;
}

export interface FormatConvertPreset {
  id: string;
  mode: FormatConvertMode;
  commandMode: FormatConvertCommandMode.PRESET;
  outputFormat: FormatConvertOutputFormat;
  option: Partial<FormatConvertOption>;
  labelKey: string;
  descriptionKey?: string;
}

export const FORMAT_CONVERT_PRESET_DEFINITIONS: FormatConvertPreset[] = [
  {
    id: 'video-mp4-h264-1080p',
    mode: FormatConvertMode.LOCAL,
    commandMode: FormatConvertCommandMode.PRESET,
    outputFormat: 'mp4',
    option: { videoCodec: 'h264', audioCodec: 'aac', resolution: '1080p', crf: 23, encodingPreset: 'medium' },
    labelKey: 'formatConvert.preset.videoMp4H2641080p',
  },
  {
    id: 'video-mp4-h264-720p',
    mode: FormatConvertMode.LOCAL,
    commandMode: FormatConvertCommandMode.PRESET,
    outputFormat: 'mp4',
    option: { videoCodec: 'h264', audioCodec: 'aac', resolution: '720p', crf: 23, encodingPreset: 'medium' },
    labelKey: 'formatConvert.preset.videoMp4H264720p',
  },
  {
    id: 'video-webm-vp9-720p',
    mode: FormatConvertMode.LOCAL,
    commandMode: FormatConvertCommandMode.PRESET,
    outputFormat: 'webm',
    option: { videoCodec: 'vp9', audioCodec: 'opus', resolution: '720p', crf: 30, encodingPreset: 'medium' },
    labelKey: 'formatConvert.preset.videoWebmVp9720p',
  },
  {
    id: 'audio-mp3-aac-copy',
    mode: FormatConvertMode.LOCAL,
    commandMode: FormatConvertCommandMode.PRESET,
    outputFormat: 'mp3',
    option: { audioCodec: 'mp3', keepAudio: true },
    labelKey: 'formatConvert.preset.audioMp3AacCopy',
  },
  {
    id: 'audio-aac-aac-copy',
    mode: FormatConvertMode.LOCAL,
    commandMode: FormatConvertCommandMode.PRESET,
    outputFormat: 'aac',
    option: { audioCodec: 'aac', keepAudio: true },
    labelKey: 'formatConvert.preset.audioAacAacCopy',
  },
  {
    id: 'audio-flac-lossless',
    mode: FormatConvertMode.LOCAL,
    commandMode: FormatConvertCommandMode.PRESET,
    outputFormat: 'flac',
    option: { audioCodec: 'flac', keepAudio: true },
    labelKey: 'formatConvert.preset.audioFlacLossless',
  },
];

export interface FormatConvertUploadSource {
  type: FormatConvertSourceType.UPLOAD;
  fileName: string;
  mimeType?: string;
  size?: number;
  uploadPath?: string;
}

export interface FormatConvertOpenlistSource {
  type: FormatConvertSourceType.OPENLIST;
  path: string;
  fileName: string;
  size?: number;
  storageMountPath?: string;
  rawUrl?: string;
}

export type FormatConvertSource = FormatConvertUploadSource | FormatConvertOpenlistSource;

export interface FormatConvertDownloadTarget {
  type: FormatConvertTargetType.DOWNLOAD;
  fileName?: string;
}

export interface FormatConvertOpenlistTarget {
  type: FormatConvertTargetType.OPENLIST;
  dirPath: string;
  fileName?: string;
  conflictPolicy?: 'rename' | 'overwrite';
}

export type FormatConvertTarget = FormatConvertDownloadTarget | FormatConvertOpenlistTarget;

export interface CreateFormatConvertTaskRequest {
  mode: FormatConvertMode;
  commandMode: FormatConvertCommandMode;
  source: FormatConvertSource;
  target: FormatConvertTarget;
  option: FormatConvertOption;
  presetId?: string;
}

export interface FormatConvertTaskItem {
  id: number;
  userId: string | number;
  mode: FormatConvertMode;
  commandMode: FormatConvertCommandMode;
  status: FormatConvertTaskStatus;
  source: FormatConvertSource;
  target: FormatConvertTarget;
  option: FormatConvertOption;
  sourceMediaInfo?: FormatConvertMediaInfo;
  convertSummary?: FormatConvertSummary;
  resultMediaInfo?: FormatConvertMediaInfo;
  presetId?: string;
  attemptCount: number;
  lastStage?: FormatConvertTaskStage;
  workspaceDir?: string;
  sourceLocalPath?: string;
  outputLocalPath?: string;
  logLocalPath?: string;
  resultLocalPath?: string;
  resultOpenlistPath?: string;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormatConvertTaskResult {
  task: FormatConvertTaskItem;
}

export interface GetFormatConvertPresetsResult {
  items: FormatConvertPreset[];
}

export interface GetFormatConvertTaskListResult {
  items: FormatConvertTaskItem[];
}

export interface FormatConvertOpenlistBrowserItem {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified?: string;
}

export interface FormatConvertOpenlistBrowserResult {
  path: string;
  content: FormatConvertOpenlistBrowserItem[];
  total?: number;
}
