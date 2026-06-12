import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/utils', () => ({
  http: mocked.http,
}));

describe('format convert service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.http.post.mockResolvedValue({
      task: {
        id: 1,
      },
    });
  });

  it('reports local upload progress as integer percent', async () => {
    const { createLocalFormatConvertTask } = await import('../format-convert');
    const onUploadProgress = vi.fn();

    await createLocalFormatConvertTask(
      new Blob(['demo'], { type: 'video/quicktime' }) as File,
      {
        commandMode: 'preset' as never,
        target: {
          type: 'download' as never,
          fileName: 'demo.mp4',
        },
        option: {
          outputFormat: 'mp4' as never,
        },
      },
      {
        onUploadProgress,
      }
    );

    const requestConfig = mocked.http.post.mock.calls[0]?.[2];
    expect(typeof requestConfig?.onUploadProgress).toBe('function');

    requestConfig.onUploadProgress({
      loaded: 25,
      total: 100,
    });

    expect(onUploadProgress).toHaveBeenCalledWith(25);
  });

  it('calls the single delete endpoint for one task record', async () => {
    const { deleteFormatConvertTask } = await import('../format-convert');

    await deleteFormatConvertTask(12);

    expect(mocked.http.post).toHaveBeenCalledWith('/format-convert/task/12/delete');
  });

  it('calls the batch delete endpoint with selected task ids', async () => {
    const { deleteFormatConvertTasks } = await import('../format-convert');

    await deleteFormatConvertTasks([3, 5, 8]);

    expect(mocked.http.post).toHaveBeenCalledWith('/format-convert/tasks/delete', {
      taskIds: [3, 5, 8],
    });
  });
});
