import { describe, expect, it } from 'vitest';
import {
  FORMAT_CONVERT_RECOVERABLE_STATUSES,
  FORMAT_CONVERT_RUNTIME_ACTIVE_STATUSES,
  FORMAT_CONVERT_TASK_STATUSES,
  FormatConvertCommandMode,
  FormatConvertMode,
} from '@volix/types';
import {
  FORMAT_CONVERT_PRESETS,
  normalizeFormatConvertOption,
} from '../../apps/api/src/modules/format-convert/service/format-convert-option.service';

describe('format convert shared types', () => {
  it('exposes stable shared enums and status groups', () => {
    expect(FormatConvertMode.LOCAL).toBe('local');
    expect(FormatConvertMode.CLOUD).toBe('cloud');
    expect(FormatConvertCommandMode.PRESET).toBe('preset');
    expect(FormatConvertCommandMode.CUSTOM).toBe('custom');
    expect(FORMAT_CONVERT_TASK_STATUSES).toEqual([
      'pending',
      'downloading',
      'download_failed',
      'converting',
      'convert_failed',
      'uploading',
      'upload_failed',
      'completed',
      'canceled',
    ]);
    expect(FORMAT_CONVERT_RUNTIME_ACTIVE_STATUSES).toEqual(['downloading', 'converting', 'uploading']);
    expect(FORMAT_CONVERT_RECOVERABLE_STATUSES).toEqual([
      'downloading',
      'download_failed',
      'converting',
      'convert_failed',
      'uploading',
      'upload_failed',
    ]);
  });
});

describe('format convert option service', () => {
  it('exposes preset definitions suitable for dropdown usage', () => {
    expect(FORMAT_CONVERT_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(FORMAT_CONVERT_PRESETS.map(item => item.id)).toEqual([
      'video-mp4-h264-1080p',
      'video-mp4-h264-720p',
      'video-webm-vp9-720p',
      'audio-mp3-aac-copy',
      'audio-aac-aac-copy',
      'audio-flac-lossless',
    ]);
    expect(FORMAT_CONVERT_PRESETS.every(item => item.commandMode === FormatConvertCommandMode.PRESET)).toBe(true);
    expect(FORMAT_CONVERT_PRESETS.every(item => Boolean(item.labelKey))).toBe(true);
  });

  it('rejects custom args that try to control input, overwrite, or script paths', () => {
    expect(() =>
      normalizeFormatConvertOption({
        commandMode: FormatConvertCommandMode.CUSTOM,
        option: {
          outputFormat: 'mp4',
          customArgsText: '-i injected.mp4',
        },
      })
    ).toThrowError(/format-convert-custom-args-disallowed-option/);

    expect(() =>
      normalizeFormatConvertOption({
        commandMode: FormatConvertCommandMode.CUSTOM,
        option: {
          outputFormat: 'mp4',
          customArgsText: '-y -crf 24',
        },
      })
    ).toThrowError(/format-convert-custom-args-disallowed-option/);

    expect(() =>
      normalizeFormatConvertOption({
        commandMode: FormatConvertCommandMode.CUSTOM,
        option: {
          outputFormat: 'mp4',
          customArgsText: '-filter_complex_script ../../payload.txt',
        },
      })
    ).toThrowError(/format-convert-custom-args-disallowed-option/);
  });

  it('normalizes preset options deterministically', () => {
    const normalized = normalizeFormatConvertOption({
      commandMode: FormatConvertCommandMode.PRESET,
      presetId: 'video-mp4-h264-720p',
      option: {
        outputFormat: 'webm',
        videoCodec: 'h265',
        audioCodec: 'opus',
        resolution: '480p',
        customArgsText: '-crf 28',
        extraArgs: ['-movflags', '+faststart'],
      },
    });

    expect(normalized).toEqual({
      outputFormat: 'webm',
      videoCodec: 'h265',
      audioCodec: 'opus',
      resolution: '480p',
      crf: 23,
      encodingPreset: 'medium',
      keepAudio: true,
    });

    expect(
      normalizeFormatConvertOption({
        commandMode: FormatConvertCommandMode.PRESET,
        presetId: 'video-mp4-h264-720p',
        option: normalized,
      })
    ).toEqual(normalized);
  });

  it('normalizes custom options deterministically', () => {
    const normalized = normalizeFormatConvertOption({
      commandMode: FormatConvertCommandMode.CUSTOM,
      option: {
        outputFormat: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        keepAudio: true,
        customArgsText: '  -crf 24   -movflags +faststart  ',
      },
    });

    expect(normalized).toEqual({
      outputFormat: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: 'source',
      encodingPreset: 'medium',
      keepAudio: true,
      extraArgs: ['-crf', '24', '-movflags', '+faststart'],
      customArgsText: '-crf 24 -movflags +faststart',
    });

    expect(
      normalizeFormatConvertOption({
        commandMode: FormatConvertCommandMode.CUSTOM,
        option: normalized,
      })
    ).toEqual(normalized);
  });

  it('treats flac as an audio-only preset output', () => {
    const normalized = normalizeFormatConvertOption({
      commandMode: FormatConvertCommandMode.PRESET,
      presetId: 'audio-flac-lossless',
      option: {
        outputFormat: 'flac',
        audioCodec: 'flac',
        videoCodec: 'h264',
        resolution: '720p',
      },
    });

    expect(normalized).toEqual({
      outputFormat: 'flac',
      audioCodec: 'flac',
      resolution: 'source',
      keepAudio: true,
    });
  });
});
