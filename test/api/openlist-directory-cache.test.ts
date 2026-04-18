import fs from 'fs';
import path from 'path';
import type { OpenlistFsListData, OpenlistSdk } from '../../apps/api/src/sdk/openlist/create-openlist.sdk';
import {
  createDirectoryReader,
  createThrottledOpenlistSdk,
} from '../../apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer.service';
import {
  cleanupOpenlistAiOrganizerTaskCache,
  getOpenlistAiOrganizerTaskCacheDir,
} from '../../apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer-cache.service';

type ListFsCall = {
  path: string;
  page?: number;
  perPage?: number;
  refresh?: boolean;
  at: number;
};

const createMockSdk = (
  handler: (params: {
    path: string;
    page?: number;
    perPage?: number;
    refresh?: boolean;
  }) => OpenlistFsListData | Promise<OpenlistFsListData>
) => {
  const calls: ListFsCall[] = [];

  const sdk = {
    listFs: async ({
      path: targetPath,
      page,
      perPage,
      refresh,
    }: {
      path: string;
      page?: number;
      perPage?: number;
      refresh?: boolean;
    }) => {
      calls.push({
        path: targetPath,
        page,
        perPage,
        refresh,
        at: Date.now(),
      });
      return handler({ path: targetPath, page, perPage, refresh });
    },
  } as Pick<OpenlistSdk, 'listFs'> as OpenlistSdk;

  return { sdk, calls };
};

