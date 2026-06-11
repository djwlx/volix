import { describe, expect, it } from 'vitest';

describe('format convert runtime service', () => {
  it('parses ffprobe output into a minimal media summary', async () => {
    const { parseProbeResult } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service'
    );

    expect(
      parseProbeResult({
        streams: [
          { codec_type: 'video', codec_name: 'h264', width: 1280, height: 720 },
          { codec_type: 'audio', codec_name: 'aac' },
        ],
        format: { duration: '8.0', size: '42', format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
      })
    ).toMatchObject({
      hasVideo: true,
      hasAudio: true,
      width: 1280,
      height: 720,
      videoCodec: 'h264',
      audioCodec: 'aac',
      durationSeconds: 8,
      sizeBytes: 42,
    });
  });

  it('builds stable workspace and result paths', async () => {
    const {
      getFormatConvertWorkspaceDir,
      getFormatConvertWorkspaceFilePath,
      getFormatConvertResultDir,
      getFormatConvertResultPath,
    } = await import('../../apps/api/src/modules/format-convert/service/format-convert-workspace.service');

    expect(getFormatConvertWorkspaceDir(12)).toContain('/data/cache/media/format-convert/12');
    expect(getFormatConvertWorkspaceFilePath(12, 'output.mp4')).toContain(
      '/data/cache/media/format-convert/12/output.mp4'
    );
    expect(getFormatConvertResultDir(12)).toContain('/data/upload/format-convert/12');
    expect(getFormatConvertResultPath(12, 'done.mp4')).toContain('/data/upload/format-convert/12/done.mp4');
  });
});
