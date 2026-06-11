import { describe, expect, it } from 'vitest';

describe('format convert runtime service', () => {
  it('parses ffprobe output into a minimal media summary', async () => {
    const { parseProbeResult } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service'
    );

    expect(
      parseProbeResult({
        streams: [
          {
            codec_type: 'video',
            codec_name: 'h264',
            width: 1280,
            height: 720,
            avg_frame_rate: '30000/1001',
            bit_rate: '2000000',
          },
          {
            codec_type: 'audio',
            codec_name: 'aac',
            sample_rate: '48000',
            channels: 2,
            channel_layout: 'stereo',
            bit_rate: '192000',
          },
        ],
        format: {
          duration: '8.0',
          size: '42',
          format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
          bit_rate: '2192000',
        },
      })
    ).toMatchObject({
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      hasVideo: true,
      hasAudio: true,
      durationSeconds: 8,
      sizeBytes: 42,
      bitRateKbps: 2192,
      video: {
        codecName: 'h264',
        width: 1280,
        height: 720,
        frameRate: 29.97,
        bitRateKbps: 2000,
      },
      audio: {
        codecName: 'aac',
        sampleRateHz: 48000,
        channels: 2,
        channelLayout: 'stereo',
        bitRateKbps: 192,
      },
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
