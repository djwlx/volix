# OpenList Browser Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the OpenList browser path and directory names navigable with Semi link styling, replace the type column with a size column, and keep long labels usable with truncation plus hover disclosure.

**Architecture:** Keep `OpenlistTableBrowser` as the single owner of browse state and reuse its existing `load({ path, page })` flow for breadcrumb jumps, directory entry, refresh, and back navigation. Add small local helpers for breadcrumb data and size formatting, extend the existing table test file first, and keep styling changes inside `workbench.module.scss`.

**Tech Stack:** React 18, TypeScript, Semi Design `Typography` and `Table`, SCSS modules, Vitest with jsdom

---

### Task 1: Lock the New Browser Behavior in Tests

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.ts`

- [ ] **Step 1: Add the new i18n mock and failing assertions**

Update the translation mock and add focused coverage for breadcrumb navigation, link-styled directory names, and the size column.

```ts
          'formatConvert.browser.size': '大小',
```

```ts
  it('jumps to an ancestor when a current path segment is clicked', async () => {
    mocked.browseFormatConvertOpenlist
      .mockResolvedValueOnce({
        data: {
          path: '/movies/series/season-1',
          page: 1,
          perPage: 20,
          total: 1,
          content: [{ name: 'episode-01.mp4', path: '/movies/series/season-1/episode-01.mp4', isDir: false, size: 2048 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          path: '/movies',
          page: 1,
          perPage: 20,
          total: 1,
          content: [{ name: 'series', path: '/movies/series', isDir: true, size: 0 }],
        },
      });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    await act(async () => {
      document.querySelector<HTMLSpanElement>('[data-path-segment=\"/movies\"]')?.click();
    });

    expect(mocked.browseFormatConvertOpenlist).toHaveBeenLastCalledWith({
      path: '/movies',
      page: 1,
      perPage: 20,
    });
  });
```

```ts
  it('renders directory names as clickable links and files with formatted sizes', async () => {
    mocked.browseFormatConvertOpenlist.mockResolvedValue({
      data: {
        path: '/movies',
        page: 1,
        perPage: 20,
        total: 2,
        content: [
          { name: 'series', path: '/movies/series', isDir: true, size: 0 },
          { name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 1536 },
        ],
      },
    });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    const directoryLink = document.querySelector<HTMLElement>('[data-dir-link=\"/movies/series\"]');
    const fileSize = document.querySelector<HTMLElement>('[data-size-cell=\"/movies/demo.mp4\"]');
    const dirSize = document.querySelector<HTMLElement>('[data-size-cell=\"/movies/series\"]');

    expect(directoryLink).not.toBeNull();
    expect(directoryLink?.getAttribute('title')).toBe('series');
    expect(fileSize?.textContent).toBe('1.5 KiB');
    expect(dirSize?.textContent).toBe('');
  });
```

- [ ] **Step 2: Run the focused test file and verify it fails for the expected reasons**

Run:

```bash
pnpm test -- apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.ts
```

Expected: `FAIL` because the component does not yet render clickable path segments, does not expose directory links, and still renders the old type column.

- [ ] **Step 3: Confirm the existing tests still describe the preserved behavior**

Keep the existing cases for paging, stale request protection, single-select preference, and directory-only mode unchanged so the new work stays additive.

```ts
  it('reloads the current path when the page changes', async () => {
    // unchanged existing pagination behavior
  });
```

- [ ] **Step 4: Commit the red test change**

```bash
git add apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.ts
git commit -m "test: cover openlist browser breadcrumb navigation"
```

### Task 2: Implement Breadcrumb Navigation and the Size Column

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/openlist-table-browser.tsx`

- [ ] **Step 1: Add focused helpers for path segments and file size formatting**

Add local helpers above `OpenlistTableBrowser` so the rendering code stays compact.

```ts
const getPathSegments = (targetPath: string) => {
  const segments = targetPath.split('/').filter(Boolean);
  const items = [{ label: '/', path: '/' }];

  segments.forEach((segment, index) => {
    items.push({
      label: segment,
      path: `/${segments.slice(0, index + 1).join('/')}`,
    });
  });

  return items;
};

const formatFileSize = (size?: number) => {
  if (typeof size !== 'number' || Number.isNaN(size) || size < 0) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let value = size;
  let unitIndex = -1;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const display = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${display} ${units[unitIndex]}`;
};
```

- [ ] **Step 2: Replace the current path text with clickable Semi link segments**

Render the current path as a one-line sequence of `Typography.Text` links that call `load({ path, page: 1 })`.

```tsx
          <div className={styles.browserPathValue} title={displayPath}>
            {getPathSegments(displayPath).map((segment, index) => (
              <span key={segment.path} className={styles.browserPathSegmentWrap}>
                {index ? <span className={styles.browserPathSeparator}>/</span> : null}
                <Typography.Text
                  className={styles.browserPathSegment}
                  data-path-segment={segment.path}
                  ellipsis={{ showTooltip: true }}
                  link={!disabled}
                  onClick={disabled ? undefined : () => void load({ path: segment.path, page: 1 })}
                >
                  {segment.label}
                </Typography.Text>
              </span>
            ))}
          </div>
```

Use a local `displayPath` variable:

```ts
  const displayPath = selectMode === 'dir' ? selectedDirPath || currentBrowsePath : currentBrowsePath;
```

- [ ] **Step 3: Render directory names as links and file names as truncated text**

Update the name column to use `Typography.Text link` for directories and `Typography.Text` for files.

```tsx
      render: (_text, record) =>
        record.isDir ? (
          <Typography.Text
            className={styles.browserNameLink}
            data-dir-link={record.path}
            ellipsis={{ showTooltip: true }}
            link={!disabled}
            title={record.name}
            onClick={disabled ? undefined : () => void load({ path: record.path, page: 1 })}
          >
            {record.name}
          </Typography.Text>
        ) : (
          <Typography.Text
            className={styles.browserNameText}
            ellipsis={{ showTooltip: true }}
            title={record.name}
          >
            {record.name}
          </Typography.Text>
        ),
```

- [ ] **Step 4: Replace the type column with a size column**

Use the OpenList `size` field, leaving directories blank.

```tsx
    {
      title: t('formatConvert.browser.size'),
      dataIndex: 'size',
      render: (_text, record) => (
        <span className={styles.browserSizeCell} data-size-cell={record.path}>
          {record.isDir ? '' : formatFileSize(record.size)}
        </span>
      ),
    },
```

- [ ] **Step 5: Run the focused test file and verify it passes**

Run:

```bash
pnpm test -- apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.ts
```

Expected: `PASS` for the new breadcrumb and size assertions, with the existing paging and selection cases still green.

- [ ] **Step 6: Commit the component change**

```bash
git add apps/web-pc/src/apps/format-convert/components/openlist-table-browser.tsx
git commit -m "feat: improve openlist browser navigation"
```

### Task 3: Align Styling and i18n With the New UI Copy

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/workbench.module.scss`
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] **Step 1: Add the new browser translation keys**

