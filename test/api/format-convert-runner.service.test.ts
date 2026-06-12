import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FormatConvertCommandMode,
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
} from '@volix/types';

const mocked = vi.hoisted(() => ({
  option: {
    buildFormatConvertSummary: vi.fn(),
    normalizeFormatConvertTaskOption: vi.fn(),
  },
  workspace: {
    ensureFormatConvertWorkspace: vi.fn(),
    cleanupFormatConvertWorkspace: vi.fn(),
    getFormatConvertLogPath: vi.fn(),
    getFormatConvertWorkspaceDir: vi.fn(),
    getFormatConvertWorkspaceFilePath: vi.fn(),
    persistFormatConvertResult: vi.fn(),
  },
  ffmpeg: {
    buildFormatConvertArgs: vi.fn(),
    probeMediaFile: vi.fn(),
    runFfmpegCommand: vi.fn(),
  },
  openlist: {
    downloadFormatConvertOpenlistSource: vi.fn(),
    uploadFormatConvertResultToOpenlist: vi.fn(),
  },
  taskDb: {
    updateFormatConvertTask: vi.fn(),
    updateFormatConvertTaskStatus: vi.fn(),
  },
}));

vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-option.service', () => mocked.option);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-workspace.service', () => mocked.workspace);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service', () => mocked.ffmpeg);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-openlist.service', () => mocked.openlist);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-task-db.service', () => mocked.taskDb);

