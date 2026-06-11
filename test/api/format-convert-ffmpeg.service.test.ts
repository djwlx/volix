import { describe, expect, it } from 'vitest';
import { appendFfmpegStderrTail } from '../../apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service';

describe('format convert ffmpeg service', () => {
  it('keeps only a bounded stderr tail', () => {
    const tail = appendFfmpegStderrTail('A'.repeat(20_000), 'TAIL-END');

    expect(tail).toContain('TAIL-END');
    expect(tail.length).toBeLessThanOrEqual(16 * 1024);
    expect(tail).toBe(`${'A'.repeat(20_000)}TAIL-END`.slice(-(16 * 1024)));
  });
});
