import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  http: {
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
    const { createLocalFormatConvertTask } = await import('./format-convert');
    const onUploadProgress = vi.fn();

    await createLocalFormatConvertTask(
      new File(['demo'], 'demo.mov', { type: 'video/quicktime' }),
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
});
