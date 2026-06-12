import { describe, expect, it } from 'vitest';
import {
  appendFfmpegStderrTail,
  buildFormatConvertArgs,
  normalizeFormatName,
  parseProbeResult,
} from '../../apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service';

describe('format convert ffmpeg service', () => {
  it('normalizes the demuxer format list to a single accurate container', () => {
    expect(normalizeFormatName('mov,mp4,m4a,3gp,3g2,mj2', '.mp4')).toBe('mp4');
    expect(normalizeFormatName('matroska,webm', '.mkv')).toBe('matroska');
    expect(normalizeFormatName('matroska,webm', '.webm')).toBe('webm');
    expect(normalizeFormatName('flac', '.flac')).toBe('flac');
    expect(normalizeFormatName('mov,mp4,m4a,3gp,3g2,mj2')).toBe('mov');
  });

  it('uses the file extension hint when parsing the probe format name', () => {
    const info = parseProbeResult({ streams: [], format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' } }, '.mp4');

    expect(info.formatName).toBe('mp4');
  });

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
