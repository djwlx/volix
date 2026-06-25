# Random Pic Cache Folder Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cache-folder `random` action in random image settings that opens the random image page with the first image chosen from that cache folder only.

**Architecture:** Keep the change small by introducing one dedicated backend endpoint for cache-folder-first-image random, threading the folder `cid` through the settings table action and random image page bootstrap only. The existing page actions remain unchanged: global random still uses the existing endpoint, and same-folder random still uses the existing parent-random endpoint.

**Tech Stack:** Koa, TypeScript, React, Semi Design, Vitest

---

### Task 1: Add backend regression tests for cache-folder random bootstrap

**Files:**
- Modify: `test/api/115-random-pic-controller.test.ts`
- Test: `test/api/115-random-pic-controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('getRandom115PicByCacheCid returns random pic meta for a cache folder cid', async () => {
  const getRandom115PicFromCacheCidMetaMock = vi.fn().mockResolvedValue({
    url: 'https://img.example/folder.png',
    fileName: 'folder.png',
    cid: 'cid-folder',
    pc: 'pc-folder',
    path: '/缓存目录/folder.png',
    parentPath: '/缓存目录',
    liked: false,
  });

  vi.doMock('../../apps/api/src/modules/115/service/picture.service', () => ({
    getRandom115PicMeta: vi.fn(),
    getRandom115PicFromParentMeta: vi.fn(),
    getRandom115PicFromCacheCidMeta: getRandom115PicFromCacheCidMetaMock,
    get115PicPathByPcData: vi.fn(),
  }));

  const { getRandom115PicByCacheCid } = await import('../../apps/api/src/modules/115/controller/115.controller');
  const result = await getRandom115PicByCacheCid({
    query: { cid: 'cid-folder' },
    request: { headers: { 'user-agent': 'jest-agent' } },
  } as never);

  expect(getRandom115PicFromCacheCidMetaMock).toHaveBeenCalledWith({
    cid: 'cid-folder',
    userAgent: 'jest-agent',
  });
  expect(result).toMatchObject({
    cid: 'cid-folder',
    pc: 'pc-folder',
    path: '/缓存目录/folder.png',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest test/api/115-random-pic-controller.test.ts`