Replace the old column title and add a root label for the breadcrumb.

```json
  "formatConvert.browser.size": "大小",
```

```json
  "formatConvert.browser.size": "Size",
```

- [ ] **Step 2: Replace the old path wrapping styles with truncation-friendly layout**

Update the SCSS so the breadcrumb stays on one line and names truncate cleanly inside the table.

```scss
.browserPathValue {
  margin-top: 4px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12px;
  line-height: 18px;
  color: var(--semi-color-text-2);
}

.browserPathSegmentWrap {
  min-width: 0;
  display: inline-flex;
  align-items: center;
}

.browserPathSegment,
.browserNameLink,
.browserNameText {
  min-width: 0;
  max-width: 100%;
}

.browserSizeCell {
  color: var(--semi-color-text-2);
}
```

- [ ] **Step 3: Verify the focused browser tests still pass after the style and copy changes**

Run:

```bash
pnpm test -- apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.ts
```

Expected: `PASS` with no new test changes required.

- [ ] **Step 4: Run the guardrail checks for this surface**

Run:

```bash
pnpm test -- apps/web-pc/src/apps/format-convert/components/__tests__/openlist-browser.test.ts
pnpm test -- apps/web-pc/src/apps/format-convert/components/__tests__/cloud-source-tree.test.ts
pnpm test -- apps/web-pc/src/apps/format-convert/components/__tests__/openlist-table-browser.test.ts
```

Expected: all three focused files `PASS`.

- [ ] **Step 5: Commit the styling and i18n updates**

```bash
git add apps/web-pc/src/apps/format-convert/components/workbench.module.scss packages/i18n/src/locales/zh-CN/translation.json packages/i18n/src/locales/en-US/translation.json
git commit -m "chore: align openlist browser copy and styles"
```
