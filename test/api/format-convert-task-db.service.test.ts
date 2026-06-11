import { describe, expect, it } from 'vitest';

describe('format convert task db service', () => {
  it('maps persisted media metadata into public task records', async () => {
    const { mapFormatConvertTaskRow } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-task-db.service'
    );

    const task = mapFormatConvertTaskRow({
      id: 7,
      user_id: 'u1',
      mode: 'local',
      command_mode: 'preset',
      status: 'completed',
      source_json: JSON.stringify({
        type: 'upload',
        fileName: 'demo.mov',
      }),
      target_json: JSON.stringify({
        type: 'download',
        fileName: 'demo.flac',
      }),
      option_json: JSON.stringify({
        outputFormat: 'flac',
      }),
      convert_summary_json: JSON.stringify({
        commandMode: 'preset',
        presetId: 'audio-flac-lossless',
        outputFormat: 'flac',
        audioCodec: 'flac',
      }),
      source_media_info_json: JSON.stringify({
        formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
        durationSeconds: 12,
        sizeBytes: 1024,
        bitRateKbps: 256,
        hasVideo: true,
        hasAudio: true,
      }),
      result_media_info_json: JSON.stringify({
        formatName: 'flac',
        durationSeconds: 12,
        sizeBytes: 2048,
        bitRateKbps: 1024,
        hasVideo: false,
        hasAudio: true,
      }),
      attempt_count: 1,
    } as never);

    expect(task.convertSummary).toMatchObject({
      presetId: 'audio-flac-lossless',
      outputFormat: 'flac',
      audioCodec: 'flac',
    });
    expect(task.sourceMediaInfo).toMatchObject({
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      durationSeconds: 12,
      hasVideo: true,
    });
    expect(task.resultMediaInfo).toMatchObject({
      formatName: 'flac',
      durationSeconds: 12,
      hasVideo: false,
    });
  });
});
