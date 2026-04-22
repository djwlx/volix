# Random Pic Parent Folder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `同文件夹随机` action to the random picture page, returning another image from the current picture's parent folder and showing the current image's full path.

**Architecture:** Extend the 115 picture service so both global-random and parent-folder-random flows return path context (`path`, `parentPath`) built from cached file metadata. Expose a dedicated `GET /115/pic/parent-random` endpoint, then wire the web page to render the path and call the new endpoint while preserving existing random and like behavior.

**Tech Stack:** TypeScript, Koa, Sequelize, React 18, Semi UI, Vitest

---

### Task 1: Add backend regression tests for random picture path context and parent-folder random

**Files:**
- Create: `test/api/115-picture.service.test.ts`
- Reference: `apps/api/src/modules/115/service/picture.service.ts`
- Reference: `apps/api/src/modules/115/service/file-db.service.ts`
- Reference: `packages/types/src/api/115.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, test, vi } from 'vitest';

const getConfigMock = vi.fn();
const clearConfigMock = vi.fn();
const setConfigMock = vi.fn();
const getFile115ParentGroupByCidListMock = vi.fn();
const getFile115ByCidParentCidIndexMock = vi.fn();
const getFile115ByCidIndexMock = vi.fn();
const getFile115ByPcMock = vi.fn();
const getFile115ByCidAndParentCidMock = vi.fn();
const getFile115ByCidMock = vi.fn();
const get115FileDataMock = vi.fn();
const generateRandomNumberMock = vi.fn();

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: getConfigMock,
  clearConfig: clearConfigMock,
  setConfig: setConfigMock,
}));

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115Len: vi.fn(),
  getFile115CountByCid: vi.fn(),
  clearAllFile115: vi.fn(),
  clearFile115ByCidList: vi.fn(),
  setFile115List: vi.fn(),
  getFile115ParentGroupByCidList: getFile115ParentGroupByCidListMock,
  getFile115ByCidParentCidIndex: getFile115ByCidParentCidIndexMock,
  getFile115ByCidIndex: getFile115ByCidIndexMock,
  getFile115ByPc: getFile115ByPcMock,
  getFile115ByCidAndParentCid: getFile115ByCidAndParentCidMock,
  getFile115ByCid: getFile115ByCidMock,
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: get115FileDataMock,
}));

vi.mock('../../apps/api/src/utils/number', () => ({
  generateRandomNumber: generateRandomNumberMock,
}));

describe('115 picture service random meta', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getConfigMock.mockResolvedValue(null);
    clearConfigMock.mockResolvedValue(undefined);
    setConfigMock.mockResolvedValue(undefined);
  });

  test('getRandom115PicMeta returns path and parentPath for the selected image', async () => {
    getConfigMock
      .mockResolvedValueOnce({
        picture_115_folders: JSON.stringify([{ cid: 'root', status: 'cached' }]),
      })
      .mockResolvedValueOnce(null);
    getFile115ParentGroupByCidListMock.mockResolvedValue([{ cid: 'root', parentCid: 'folder-a', count: 2 }]);
    getFile115ByCidParentCidIndexMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      name: '01.jpg',
    });
    getFile115ByCidMock.mockImplementation(async (cid: string) => {
      if (cid === 'folder-a') return { cid: 'folder-a', parentCid: 'root', name: 'Album A' };
      if (cid === 'root') return { cid: 'root', parentCid: null, name: 'Root' };
      return null;
    });
    get115FileDataMock.mockResolvedValue({
      info: {
        url: { url: 'https://img.example/01.jpg' },
        file_name: '01.jpg',
      },
    });
    generateRandomNumberMock.mockReturnValue(0);

    const { getRandom115PicMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
    const result = await getRandom115PicMeta('test-agent');

    expect(result.path).toBe('/Root/Album A/01.jpg');
    expect(result.parentPath).toBe('/Root/Album A');
  });

  test('getRandom115PicFromParentMeta picks another image in the same parent folder when available', async () => {
    getFile115ByPcMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      name: '01.jpg',
    });
    getFile115ByCidAndParentCidMock.mockResolvedValue([
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-1', name: '01.jpg' },
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-2', name: '02.jpg' },
    ]);
    getFile115ByCidMock.mockImplementation(async (cid: string) => {
      if (cid === 'folder-a') return { cid: 'folder-a', parentCid: 'root', name: 'Album A' };
      if (cid === 'root') return { cid: 'root', parentCid: null, name: 'Root' };
      return null;
    });
    get115FileDataMock.mockResolvedValue({
      info: {
        url: { url: 'https://img.example/02.jpg' },
        file_name: '02.jpg',
      },
    });
    generateRandomNumberMock.mockReturnValue(0);

    const { getRandom115PicFromParentMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
    const result = await getRandom115PicFromParentMeta({
      pc: 'pc-1',
      userAgent: 'test-agent',
    });

    expect(result.pc).toBe('pc-2');
    expect(result.parentPath).toBe('/Root/Album A');
    expect(result.path).toBe('/Root/Album A/02.jpg');
  });

  test('getRandom115PicFromParentMeta returns the current image when the folder has no sibling image', async () => {
    getFile115ByPcMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      name: '01.jpg',
    });
    getFile115ByCidAndParentCidMock.mockResolvedValue([
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-1', name: '01.jpg' },
    ]);
    getFile115ByCidMock.mockImplementation(async (cid: string) => {
      if (cid === 'folder-a') return { cid: 'folder-a', parentCid: 'root', name: 'Album A' };
      if (cid === 'root') return { cid: 'root', parentCid: null, name: 'Root' };
      return null;
    });
    get115FileDataMock.mockResolvedValue({
      info: {
        url: { url: 'https://img.example/01.jpg' },
        file_name: '01.jpg',
      },
    });
    generateRandomNumberMock.mockReturnValue(0);

    const { getRandom115PicFromParentMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
    const result = await getRandom115PicFromParentMeta({
      pc: 'pc-1',
      userAgent: 'test-agent',
    });

    expect(result.pc).toBe('pc-1');
    expect(result.notice).toBe('当前目录没有其他图片可切换');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: FAIL with missing exports or missing `path` / `parentPath` fields.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface RandomPicMeta {
  url: string;
  fileName: string;
  cid: string;
  pc: string;
  path: string;
  parentPath: string;
  notice?: string;
}

const build115FilePath = async (file: Cloud115DbFileItem) => {
  const segments = [file.name];
  let cursor = file.parentCid || file.cid;

  while (cursor) {
    const current = await getFile115ByCid(cursor);
    if (!current) break;
    segments.unshift(current.name);
    if (!current.parentCid || current.parentCid === current.cid) break;
    cursor = current.parentCid;
  }

  const path = `/${segments.filter(Boolean).join('/')}`;
  return {
    path,
    parentPath: path.split('/').slice(0, -1).join('/') || '/',
  };
};

export async function getRandom115PicFromParentMeta(params: {
  pc: string;
  userAgent: string;
}): Promise<RandomPicMeta> {
  const current = await getFile115ByPc(params.pc);
  const sameFolderFiles = await getFile115ByCidAndParentCid(current?.cid || '', current?.parentCid || '');
  const siblings = sameFolderFiles.filter(item => item.pc !== current?.pc);
  const selected = siblings.length > 0
    ? siblings[generateRandomNumber(0, siblings.length - 1)]
    : current;

  const meta = await buildRandomPicMetaFromFile(selected, params.userAgent);
  return siblings.length > 0
    ? meta
    : { ...meta, notice: '当前目录没有其他图片可切换' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/api/115-picture.service.test.ts apps/api/src/modules/115/service/picture.service.ts apps/api/src/modules/115/service/file-db.service.ts packages/types/src/api/115.ts apps/api/src/modules/115/types/115.types.ts
git commit -m "feat: add parent folder random pic service"
```

