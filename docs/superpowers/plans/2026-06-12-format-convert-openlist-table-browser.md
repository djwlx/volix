# Format Convert OpenList Table Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the OpenList tree pickers with one shared table browser that supports real pagination, file multi-select, and directory selection reuse across format-convert flows.

**Architecture:** Extend the existing OpenList browse API to accept and return pagination metadata, then build one path-driven table browser component in `apps/web-pc` and plug both `CloudSourceTree` and `OpenlistBrowser` into it. Keep task creation payloads unchanged; only the browse contract and picker UI change.

**Tech Stack:** TypeScript, React 18, Semi UI, Vitest, i18next, Koa controller/service layer, OpenList SDK

---

### Task 1: Add paginated OpenList browse contract

**Files:**
- Modify: `packages/types/src/api/format-convert.ts`
- Modify: `apps/api/src/modules/format-convert/controller/format-convert.controller.ts`
- Modify: `apps/api/src/modules/format-convert/service/format-convert-openlist.service.ts`
- Modify: `apps/web-pc/src/services/format-convert.ts`
- Create: `apps/api/src/modules/format-convert/service/__tests__/format-convert-openlist.service.test.ts`
- Modify: `apps/web-pc/src/services/__tests__/format-convert.test.ts`

- [ ] **Step 1: Write failing tests for the new browse contract**

Add one backend test for the service mapper and one frontend service test for query params.

```ts
import { describe, expect, it, vi } from 'vitest';
import { listFormatConvertOpenlistFs } from '../format-convert-openlist.service';

vi.mock('../../../user/service/user-config.service', () => ({
  getUserAccountConfigs: vi.fn().mockResolvedValue({
    openlist: {
      baseUrl: 'https://openlist.example.com',
      username: 'demo',
      password: 'hashed-password',
    },
  }),
}));

const listFs = vi.fn().mockResolvedValue({
  total: 42,
  content: [{ name: 'movie.mp4', size: 1024, is_dir: false, modified: '2026-06-12 10:00:00' }],
});

vi.mock('../../../sdk/openlist', () => ({
  createOpenlistSdk: () => ({
    loginWithHashedPassword: vi.fn().mockResolvedValue(undefined),
    listFs,
  }),
}));

describe('listFormatConvertOpenlistFs', () => {
  it('passes page params through and returns pagination metadata', async () => {
    const result = await listFormatConvertOpenlistFs('u1', '/videos', 3, 50);

    expect(listFs).toHaveBeenCalledWith({
      path: '/videos',
      page: 3,
      perPage: 50,
      refresh: false,
    });
    expect(result).toMatchObject({
      path: '/videos',
      page: 3,
      perPage: 50,
      total: 42,
    });
  });
});
```

```ts
it('passes path and pagination params when browsing openlist files', async () => {
  const { browseFormatConvertOpenlist } = await import('../format-convert');

  await browseFormatConvertOpenlist({ path: '/shows', page: 2, perPage: 30 });

  expect(mocked.http.get).toHaveBeenCalledWith('/format-convert/openlist/fs', {
    params: {
      path: '/shows',
      page: 2,
      perPage: 30,
    },
  });
});
```

- [ ] **Step 2: Run tests to confirm the new assertions fail**

Run:

```bash
pnpm vitest run \
  apps/api/src/modules/format-convert/service/__tests__/format-convert-openlist.service.test.ts \
  apps/web-pc/src/services/__tests__/format-convert.test.ts
```

Expected: FAIL because `listFormatConvertOpenlistFs` and `browseFormatConvertOpenlist` do not accept pagination arguments yet.

- [ ] **Step 3: Implement the paginated contract**

Update shared types first so both API and web compile against the same shape.

```ts
export interface FormatConvertOpenlistBrowserResult {
  path: string;
  page: number;
  perPage: number;
  content: FormatConvertOpenlistBrowserItem[];
  total?: number;
}
```

Update the service and controller signatures to accept pagination:

```ts
export const listFormatConvertOpenlistFs = async (
  userId: string | number,
  dirPath: string,
  page = 1,
  perPage = 20
): Promise<FormatConvertOpenlistBrowserResult> => {
  const sdk = await createUserOpenlistSdk(userId);
  const result = await sdk.listFs({
    path: dirPath,
    page,
    perPage,
    refresh: false,
  });

  return {
    path: dirPath.trim() || '/',
    page,
    perPage,
    total: Number(result.total || 0),
    content: (result.content || []).map(item => ({
      name: item.name,
      path: path.posix.join(dirPath.trim() || '/', item.name),
      isDir: Boolean(item.is_dir),
      size: Number(item.size || 0),
      modified: item.modified,
    })),
  };
};
```