Expected: FAIL because `getRandom115PicByCacheCid` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export const getRandom115PicByCacheCid: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const cid = String(ctx.query?.cid || '');
  const randomCacheConfig = await getRandomCacheConfig();
  const result = await getRandom115PicFromCacheCidMeta({
    cid,
    userAgent: ua as string,
  });
  return {
    ...result,
    remoteSource: false,
    autoPlayIntervalSeconds: randomCacheConfig.autoPlayIntervalSeconds,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest test/api/115-random-pic-controller.test.ts`
Expected: PASS

### Task 2: Add backend service coverage for cache-folder random lookup

**Files:**
- Modify: `test/api/115-picture.service.test.ts`
- Modify: `apps/api/src/modules/115/service/picture/api-random.ts`
- Modify: `apps/api/src/modules/115/service/picture.service.ts`
- Test: `test/api/115-picture.service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('getRandom115PicFromCacheCidMeta picks a random file from the provided cache cid', async () => {
  const getFile115RandomByCidListExcludePcMock = vi.fn().mockResolvedValue({
    cid: 'cache-cid',
    parentCid: 'folder-parent',
    pc: 'pc-cache-1',
    name: 'picked.png',
    fullPath: '/缓存目录/picked.png',
  });

  vi.doMock('../../apps/api/src/modules/115/service/file-db.random.query.service', () => ({
    getFile115RandomByCidListExcludePc: getFile115RandomByCidListExcludePcMock,
    getFile115RandomByCidList: vi.fn(),
  }));

  const { getRandom115PicFromCacheCidMeta } = await import(
    '../../apps/api/src/modules/115/service/picture/api-random'
  );

  await getRandom115PicFromCacheCidMeta({
    cid: 'cache-cid',
    userAgent: 'jest-agent',
  });

  expect(getFile115RandomByCidListExcludePcMock).toHaveBeenCalledWith(['cache-cid'], expect.any(Array));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest test/api/115-picture.service.test.ts`
Expected: FAIL because `getRandom115PicFromCacheCidMeta` is missing.

- [ ] **Step 3: Write minimal implementation**

```ts
export async function getRandom115PicFromCacheCidMeta(params: { cid: string; userAgent: string }) {
  const cid = params.cid.trim();
  if (!cid) {
    badRequest(t('pic115Api.cacheCidRequired'));
  }

  const selectedFile =
    (await getFile115RandomByCidListExcludePc([cid], dedupeExcludedPcList)) ||
    (await getFile115RandomByCidList([cid])) ||
    badRequest(t('pic115Api.cacheUnavailable'));

  const meta = await buildRandomPicMetaFromFile(selectedFile, params.userAgent);
  rememberPickedPc(randomPickedHistory, meta.pc, Date.now(), dedupeWindowMs, dedupeMaxCount);
  return meta;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest test/api/115-picture.service.test.ts`
Expected: PASS

### Task 3: Add frontend bootstrap test for query-driven cache-folder random

**Files:**
- Modify: `apps/web-pc/src/apps/pic/__tests__/` (create one focused test file if missing)
- Modify: `apps/web-pc/src/apps/pic/index.tsx`
- Modify: `apps/web-pc/src/services/115.ts`
- Test: `apps/web-pc/src/apps/pic/__tests__/pic-app.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
test('loads first picture from cache folder when cid query param exists', async () => {
  mockUseSearchParams('?cid=folder-cid');
  get115PicFromCacheCidMock.mockResolvedValue({
    data: {
      url: 'https://img.example/cache.png',
      fileName: 'cache.png',
      cid: 'folder-cid',
      pc: 'pc-cache',
      path: '/缓存目录/cache.png',
      parentPath: '/缓存目录',
      liked: false,
    },
  });

  render(<PicApp />);

  await waitFor(() => {
    expect(get115PicFromCacheCidMock).toHaveBeenCalledWith('folder-cid');
  });
  expect(get115PicMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web-pc/src/apps/pic/__tests__/pic-app.test.tsx`
Expected: FAIL because the page does not read `cid` yet.

- [ ] **Step 3: Write minimal implementation**

```ts
const [searchParams] = useSearchParams();
const bootstrapCid = String(searchParams.get('cid') || '').trim();

const fetchInitialImg = async () => {
  try {
    setLoading(true);
    const res = bootstrapCid ? await get115PicFromCacheCid(bootstrapCid) : await get115Pic('json');
    applyPicMeta(res.data);
  } catch {
    setPicMeta(null);
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web-pc/src/apps/pic/__tests__/pic-app.test.tsx`
Expected: PASS

### Task 4: Add settings table action and navigation coverage

**Files:**
- Modify: `apps/web-pc/src/apps/115/pic-setting.tsx`
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`
- Test: `apps/web-pc/src/apps/115/__tests__/pic-setting-random-action.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
test('renders cache-folder random action and navigates to pic page with cid query', async () => {
  render(<PicSetting />);

  const randomButton = await screen.findByRole('button', { name: 'zh:pic115.action.random' });
  await userEvent.click(randomButton);

  expect(requestNavigateMock).toHaveBeenCalledWith('/pic?cid=folder-1');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web-pc/src/apps/115/__tests__/pic-setting-random-action.test.tsx`
Expected: FAIL because the action does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
{
  title: t('pic115.table.action'),
  render: (_, record) => (
    <Space>
      <Button theme="light" onClick={() => requestNavigate(`/pic?cid=${encodeURIComponent(record.cid)}`)}>
        {t('pic115.action.random')}
      </Button>
    </Space>
  ),
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web-pc/src/apps/115/__tests__/pic-setting-random-action.test.tsx`
Expected: PASS

### Task 5: Verify focused regression coverage

**Files:**
- Modify: none
- Test: `test/api/115-random-pic-controller.test.ts`
- Test: `test/api/115-picture.service.test.ts`
- Test: `apps/web-pc/src/apps/pic/__tests__/pic-app.test.tsx`
- Test: `apps/web-pc/src/apps/115/__tests__/pic-setting-random-action.test.tsx`

- [ ] **Step 1: Run backend focused tests**

Run: `pnpm vitest test/api/115-random-pic-controller.test.ts test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 2: Run frontend focused tests**

Run: `pnpm vitest apps/web-pc/src/apps/pic/__tests__/pic-app.test.tsx apps/web-pc/src/apps/115/__tests__/pic-setting-random-action.test.tsx`
Expected: PASS

- [ ] **Step 3: Run one broader confidence check**

Run: `pnpm vitest test/api/115-random-pic-controller.test.ts test/api/115-picture.service.test.ts apps/web-pc/src/apps/pic/__tests__/pic-app.test.tsx apps/web-pc/src/apps/115/__tests__/pic-setting-random-action.test.tsx`
Expected: PASS