### Task 2: Expose the new endpoint through controller and route layers

**Files:**
- Modify: `apps/api/src/modules/115/controller/115.controller.ts`
- Modify: `apps/api/src/modules/115/115.route.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('getRandom115PicByParent forwards pc and user agent to the parent-folder random service', async () => {
  const getRandom115PicFromParentMetaMock = vi.fn().mockResolvedValue({
    url: 'https://img.example/02.jpg',
    fileName: '02.jpg',
    cid: 'root',
    pc: 'pc-2',
    path: '/Root/Album A/02.jpg',
    parentPath: '/Root/Album A',
  });

  vi.doMock('../../apps/api/src/modules/115/service/picture.service', async importOriginal => {
    const actual = await importOriginal<object>();
    return {
      ...actual,
      getRandom115PicFromParentMeta: getRandom115PicFromParentMetaMock,
    };
  });

  const { getRandom115PicByParent } = await import('../../apps/api/src/modules/115/controller/115.controller');
  const result = await getRandom115PicByParent({
    query: { pc: 'pc-1' },
    request: { headers: { 'user-agent': 'agent' } },
  } as never);

  expect(getRandom115PicFromParentMetaMock).toHaveBeenCalledWith({
    pc: 'pc-1',
    userAgent: 'agent',
  });
  expect(result.path).toBe('/Root/Album A/02.jpg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: FAIL because `getRandom115PicByParent` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export const getRandom115PicByParent: MyMiddleware = async ctx => {
  const ua = ctx.request.headers['user-agent'];
  const pc = String(ctx.query?.pc || '');

  return getRandom115PicFromParentMeta({
    pc,
    userAgent: ua as string,
  });
};
```

```ts
router.get('/pic/parent-random', http(getRandom115PicByParent));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/115/controller/115.controller.ts apps/api/src/modules/115/115.route.ts test/api/115-picture.service.test.ts
git commit -m "feat: expose parent folder random pic endpoint"
```

### Task 3: Update shared API types and web service helpers

