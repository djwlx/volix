import { describe, expect, it } from 'vitest';
import type { FormatConvertMediaInfo } from '@volix/types';

const createSourceMediaInfo = (codecName: string): FormatConvertMediaInfo => ({
  formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
  durationSeconds: 12,
  sizeBytes: 2048,
  bitRateKbps: 256,
  hasVideo: true,
  hasAudio: true,
  audio: {
    codecName,
    sampleRateHz: 48000,
    channels: 2,
    channelLayout: 'stereo',
    bitRateKbps: 192,
  },
});

describe('format convert audio extract auto', () => {
  it('resolves copy-based extraction for supported codecs', async () => {
    const { resolveFormatConvertExecutionPlan } = await import('../format-convert-option.service.js');

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('aac'),
      })
    ).toMatchObject({
      outputExtension: 'm4a',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'm4a',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('mp3'),
      })
    ).toMatchObject({
      outputExtension: 'mp3',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'mp3',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('flac'),
      })
    ).toMatchObject({
      outputExtension: 'flac',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'flac',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('opus'),
      })
    ).toMatchObject({
      outputExtension: 'opus',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'opus',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('pcm_s16le'),
      })
    ).toMatchObject({
      outputExtension: 'wav',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'wav',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('pcm_s24le'),
      })
    ).toMatchObject({
      outputExtension: 'wav',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'wav',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('pcm_f32le'),
      })
    ).toMatchObject({
      outputExtension: 'wav',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'wav',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('ac3'),
      })
    ).toMatchObject({
      outputExtension: 'ac3',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'ac3',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('eac3'),
      })
    ).toMatchObject({
      outputExtension: 'eac3',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'eac3',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('dts'),
      })
    ).toMatchObject({
      outputExtension: 'dts',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'dts',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('truehd'),
      })
    ).toMatchObject({
      outputExtension: 'truehd',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'truehd',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('mp2'),
      })
    ).toMatchObject({
      outputExtension: 'mp2',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'mp2',
        audioCodec: 'copy',
      },
    });

    expect(
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('wavpack'),
      })
    ).toMatchObject({
      outputExtension: 'wv',
      audioTrackIndex: 0,
      option: {
        outputFormat: 'wv',
        audioCodec: 'copy',
      },
    });
  });

  it('rejects unsupported codecs so extraction stays lossless only', async () => {
    const { resolveFormatConvertExecutionPlan } = await import('../format-convert-option.service.js');

    expect(() =>
      resolveFormatConvertExecutionPlan({
        commandMode: 'preset',
        presetId: 'audio-extract-auto',
        option: { outputFormat: 'm4a' },
        sourceMediaInfo: createSourceMediaInfo('vorbis'),
      })
    ).toThrow('format-convert-audio-extract-auto-unsupported-codec');
  });

  it('maps only the first audio track when extracting audio', async () => {
    const { buildFormatConvertArgs } = await import('../format-convert-ffmpeg.service.js');

    expect(
      buildFormatConvertArgs(
        '/input/demo.mov',
        '/output/demo.mp3',
        { outputFormat: 'mp3', audioCodec: 'copy' },
        {
          audioTrackIndex: 0,
        }
      )
    ).toEqual(['-y', '-i', '/input/demo.mov', '-map', '0:a:0', '-c:a', 'copy', '-vn', '/output/demo.mp3']);
  });
});