```ts
export const listOpenlistFsForFormatConvert: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const dirPath = String(ctx.query.path || '/').trim() || '/';
  const page = Math.max(1, Number(ctx.query.page || 1) || 1);
  const perPage = Math.max(1, Number(ctx.query.perPage || 20) || 20);
  return listFormatConvertOpenlistFs(userId, dirPath, page, perPage);
};
```

Update the web service wrapper to accept one object argument:

```ts
export function browseFormatConvertOpenlist(params?: {
  path?: string;
  page?: number;
  perPage?: number;
}) {
  return http.get<FormatConvertOpenlistBrowserResult>('/format-convert/openlist/fs', {
    params: {
      path: params?.path || '/',
      page: params?.page || 1,
      perPage: params?.perPage || 20,
    },
  });
}
```

- [ ] **Step 4: Re-run the targeted tests and verify they pass**

Run the same command from Step 2.

Expected: PASS for the new backend and frontend browse-contract assertions.

- [ ] **Step 5: Commit the contract update**

```bash
git add \
  packages/types/src/api/format-convert.ts \
  apps/api/src/modules/format-convert/controller/format-convert.controller.ts \
  apps/api/src/modules/format-convert/service/format-convert-openlist.service.ts \
  apps/api/src/modules/format-convert/service/__tests__/format-convert-openlist.service.test.ts \
  apps/web-pc/src/services/format-convert.ts \
  apps/web-pc/src/services/__tests__/format-convert.test.ts
git commit -m "feat: paginate format convert openlist browse api"
```

### Task 2: Build the shared OpenList table browser

**Files:**
- Create: `apps/web-pc/src/apps/format-convert/components/openlist-table-browser.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/workbench.module.scss`

- [ ] **Step 1: Write failing tests for directory navigation, pagination, and file selection**

Mock `browseFormatConvertOpenlist` and assert the shared browser renders a table, reloads when changing pages, and reports selected file paths.

```ts
it('reloads the current path when the page changes', async () => {
  browseFormatConvertOpenlist.mockResolvedValue({
    data: {
      path: '/movies',
      page: 1,
      perPage: 20,
      total: 25,
      content: [{ name: 'part-1.mp4', path: '/movies/part-1.mp4', isDir: false, size: 10 }],
    },
  });

  render(
    <OpenlistTableBrowser
      selectMode="file"
      selectionMode="multiple"
      selectedPaths={[]}
      onFileSelectionChange={onFileSelectionChange}
    />
  );

  await user.click(screen.getByText('2'));

  expect(browseFormatConvertOpenlist).toHaveBeenLastCalledWith({
    path: '/movies',
    page: 2,
    perPage: 20,
  });
});
```

```ts
it('keeps checked file rows in sync with selected paths', async () => {
  render(
    <OpenlistTableBrowser
      selectMode="file"
      selectionMode="multiple"
      selectedPaths={['/movies/demo.mp4']}
      onFileSelectionChange={onFileSelectionChange}
    />
  );

  expect(screen.getByRole('checkbox', { name: /demo.mp4/i })).toBeChecked();
});
```

- [ ] **Step 2: Run the new component test and confirm it fails**

Run:

```bash
pnpm vitest run apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.tsx
```

Expected: FAIL because `OpenlistTableBrowser` does not exist yet.

- [ ] **Step 3: Implement the shared browser component**

Keep the component focused on browse state only: current path, current page, page size, loading state, and row selection.

```tsx
export function OpenlistTableBrowser(props: OpenlistTableBrowserProps) {
  const { selectMode, selectionMode, selectedPaths = [], selectedDirPath, disabled } = props;
  const [path, setPath] = useState('/');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [result, setResult] = useState<FormatConvertOpenlistBrowserResult | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (next: { path?: string; page?: number } = {}) => {
    const nextPath = next.path ?? path;
    const nextPage = next.page ?? page;
    setLoading(true);
    const response = await browseFormatConvertOpenlist({
      path: nextPath,
      page: nextPage,
      perPage,
    });
    setPath(response.data.path);
    setPage(response.data.page);
    setResult(response.data);
    setLoading(false);
  };

  const rows = (result?.content || []).filter(item => (selectMode === 'dir' ? item.isDir : true));

  return (
    <Table
      rowKey="path"
      loading={loading}
      dataSource={rows}
      pagination={{
        currentPage: result?.page || page,
        pageSize: result?.perPage || perPage,
        total: result?.total || 0,
        onPageChange: nextPage => void load({ page: nextPage }),
      }}
    />
  );
}
```