**Files:**
- Modify: `packages/types/src/api/115.ts`
- Modify: `apps/web-pc/src/services/115.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('Random115PicResponse includes path metadata and optional notice', () => {
  const response: Random115PicResponse = {
    url: 'https://img.example/01.jpg',
    fileName: '01.jpg',
    cid: 'root',
    pc: 'pc-1',
    path: '/Root/Album A/01.jpg',
    parentPath: '/Root/Album A',
    notice: '当前目录没有其他图片可切换',
  };

  expect(response.parentPath).toBe('/Root/Album A');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: FAIL in TypeScript or test compile because new fields are missing on `Random115PicResponse`.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface Random115PicResponse {
  url: string;
  fileName: string;
  cid: string;
  pc: string;
  path: string;
  parentPath: string;
  notice?: string;
}

export function get115PicFromParent(pc: string) {
  return http.get<Random115PicResponse>('/115/pic/parent-random', {
    params: { pc },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/api/115.ts apps/web-pc/src/services/115.ts test/api/115-picture.service.test.ts
git commit -m "feat: add parent folder random pic api types"
```

### Task 4: Wire the random picture page to show full path and support parent-folder random

**Files:**
- Modify: `apps/web-pc/src/apps/pic/index.tsx`
- Modify: `apps/web-pc/src/apps/pic/index.module.scss`
- Reference: `apps/web-pc/src/services/115.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('PicApp shows the current path and requests a sibling image from the parent folder', async () => {
  const get115PicMock = vi.fn().mockResolvedValue({
    data: {
      url: 'https://img.example/01.jpg',
      cid: 'root',
      pc: 'pc-1',
      path: '/Root/Album A/01.jpg',
      parentPath: '/Root/Album A',
    },
  });
  const get115PicFromParentMock = vi.fn().mockResolvedValue({
    data: {
      url: 'https://img.example/02.jpg',
      cid: 'root',
      pc: 'pc-2',
      path: '/Root/Album A/02.jpg',
      parentPath: '/Root/Album A',
    },
  });

  expect(get115PicMock).toHaveBeenCalled();
  expect(screen.getByText('/Root/Album A/01.jpg')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '同文件夹随机' }));

  expect(get115PicFromParentMock).toHaveBeenCalledWith('pc-1');
  expect(screen.getByText('/Root/Album A/02.jpg')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: FAIL because `PicMeta` and service calls do not support path context or parent-folder random.

- [ ] **Step 3: Write minimal implementation**

```tsx
interface PicMeta {
  src: string;
  cid: string;
  pc: string;
  path: string;
  parentPath: string;
}

const applyPicMeta = (data?: Random115PicResponse | null) => {
  if (data?.url) {
    setPicMeta({
      src: data.url,
      cid: data.cid,
      pc: data.pc,
      path: data.path || '',
      parentPath: data.parentPath || '',
    });
    if (data.notice) {
      Toast.info(data.notice);
    }
    return;
  }
  setPicMeta(null);
};

const fetchSiblingImg = async () => {
  if (!picMeta?.pc) {
    return;
  }

  try {
    setLoading(true);
    const res = await get115PicFromParent(picMeta.pc);
    applyPicMeta(res.data);
  } catch (error) {
    Toast.error(getHttpErrorMessage(error, '同文件夹随机失败'));
  } finally {
    setLoading(false);
  }
};
```

```tsx
<div className={styles.metaPath}>{picMeta.path}</div>
<Button
  theme="solid"
  type="secondary"
  disabled={!picMeta.parentPath}
  onClick={() => fetchSiblingImg()}
>
  同文件夹随机
</Button>
```

```scss
.actions {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 10;
  max-width: min(80vw, 640px);
}

.metaPath {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @volix/web-pc build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/pic/index.tsx apps/web-pc/src/apps/pic/index.module.scss apps/web-pc/src/services/115.ts
git commit -m "feat: add parent folder random pic action"
```

### Task 5: Final verification

**Files:**
- Modify: none

- [ ] **Step 1: Run focused backend tests**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 2: Run full repository type/build verification for touched apps**

Run: `pnpm typecheck && pnpm --filter @volix/web-pc build && pnpm --filter @volix/api build`
Expected: PASS

- [ ] **Step 3: Review git diff**

Run: `git diff --stat`
Expected: only the planned backend, type, plan doc, and web random-picture files changed.

- [ ] **Step 4: Commit final polish if needed**

```bash
git add test/api/115-picture.service.test.ts apps/api/src/modules/115/controller/115.controller.ts apps/api/src/modules/115/115.route.ts apps/api/src/modules/115/service/picture.service.ts apps/api/src/modules/115/service/file-db.service.ts apps/api/src/modules/115/types/115.types.ts packages/types/src/api/115.ts apps/web-pc/src/services/115.ts apps/web-pc/src/apps/pic/index.tsx apps/web-pc/src/apps/pic/index.module.scss docs/superpowers/plans/2026-04-22-random-pic-parent-folder.md
git commit -m "feat: support parent folder random pic"
```