describe('openlist directory cache', () => {
  test('persists cache, paginates, and throttles sdk calls', async () => {
    const taskId = 'task-cache-test';

    const firstMock = createMockSdk(async ({ path: targetPath }) => ({
      content: [
        { name: path.posix.basename(targetPath) || 'root', size: 1, is_dir: true, modified: new Date().toISOString() },
      ],
      total: 1,
    }));

    const firstReader = await createDirectoryReader(firstMock.sdk, {
      cacheTaskId: taskId,
      cacheTtlMs: 60_000,
      minRequestIntervalMs: 0,
    });

    const firstResult = await firstReader.read('/library');
    expect(firstMock.calls).toHaveLength(1);
    expect(firstMock.calls[0]?.perPage).toBe(500);
    expect(firstResult[0]?.name).toBe('library');

    const secondMock = createMockSdk(async () => {
      throw new Error('cache should prevent second network request');
    });

    const secondReader = await createDirectoryReader(secondMock.sdk, {
      cacheTaskId: taskId,
      cacheTtlMs: 60_000,
      minRequestIntervalMs: 0,
    });

    const secondResult = await secondReader.read('/library');
    expect(secondMock.calls).toHaveLength(0);
    expect(secondResult[0]?.name).toBe('library');

    const throttleMock = createMockSdk(async ({ path: targetPath }) => ({
      content: [
        { name: path.posix.basename(targetPath) || 'root', size: 1, is_dir: true, modified: new Date().toISOString() },
      ],
      total: 1,
    }));

    const throttledReader = await createDirectoryReader(throttleMock.sdk, {
      cacheTaskId: 'task-throttle-test',
      cacheTtlMs: 0,
      minRequestIntervalMs: 1000,
    });

    await throttledReader.read('/throttle-a', { forceRefresh: true });
    await throttledReader.read('/throttle-b', { forceRefresh: true });

    expect(throttleMock.calls).toHaveLength(2);
    expect(throttleMock.calls[1].at - throttleMock.calls[0].at).toBeGreaterThanOrEqual(900);

    const pagedMock = createMockSdk(async ({ path: targetPath, page = 1, perPage = 0 }) => {
      if (targetPath !== '/paged-library') {
        return { content: [], total: 0 };
      }

      const total = 501;
      const start = (page - 1) * perPage;
      const end = Math.min(start + perPage, total);
      const content = Array.from({ length: Math.max(0, end - start) }, (_, index) => ({
        name: `item-${start + index}`,
        size: 1,
        is_dir: false,
        modified: new Date().toISOString(),
      }));

      return { content, total };
    });

    const pagedReader = await createDirectoryReader(pagedMock.sdk, {
      cacheTaskId: 'task-paged-test',
      cacheTtlMs: 0,
      minRequestIntervalMs: 0,
    });

    const pagedResult = await pagedReader.read('/paged-library', { forceRefresh: true });
    expect(pagedResult).toHaveLength(501);
    expect(pagedMock.calls).toHaveLength(2);
    expect(pagedMock.calls[0]?.page).toBe(1);
    expect(pagedMock.calls[1]?.page).toBe(2);
    expect(pagedMock.calls[0]?.perPage).toBe(500);

    const firstPageOnlyMock = createMockSdk(async ({ path: targetPath, page = 1, perPage = 0 }) => {
      if (targetPath !== '/paged-library') {
        return { content: [], total: 0 };
      }

      const total = 501;
      const start = (page - 1) * perPage;
      const end = Math.min(start + perPage, total);
      const content = Array.from({ length: Math.max(0, end - start) }, (_, index) => ({
        name: `item-${start + index}`,
        size: 1,
        is_dir: false,
        modified: new Date().toISOString(),
      }));

      return { content, total };
    });

    const firstPageOnlyReader = await createDirectoryReader(firstPageOnlyMock.sdk, {
      cacheTaskId: 'task-paged-limit-test',
      cacheTtlMs: 0,
      minRequestIntervalMs: 0,
      maxPages: 1,
    });

    const firstPageOnlyResult = await firstPageOnlyReader.read('/paged-library', { forceRefresh: true });
    expect(firstPageOnlyResult).toHaveLength(500);
    expect(firstPageOnlyMock.calls).toHaveLength(1);
    expect(firstPageOnlyMock.calls[0]?.page).toBe(1);

    const writeCalls: Array<{ type: string; at: number }> = [];
    const rawSdk = {
      getToken: () => '',
      setToken: () => undefined,
      clearToken: () => undefined,
      requestOpenlist: async () => null,
      login: async () => ({ token: '' }),
      loginWithHashedPassword: async () => ({ token: '' }),
      logout: async () => true,
      getMe: async () => ({ id: 1, username: 'tester', role: 1, disabled: false, permission: 1 }),
      listFs: async ({ path: targetPath }: { path: string }) => ({
        content: [
          {
            name: path.posix.basename(targetPath) || 'root',
            size: 1,
            is_dir: true,
            modified: new Date().toISOString(),
          },
        ],
      }),
      getFs: async () => ({ name: 'x', size: 1, is_dir: false, modified: new Date().toISOString() }),
      mkdir: async () => {
        writeCalls.push({ type: 'mkdir', at: Date.now() });
        return null;
      },
      rename: async () => {
        writeCalls.push({ type: 'rename', at: Date.now() });
        return null;
      },
      move: async () => null,
      copy: async () => null,
      remove: async () => null,
      listStorages: async () => ({ content: [], total: 0 }),
      listShares: async () => ({ content: [], total: 0 }),
      getPublicSettings: async () => ({}),
    } as unknown as OpenlistSdk;

    const throttledSdk = createThrottledOpenlistSdk(rawSdk, {
      minRequestIntervalMs: 1000,
    });

    await throttledSdk.mkdir({ path: '/a' });
    await throttledSdk.rename({ path: '/a', name: 'b' });

    expect(writeCalls).toHaveLength(2);
    expect(writeCalls[1].at - writeCalls[0].at).toBeGreaterThanOrEqual(900);

    const sharedCacheDir = getOpenlistAiOrganizerTaskCacheDir(taskId);
    const shardFiles = await fs.promises.readdir(sharedCacheDir);
    expect(shardFiles.length).toBeGreaterThanOrEqual(1);

    await cleanupOpenlistAiOrganizerTaskCache(taskId);
    await expect(fs.promises.access(sharedCacheDir)).rejects.toBeDefined();
  });
});