describe('format convert runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.option.normalizeFormatConvertTaskOption.mockReturnValue({
      outputFormat: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: 'source',
      encodingPreset: 'medium',
      keepAudio: true,
    });
    mocked.option.buildFormatConvertSummary.mockReturnValue({
      commandMode: 'preset',
      outputFormat: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: 'source',
      encodingPreset: 'medium',
      keepAudio: true,
    });
    mocked.workspace.ensureFormatConvertWorkspace.mockResolvedValue('/tmp/task-1');
    mocked.workspace.getFormatConvertLogPath.mockImplementation((id: number) => `/tmp/task-${id}/ffmpeg.log`);
    mocked.workspace.getFormatConvertWorkspaceDir.mockImplementation((id: number) => `/tmp/task-${id}`);
    mocked.workspace.getFormatConvertWorkspaceFilePath.mockImplementation(
      (_id: number, filename: string) => `/tmp/task-1/${filename}`
    );
    mocked.workspace.persistFormatConvertResult.mockResolvedValue('/tmp/result/done.mp4');
    mocked.ffmpeg.buildFormatConvertArgs.mockReturnValue(['-y']);
    mocked.ffmpeg.probeMediaFile.mockResolvedValue({
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      durationSeconds: 12,
      sizeBytes: 1024,
      bitRateKbps: 256,
      hasVideo: true,
      hasAudio: true,
      video: {
        codecName: 'h264',
        width: 1280,
        height: 720,
        frameRate: 30,
        bitRateKbps: 1800,
      },
      audio: {
        codecName: 'aac',
        sampleRateHz: 48000,
        channels: 2,
        channelLayout: 'stereo',
        bitRateKbps: 192,
      },
    });
    mocked.ffmpeg.runFfmpegCommand.mockResolvedValue(undefined);
    mocked.openlist.downloadFormatConvertOpenlistSource.mockResolvedValue(undefined);
    mocked.openlist.uploadFormatConvertResultToOpenlist.mockResolvedValue('/alist/done.mp4');
    mocked.taskDb.updateFormatConvertTask.mockResolvedValue(undefined);
    mocked.taskDb.updateFormatConvertTaskStatus.mockResolvedValue(undefined);
  });

  it('runs a local task through converting and persists a downloadable result', async () => {
    const { runFormatConvertTask } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-runner.service'
    );

    const updates: string[] = [];
    await runFormatConvertTask(
      {
        id: 1,
        userId: 'u1',
        mode: FormatConvertMode.LOCAL,
        commandMode: FormatConvertCommandMode.PRESET,
        status: 'pending',
        source: { type: FormatConvertSourceType.UPLOAD, fileName: 'demo.mov', uploadPath: '/upload/demo.mov' },
        target: { type: FormatConvertTargetType.DOWNLOAD, fileName: 'done.mp4' },
        option: { outputFormat: 'mp4' },
        attemptCount: 0,
      } as never,
      {
        onStatusChange: status => updates.push(status),
      }
    );

    expect(updates).toEqual(['converting', 'completed']);
    expect(mocked.ffmpeg.runFfmpegCommand).toHaveBeenCalledWith(['-y'], {
      logPath: '/tmp/task-1/ffmpeg.log',
    });
    expect(mocked.ffmpeg.probeMediaFile).toHaveBeenCalledWith('/tmp/task-1/output.mp4');
    expect(mocked.workspace.persistFormatConvertResult).toHaveBeenCalledWith(1, '/tmp/task-1/output.mp4', 'done.mp4');
    expect(mocked.taskDb.updateFormatConvertTaskStatus).toHaveBeenCalledWith(
      1,
      'completed',
      expect.objectContaining({
        result_media_info_json: expect.any(String),
        finished_at: expect.any(Date),
      })
    );
  });

  it('runs a cloud task through downloading converting uploading and preserves local artifacts', async () => {
    const { runFormatConvertTask } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-runner.service'
    );

    const updates: string[] = [];
    await runFormatConvertTask(
      {
        id: 2,
        userId: 'u2',
        mode: FormatConvertMode.CLOUD,
        commandMode: FormatConvertCommandMode.PRESET,
        status: 'pending',
        requestUserAgent: 'Mozilla/5.0 Task UA',
        source: { type: FormatConvertSourceType.OPENLIST, fileName: 'demo.mkv', path: '/movie/demo.mkv' },
        target: { type: FormatConvertTargetType.OPENLIST, dirPath: '/target', fileName: 'done.mp4' },
        option: { outputFormat: 'mp4' },
        attemptCount: 0,
      } as never,
      {
        onStatusChange: status => updates.push(status),
      }
    );

    expect(updates).toEqual(['downloading', 'converting', 'uploading', 'completed']);
    expect(mocked.openlist.downloadFormatConvertOpenlistSource).toHaveBeenCalledWith(
      'u2',
      expect.anything(),
      '/tmp/task-1/source.mkv',
      'Mozilla/5.0 Task UA'
    );
    expect(mocked.ffmpeg.probeMediaFile).toHaveBeenNthCalledWith(1, '/tmp/task-1/source.mkv');
    expect(mocked.ffmpeg.probeMediaFile).toHaveBeenNthCalledWith(2, '/tmp/task-1/output.mp4');
    expect(mocked.openlist.uploadFormatConvertResultToOpenlist).toHaveBeenCalledWith(
      'u2',
      expect.anything(),
      '/tmp/task-1/output.mp4'
    );
    expect(mocked.workspace.cleanupFormatConvertWorkspace).not.toHaveBeenCalled();
    expect(mocked.taskDb.updateFormatConvertTaskStatus).toHaveBeenCalledWith(
      2,
      'downloading',
      expect.objectContaining({
        source_local_path: '/tmp/task-1/source.mkv',
      })
    );
    expect(mocked.taskDb.updateFormatConvertTaskStatus).toHaveBeenCalledWith(
      2,
      'converting',
      expect.objectContaining({
        source_media_info_json: expect.any(String),
      })
    );
    expect(mocked.taskDb.updateFormatConvertTaskStatus).toHaveBeenCalledWith(
      2,
      'completed',
      expect.objectContaining({
        result_media_info_json: expect.any(String),
      })
    );
  });

  it('fails early with a clear message when audio-only output is requested from a silent source', async () => {
    mocked.option.normalizeFormatConvertTaskOption.mockReturnValue({
      outputFormat: 'flac',
      audioCodec: 'flac',
      resolution: 'source',
      keepAudio: true,
    });
    mocked.option.buildFormatConvertSummary.mockReturnValue({
      commandMode: 'preset',
      outputFormat: 'flac',
      audioCodec: 'flac',
      resolution: 'source',
      keepAudio: true,
    });

    const { runFormatConvertTask } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-runner.service'
    );

    await expect(
      runFormatConvertTask({
        id: 5,
        userId: 'u3',
        mode: FormatConvertMode.LOCAL,
        commandMode: FormatConvertCommandMode.PRESET,
        status: 'pending',
        source: { type: FormatConvertSourceType.UPLOAD, fileName: 'silent.mov', uploadPath: '/upload/silent.mov' },
        target: { type: FormatConvertTargetType.DOWNLOAD, fileName: 'silent.flac' },
        option: { outputFormat: 'flac' },
        sourceMediaInfo: {
          formatName: 'mov',
          durationSeconds: 3,
          sizeBytes: 1024,
          bitRateKbps: 512,
          hasVideo: true,
          hasAudio: false,
          video: {
            codecName: 'h264',
            width: 1280,
            height: 720,
            frameRate: 30,
            bitRateKbps: 512,
          },
        },
        attemptCount: 0,
      } as never)
    ).rejects.toThrow('源文件没有音频流，无法转换为音频文件');

    expect(mocked.ffmpeg.runFfmpegCommand).not.toHaveBeenCalled();
  });
});