Use row-selection logic keyed by file `path`, and add toolbar controls for refresh and parent-directory navigation. Keep the file under 500 lines; if the render logic grows, split the table column factory into a sibling helper file before continuing.

- [ ] **Step 4: Re-run the shared browser test and verify it passes**

Run the same command from Step 2.

Expected: PASS for table rendering, page-change loading, and selected-path syncing.

- [ ] **Step 5: Commit the shared browser**

```bash
git add \
  apps/web-pc/src/apps/format-convert/components/openlist-table-browser.tsx \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.tsx \
  apps/web-pc/src/apps/format-convert/components/workbench.module.scss
git commit -m "feat: add shared openlist table browser"
```

### Task 3: Migrate the cloud source picker to the shared browser

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/cloud-source-tree.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/media-convert-panel.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/index.ts`
- Delete: `apps/web-pc/src/apps/format-convert/openlist-tree.ts`
- Delete: `apps/web-pc/src/apps/format-convert/__tests__/openlist-tree.test.ts`

- [ ] **Step 1: Write failing tests for cross-directory multi-select retention**

Add a shared-browser or wrapper-level test that mounts the cloud picker with preselected file paths from another directory and verifies the basket-facing callback keeps them.

```ts
it('preserves previously selected files when browsing into another directory', async () => {
  const selected = {
    '/anime/ep1.mkv': { path: '/anime/ep1.mkv', name: 'ep1.mkv' },
  };

  render(<CloudSourceTree selected={selected} onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button', { name: /season-2/i }));
  await user.click(screen.getByRole('checkbox', { name: /ep2.mkv/i }));

  expect(onSelectionChange).toHaveBeenLastCalledWith({
    '/anime/ep1.mkv': { path: '/anime/ep1.mkv', name: 'ep1.mkv' },
    '/anime/season-2/ep2.mkv': { path: '/anime/season-2/ep2.mkv', name: 'ep2.mkv' },
  });
});
```

- [ ] **Step 2: Run the cloud-picker tests and confirm they fail**

Run:

```bash
pnpm vitest run \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.tsx \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-browser.test.ts
```

Expected: FAIL until `CloudSourceTree` stops depending on the tree-specific model.

- [ ] **Step 3: Replace tree-specific logic in `CloudSourceTree`**

Remove `Tree`, `expandedKeys`, `loadNodeData`, and `openlist-tree` imports. Keep the wrapper contract unchanged:

```tsx
export function CloudSourceTree(props: CloudSourceTreeProps) {
  const { disabled, selected, onSelectionChange } = props;

  return (
    <div className={styles.treePanel}>
      <div className={styles.treeToolbar}>
        <div>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            {t('formatConvert.cloud.sourceTreeTitle')}
          </Typography.Title>
          <div className={styles.treeHint}>{t('formatConvert.cloud.sourceTreeHint')}</div>
        </div>
      </div>

      <OpenlistTableBrowser
        disabled={disabled}
        selectMode="file"
        selectionMode="multiple"
        selectedPaths={Object.keys(selected)}
        onFileSelectionChange={items => onSelectionChange(createCloudSelectionMap(items))}
      />
    </div>
  );
}
```

If `createCloudSelectionMap` needs to preserve stable object ordering for the basket, update it here rather than adding browser-specific state to `MediaConvertPanel`.

- [ ] **Step 4: Re-run the targeted tests and verify they pass**

Run the same command from Step 2.

Expected: PASS with the tree helper removed from the cloud source flow.

- [ ] **Step 5: Commit the cloud-source migration**

```bash
git add \
  apps/web-pc/src/apps/format-convert/components/cloud-source-tree.tsx \
  apps/web-pc/src/apps/format-convert/components/media-convert-panel.tsx \
  apps/web-pc/src/apps/format-convert/components/index.ts \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.tsx
git rm \
  apps/web-pc/src/apps/format-convert/openlist-tree.ts \
  apps/web-pc/src/apps/format-convert/__tests__/openlist-tree.test.ts
git commit -m "refactor: use table browser for cloud source selection"
```

### Task 4: Migrate modal OpenList picking to the shared browser

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/openlist-browser.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/__tests__/openlist-browser.test.ts`
- Modify: `apps/web-pc/src/apps/format-convert/components/cloud-convert-card.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/media-convert-panel.tsx`

- [ ] **Step 1: Write failing tests for directory-mode table rendering and current-directory confirm**

Expand the existing modal test to assert that directory mode renders table controls and returns the current browsed path when confirmed.

```ts
it('renders the shared table browser and confirms the current directory in dir mode', async () => {
  const onSelect = vi.fn();

  render(
    <OpenlistBrowser
      open
      selectMode="dir"
      title="选择保存目录"
      onCancel={() => undefined}
      onSelect={onSelect}
    />
  );

  await user.click(screen.getByRole('button', { name: '选择该目录' }));

  expect(screen.getByTestId('openlist-table-browser')).toBeInTheDocument();
  expect(onSelect).toHaveBeenCalledWith({ path: '/current', name: '/current' });
});
```

- [ ] **Step 2: Run the modal browser test and confirm it fails**

Run:

```bash
pnpm vitest run apps/web-pc/src/apps/format-convert/components/__tests__/openlist-browser.test.ts
```

Expected: FAIL because the modal still renders the tree branch in directory mode.

- [ ] **Step 3: Replace the tree/table split inside `OpenlistBrowser`**

Use the shared browser for both modes:

```tsx
<OpenlistTableBrowser
  selectMode={selectMode}
  selectionMode={selectMode === 'dir' ? 'single' : 'single'}
  selectedDirPath={selectedDirPath}
  onDirSelectionChange={setSelectedDirPath}
  onFileSelectionChange={items => {
    const file = items[0];
    if (file) {
      onSelect(file);
    }
  }}
/>
```

Keep the modal footer for directory confirmation, but move all data loading and navigation into `OpenlistTableBrowser`. `cloud-convert-card.tsx` and `media-convert-panel.tsx` should not need API-shape changes beyond the new modal internals.

- [ ] **Step 4: Re-run the modal test and verify it passes**

Run the same command from Step 2.

Expected: PASS with no tree-specific markup left in the modal picker.

- [ ] **Step 5: Commit the modal migration**

```bash
git add \
  apps/web-pc/src/apps/format-convert/components/openlist-browser.tsx \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-browser.test.ts \
  apps/web-pc/src/apps/format-convert/components/cloud-convert-card.tsx \
  apps/web-pc/src/apps/format-convert/components/media-convert-panel.tsx
git commit -m "refactor: reuse openlist table browser in modals"
```

### Task 5: Update i18n copy and run final verification

**Files:**
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] **Step 1: Replace tree-specific copy with browser/table wording**

