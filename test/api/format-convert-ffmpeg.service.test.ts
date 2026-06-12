import { describe, expect, it } from 'vitest';
import {
  appendFfmpegStderrTail,
  buildFormatConvertArgs,
} from '../../apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service';

describe('format convert ffmpeg service', () => {
  it('keeps only a bounded stderr tail', () => {
    const tail = appendFfmpegStderrTail('A'.repeat(20_000), 'TAIL-END');

    expect(tail).toContain('TAIL-END');
    expect(tail.length).toBeLessThanOrEqual(16 * 1024);
    expect(tail).toBe(`${'A'.repeat(20_000)}TAIL-END`.slice(-(16 * 1024)));
  });

  it('forces audio-only outputs to drop video streams and skips video preset flags', () => {
    const args = buildFormatConvertArgs('/input/demo.mov', '/output/demo.flac', {
      outputFormat: 'flac',
      audioCodec: 'flac',
      keepAudio: true,
      encodingPreset: 'medium',
    });

    expect(args).toContain('-c:a');
    expect(args).toContain('flac');
    expect(args).toContain('-vn');
    expect(args).not.toContain('-preset');
  });
});
