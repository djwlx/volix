import { describe, expect, it } from 'vitest';
import {
  applyPresetToDraft,
  buildFormatConvertCommandPreview,
  buildAudioCodecOptions,
  buildFormatOptions,
  buildVideoCodecOptions,
  createFormatConvertDraft,
} from './preset-options';

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
});
