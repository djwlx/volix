import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FormatConvertCommandMode,
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
} from '@volix/types';

const mocked = vi.hoisted(() => ({
  option: {
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
    mocked.workspace.ensureFormatConvertWorkspace.mockResolvedValue('/tmp/task-1');
    mocked.workspace.getFormatConvertLogPath.mockImplementation((id: number) => `/tmp/task-${id}/ffmpeg.log`);
    mocked.workspace.getFormatConvertWorkspaceDir.mockImplementation((id: number) => `/tmp/task-${id}`);
    mocked.workspace.getFormatConvertWorkspaceFilePath.mockImplementation(
      (_id: number, filename: string) => `/tmp/task-1/${filename}`
    );
    mocked.workspace.persistFormatConvertResult.mockResolvedValue('/tmp/result/done.mp4');
    mocked.ffmpeg.buildFormatConvertArgs.mockReturnValue(['-y']);
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
    expect(mocked.workspace.persistFormatConvertResult).toHaveBeenCalledWith(1, '/tmp/task-1/output.mp4', 'done.mp4');
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
    expect(mocked.openlist.downloadFormatConvertOpenlistSource).toHaveBeenCalled();
    expect(mocked.openlist.uploadFormatConvertResultToOpenlist).toHaveBeenCalledWith(
      'u2',
      expect.anything(),
      '/tmp/task-1/output.mp4'
    );
    expect(mocked.workspace.cleanupFormatConvertWorkspace).not.toHaveBeenCalled();
  });
});
