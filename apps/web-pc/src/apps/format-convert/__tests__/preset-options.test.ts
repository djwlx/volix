import { describe, expect, it } from 'vitest';
import {
  applyPresetToDraft,
  buildFormatConvertCommandPreview,
  buildFormatConvertTargetFileName,
  buildAudioCodecOptions,
  buildFormatOptions,
  buildPresetLabel,
  buildResolutionOptions,
  buildVideoCodecOptions,
  createFormatConvertDraft,
  getPresetLabel,
  isBatchTargetFileNameLocked,
} from '../preset-options';
import { FORMAT_CONVERT_PRESET_DEFINITIONS } from '@volix/types';

const identityT = (key: string) => key.split('.').pop() || key;
const labelT = (key: string) => {
  if (key === 'formatConvert.preset.typeVideo') {
    return '视频';
  }
  if (key === 'formatConvert.preset.typeAudio') {
    return '音频';
  }
  return key;
};

describe('format convert preset options', () => {
  it('hides video codecs for audio-only output formats', () => {
    expect(buildVideoCodecOptions('mp3').map(item => item.value)).not.toContain('copy');
    expect(buildVideoCodecOptions('flac')).toEqual([]);
    expect(buildVideoCodecOptions('mp4').map(item => item.value)).toContain('h264');
  });

  it('applies preset defaults deterministically', () => {
    const draft = createFormatConvertDraft();
    const next = applyPresetToDraft(draft, 'video-mp4-h264-720p');

    expect(next.presetId).toBe('video-mp4-h264-720p');
    expect(next.option.outputFormat).toBe('mp4');
    expect(next.option.videoCodec).toBe('h264');
    expect(next.option.resolution).toBe('720p');
  });

  it('includes flac in format and audio codec options and applies the lossless preset', () => {
    expect(buildFormatOptions().map(item => item.value)).toContain('flac');
    expect(buildAudioCodecOptions().map(item => item.value)).toContain('flac');

    const draft = applyPresetToDraft(createFormatConvertDraft(), 'audio-flac-lossless');

    expect(draft.presetId).toBe('audio-flac-lossless');
    expect(draft.option.outputFormat).toBe('flac');
    expect(draft.option.audioCodec).toBe('flac');
    expect(draft.option.videoCodec).toBeUndefined();
  });

  it('builds a readable ffmpeg preview for preset mode', () => {
    const draft = applyPresetToDraft(createFormatConvertDraft(), 'video-mp4-h264-720p');
    const preview = buildFormatConvertCommandPreview(draft, '/input/demo.mov', '/output/demo.mp4');

    expect(preview).toContain('ffmpeg -y -i');
    expect(preview).toContain('-c:v libx264');
    expect(preview).toContain('-vf scale=-2:720');
    expect(preview).toContain('"/output/demo.mp4"');
  });

  it('adds -vn and avoids video-only preset flags for audio-only flac output', () => {
    const draft = applyPresetToDraft(createFormatConvertDraft(), 'audio-flac-lossless');
    const preview = buildFormatConvertCommandPreview(draft, '/input/demo.mov', '/output/demo.flac');

    expect(preview).toContain('-c:a flac');
    expect(preview).toContain('-vn');
    expect(preview).not.toContain('-preset medium');
  });

  it('builds deterministic batch target names with formatted suffixes', () => {
    const draft = applyPresetToDraft(createFormatConvertDraft(), 'video-mp4-h264-1080p');

    expect(buildFormatConvertTargetFileName('movie.mov', draft, true)).toBe('movie_mp4_1080p_aac.mp4');
    expect(buildFormatConvertTargetFileName('clip.final.mkv', draft, true)).toBe('clip.final_mp4_1080p_aac.mp4');
  });

  it('deduplicates redundant audio suffix parts for audio-only output', () => {
    const draft = applyPresetToDraft(createFormatConvertDraft(), 'audio-flac-lossless');

    expect(buildFormatConvertTargetFileName('concert.wav', draft, true)).toBe('concert_flac.flac');
  });

  it('locks custom target filename editing only in multi-file mode', () => {
    expect(isBatchTargetFileNameLocked(0)).toBe(false);
    expect(isBatchTargetFileNameLocked(1)).toBe(false);
    expect(isBatchTargetFileNameLocked(2)).toBe(true);
  });

  it('exposes 4k and 2k resolution options with friendly labels', () => {
    const options = buildResolutionOptions();
    const map = new Map(options.map(item => [item.value, item.label]));

    expect(map.get('2160p')).toBe('4k');
    expect(map.get('1440p')).toBe('2k');
    expect(map.get('1080p')).toBe('1080p');
  });

  it('builds a clear, parameter-driven preset label for video presets', () => {
    const preset = FORMAT_CONVERT_PRESET_DEFINITIONS.find(item => item.id === 'video-mp4-h264-2160p')!;

    expect(buildPresetLabel(preset, labelT)).toBe('视频_mp4_H.264_4k_aac');
  });

  it('deduplicates the audio codec token when it matches the output format', () => {
    const flac = FORMAT_CONVERT_PRESET_DEFINITIONS.find(item => item.id === 'audio-flac-lossless')!;
    const mp3 = FORMAT_CONVERT_PRESET_DEFINITIONS.find(item => item.id === 'audio-mp3-aac-copy')!;

    expect(buildPresetLabel(flac, labelT)).toBe('音频_flac');
    expect(buildPresetLabel(mp3, labelT)).toBe('音频_mp3');
  });

  it('resolves a preset label by id and falls back to the raw id', () => {
    expect(getPresetLabel('video-mp4-h264-2160p', labelT)).toBe('视频_mp4_H.264_4k_aac');
    expect(getPresetLabel('custom-unknown', identityT)).toBe('custom-unknown');
  });
});