Update existing keys in place so no component needs duplicate wording:

```json
"formatConvert.cloud.multiSelectDescription": "通过表格浏览器跨目录勾选多个 OpenList 文件",
"formatConvert.cloud.sourceTreeTitle": "OpenList 文件浏览器",
"formatConvert.cloud.sourceTreeHint": "进入目录后勾选文件，勾选结果会进入右侧文件篮子。",
"formatConvert.browser.treeLoading": "正在加载目录列表",
"formatConvert.browser.treeEmpty": "当前目录暂无可选目录"
```

Mirror each change in `packages/i18n/src/locales/en-US/translation.json` and add any new keys needed for parent-directory navigation or pagination labels.

- [ ] **Step 2: Run the focused verification suite**

Run:

```bash
pnpm vitest run \
  apps/api/src/modules/format-convert/service/__tests__/format-convert-openlist.service.test.ts \
  apps/web-pc/src/services/__tests__/format-convert.test.ts \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.tsx \
  apps/web-pc/src/apps/format-convert/components/__tests__/openlist-browser.test.ts
pnpm turbo run typecheck --filter=@volix/api --filter=@volix/web-pc
```

Expected: PASS for the targeted tests and successful typecheck in the touched packages.

- [ ] **Step 3: Commit the copy cleanup and verification-ready state**

```bash
git add \
  packages/i18n/src/locales/zh-CN/translation.json \
  packages/i18n/src/locales/en-US/translation.json
git commit -m "chore: refresh openlist picker copy"
```
