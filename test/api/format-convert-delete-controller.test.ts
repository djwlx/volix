import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
  FormatConvertTaskStatus,
} from '@volix/types';

const mocked = vi.hoisted(() => ({
  artifact: {
    cleanupFormatConvertTaskLocalArtifacts: vi.fn(),
    hasFormatConvertLocalArtifacts: vi.fn(() => true),
    buildFormatConvertCleanupPayload: vi.fn(),
  },
  taskDb: {
    createFormatConvertTask: vi.fn(),
    getFormatConvertTaskByIdAndUserId: vi.fn(),
    listFormatConvertTasksByIdsAndUserId: vi.fn(),
    listFormatConvertTasksByUserId: vi.fn(),
    resetFormatConvertTaskToPending: vi.fn(),
    updateFormatConvertTask: vi.fn(),
    deleteFormatConvertTaskByIdAndUserId: vi.fn(),
    deleteFormatConvertTasksByIdsAndUserId: vi.fn(),
  },
  queue: {
    ensureFormatConvertQueueRunning: vi.fn(),
  },
}));

vi.mock('../../apps/api/src/utils/i18n', () => ({
  t: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
}));

vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-artifact.service', () => mocked.artifact);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-task-db.service', () => mocked.taskDb);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-queue.service', () => mocked.queue);

const createTask = (id: number, status: FormatConvertTaskStatus) =>
  ({
    id,
    userId: 'u1',
    mode: FormatConvertMode.LOCAL,
    commandMode: 'preset',
    status,
    source: {
      type: FormatConvertSourceType.UPLOAD,
      fileName: `demo-${id}.mov`,
      uploadPath: `/tmp/demo-${id}.mov`,
    },
    target: {
      type: FormatConvertTargetType.DOWNLOAD,
      fileName: `demo-${id}.mp4`,
    },
    option: {
      outputFormat: 'mp4',
    },
    attemptCount: 0,
  } as const);

describe('format convert delete controller', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('deletes one finished task record after cleaning local artifacts', async () => {
    mocked.taskDb.getFormatConvertTaskByIdAndUserId.mockResolvedValue(createTask(7, FormatConvertTaskStatus.COMPLETED));
    mocked.taskDb.deleteFormatConvertTaskByIdAndUserId.mockResolvedValue(1);

    const { deleteFormatConvertTask } = await import(
      '../../apps/api/src/modules/format-convert/controller/format-convert.controller'
    );

    const result = await deleteFormatConvertTask({
      state: {
        userInfo: {
          id: 'u1',
        },
      },
      params: {
        id: '7',
      },
    } as never);

    expect(mocked.artifact.cleanupFormatConvertTaskLocalArtifacts).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 })
    );
    expect(mocked.taskDb.deleteFormatConvertTaskByIdAndUserId).toHaveBeenCalledWith(7, 'u1');
    expect(result).toEqual({ success: true });
  });

  it('rejects deleting a non-finished task record', async () => {
    mocked.taskDb.getFormatConvertTaskByIdAndUserId.mockResolvedValue(createTask(9, FormatConvertTaskStatus.PENDING));

    const { deleteFormatConvertTask } = await import(
      '../../apps/api/src/modules/format-convert/controller/format-convert.controller'
    );

    await expect(
      deleteFormatConvertTask({
        state: {
          userInfo: {
            id: 'u1',
          },
        },
        params: {
          id: '9',
        },
      } as never)
    ).rejects.toMatchObject({
      status: 400,
      message: '当前任务状态不允许删除记录',
    });
  });

  it('batch deletes only finished task records and returns the deleted count', async () => {
    mocked.taskDb.listFormatConvertTasksByIdsAndUserId.mockResolvedValue([
      createTask(1, FormatConvertTaskStatus.COMPLETED),
      createTask(2, FormatConvertTaskStatus.CONVERT_FAILED),
      createTask(3, FormatConvertTaskStatus.CONVERTING),
    ]);
    mocked.taskDb.deleteFormatConvertTasksByIdsAndUserId.mockResolvedValue(2);

    const { deleteFormatConvertTasks } = await import(
      '../../apps/api/src/modules/format-convert/controller/format-convert.controller'
    );

    const result = await deleteFormatConvertTasks({
      state: {
        userInfo: {
          id: 'u1',
        },
      },
      request: {
        body: {
          taskIds: [1, 2, 3],
        },
      },
    } as never);

    expect(mocked.artifact.cleanupFormatConvertTaskLocalArtifacts).toHaveBeenCalledTimes(2);
    expect(mocked.taskDb.deleteFormatConvertTasksByIdsAndUserId).toHaveBeenCalledWith([1, 2], 'u1');
    expect(result).toEqual({
      success: true,
      deletedCount: 2,
    });
  });
});
