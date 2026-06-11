import { describe, expect, it } from 'vitest';
import {
  applyPresetToDraft,
  buildFormatConvertCommandPreview,
  buildVideoCodecOptions,
  createFormatConvertDraft,
} from './preset-options';

describe('format convert preset options', () => {
  it('hides video codecs for audio-only output formats', () => {
    expect(buildVideoCodecOptions('mp3').map(item => item.value)).not.toContain('copy');
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

  it('builds a readable ffmpeg preview for preset mode', () => {
    const draft = applyPresetToDraft(createFormatConvertDraft(), 'video-mp4-h264-720p');
    const preview = buildFormatConvertCommandPreview(draft, '/input/demo.mov', '/output/demo.mp4');

    expect(preview).toContain('ffmpeg -y -i');
    expect(preview).toContain('-c:v libx264');
    expect(preview).toContain('-vf scale=-2:720');
    expect(preview).toContain('"/output/demo.mp4"');
  });
});
