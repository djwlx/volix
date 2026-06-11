import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  runner: {
    runFormatConvertTask: vi.fn(),
  },
  taskDb: {
    findNextPendingFormatConvertTask: vi.fn(),
    listRecoverableFormatConvertTasks: vi.fn(),
    resetFormatConvertTaskToPending: vi.fn(),
  },
  workspace: {
    cleanupFormatConvertWorkspace: vi.fn(),
  },
}));

vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-runner.service', () => mocked.runner);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-task-db.service', () => mocked.taskDb);
vi.mock('../../apps/api/src/modules/format-convert/service/format-convert-workspace.service', () => mocked.workspace);

describe('format convert queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.runner.runFormatConvertTask.mockResolvedValue(undefined);
    mocked.taskDb.listRecoverableFormatConvertTasks.mockResolvedValue([]);
    mocked.taskDb.resetFormatConvertTaskToPending.mockResolvedValue(undefined);
    mocked.workspace.cleanupFormatConvertWorkspace.mockResolvedValue(undefined);
  });

  it('collects recoverable statuses from arbitrary lists', async () => {
    const { collectRecoverableTasks } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-queue.service'
    );

    expect(collectRecoverableTasks(['pending', 'converting', 'upload_failed'] as never)).toEqual([
      'converting',
      'upload_failed',
    ]);
  });

  it('resets recoverable tasks and starts the single worker queue', async () => {
    mocked.taskDb.listRecoverableFormatConvertTasks.mockResolvedValue([
      { id: 1, workspaceDir: '/tmp/a', status: 'converting' },
    ]);
    mocked.taskDb.findNextPendingFormatConvertTask.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);

    const { recoverAndStartFormatConvertQueue } = await import(
      '../../apps/api/src/modules/format-convert/service/format-convert-queue.service'
    );

    await recoverAndStartFormatConvertQueue();

    expect(mocked.workspace.cleanupFormatConvertWorkspace).toHaveBeenCalledWith('/tmp/a');
    expect(mocked.taskDb.resetFormatConvertTaskToPending).toHaveBeenCalledWith(1);
    expect(mocked.runner.runFormatConvertTask).toHaveBeenCalledWith({ id: 1 });
  });
});
