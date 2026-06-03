# 115 Cloud Image Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable proxy URL so every 115 cloud image URL returned to the frontend can be wrapped by the Cloudflare proxy while local-cache URLs and existing cache warmup behavior stay unchanged.

**Architecture:** Extend the existing random-picture config payload with a validated `cloudProxyUrl` field, then centralize cloud-image URL wrapping in a small picture-service helper. Reuse that helper only at the points that return 115 remote URLs to the client so internal download and cache-fill flows still use the original 115 URL.

**Tech Stack:** TypeScript, Koa, React 18, Semi UI, Vitest

---

### Task 1: Lock the config contract with failing tests

**Files:**
- Modify: `test/api/115-random-cache-config.test.ts`
- Reference: `apps/api/src/modules/115/service/picture/picture-cache-random-core.ts`
- Reference: `packages/types/src/api/115.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'vitest';

describe('115 random cache config', () => {
  test('keeps cloudProxyUrl when it is a valid http url', async () => {
    const { parseRandomCacheConfig } = await import(
      '../../apps/api/src/modules/115/service/picture/picture-cache-random-core'
    );

    const result = parseRandomCacheConfig(
      JSON.stringify({
        sourceWeights: { local: 20, cloud: 80 },
        localMaxSizeMb: 4096,
        randomNoRepeatWindowMinutes: 12,
        randomNoRepeatMaxCount: 345,
        cloudProxyUrl: 'https://proxy.example.com/proxy',
      })
    );

    expect(result.cloudProxyUrl).toBe('https://proxy.example.com/proxy');
  });

  test('normalizes blank cloudProxyUrl to empty string', async () => {
    const { parseRandomCacheConfig } = await import(
      '../../apps/api/src/modules/115/service/picture/picture-cache-random-core'
    );

    const result = parseRandomCacheConfig(
      JSON.stringify({
        cloudProxyUrl: '   ',
      })
    );

    expect(result.cloudProxyUrl).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-random-cache-config.test.ts`
Expected: FAIL because `cloudProxyUrl` is missing from the normalized config.

- [ ] **Step 3: Write minimal implementation**

```ts
export const DEFAULT_RANDOM_CACHE_CONFIG: PicRandomCacheConfig = {
  sourceWeights: { memory: 0, local: 50, cloud: 50 },
  memoryMaxSizeMb: 100,
  localMaxSizeMb: 2048,
  randomNoRepeatWindowMinutes: 5,
  randomNoRepeatMaxCount: 50,
  cloudProxyUrl: '',
};

const normalizeCloudProxyUrl = (value: unknown) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw;
};

return {
  sourceWeights: normalizedWeights,
  memoryMaxSizeMb: ...,
  localMaxSizeMb: ...,
  randomNoRepeatWindowMinutes: ...,
  randomNoRepeatMaxCount: ...,
  cloudProxyUrl: normalizeCloudProxyUrl(safeInput?.cloudProxyUrl),
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-random-cache-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/api/115-random-cache-config.test.ts apps/api/src/modules/115/service/picture/picture-cache-random-core.ts packages/types/src/api/115.ts apps/api/src/modules/115/types/115.types.ts
git commit -m "test: cover 115 cloud proxy config parsing"
```

### Task 2: Add failing service tests for proxy wrapping

**Files:**
- Modify: `test/api/115-picture.service.test.ts`
- Reference: `apps/api/src/modules/115/service/picture/picture-cache-random-meta-queue.ts`
- Reference: `apps/api/src/modules/115/service/picture/api-liked.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test('getRandom115PicMeta wraps 115 cloud urls with the configured proxy', async () => {
  getConfigMock.mockResolvedValue({
    picture_115_folders: JSON.stringify([{ cid: 'root', status: 'cached' }]),
    picture_115_random_weights: JSON.stringify({
      sourceWeights: { local: 0, cloud: 100 },
      localMaxSizeMb: 2048,
      randomNoRepeatWindowMinutes: 5,
      randomNoRepeatMaxCount: 50,
      cloudProxyUrl: 'https://proxy.example.com/proxy',
    }),
  });
  getFile115RandomByCidListExcludePcMock.mockResolvedValue({
    cid: 'root',
    parentCid: 'folder-a',
    pc: 'pc-1',
    fullPath: '/Root/Album A/01.jpg',
    isLiked: false,
    localCacheFileName: '',
  });
  get115FileDataMock.mockResolvedValue({
    info: {
      url: { url: 'https://img.115.com/01.jpg' },
      file_name: '01.jpg',
    },
  });

  const { getRandom115PicMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
  const result = await getRandom115PicMeta('test-agent');

  expect(result.url).toBe('https://proxy.example.com/proxy?url=https%3A%2F%2Fimg.115.com%2F01.jpg');
});

test('get115PicCacheFileByPcData wraps remote fallback urls and still prewarms local cache', async () => {
  getConfigMock.mockResolvedValue({
    picture_115_random_weights: JSON.stringify({
      cloudProxyUrl: 'https://proxy.example.com/proxy',
    }),
  });
  getFile115ByPcMock.mockResolvedValue({
    cid: 'root',
    parentCid: 'folder-a',
    pc: 'pc-1',
    fullPath: '/Root/Album A/01.jpg',
    isLiked: true,
    localCacheFileName: '',
  });
  get115FileDataMock.mockResolvedValue({
    info: {
      url: { url: 'https://img.115.com/01.jpg' },
      file_name: '01.jpg',
    },
  });

  const { get115PicCacheFileByPcData } = await import('../../apps/api/src/modules/115/service/picture.service');
  const result = await get115PicCacheFileByPcData('pc-1', 'test-agent');

  expect(result.kind).toBe('remote');
  expect(result.url).toBe('https://proxy.example.com/proxy?url=https%3A%2F%2Fimg.115.com%2F01.jpg');
  expect(ensureLocalPicCacheByFileAsyncMock).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: FAIL because remote URLs are still returned without proxy wrapping.

- [ ] **Step 3: Write minimal implementation**

```ts
export const buildCloudProxyUrl = (originUrl: string, proxyUrl: string) => {
  const safeOriginUrl = String(originUrl || '').trim();
  const safeProxyUrl = String(proxyUrl || '').trim();
  if (!safeOriginUrl || !safeProxyUrl) {
    return safeOriginUrl;
  }

  const target = new URL(safeProxyUrl);
  target.searchParams.set('url', safeOriginUrl);
  return target.toString();
};

export const resolve115CloudImageUrl = async (originUrl: string) => {
  const config = await getRandomCacheConfig();
  return buildCloudProxyUrl(originUrl, config.cloudProxyUrl);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/api/115-picture.service.test.ts apps/api/src/modules/115/service/picture/picture-cloud-proxy.ts apps/api/src/modules/115/service/picture/picture-cache-random-meta-queue.ts apps/api/src/modules/115/service/picture/api-liked.ts
git commit -m "test: cover 115 cloud proxy url wrapping"
```

### Task 3: Validate and save the proxy config in the API layer

**Files:**
- Modify: `apps/api/src/modules/115/service/picture/picture-cache-random-core.ts`
- Modify: `packages/types/src/api/115.ts`
- Modify: `apps/api/src/modules/115/types/115.types.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('setRandomCacheConfig rejects invalid cloudProxyUrl values', async () => {
  const { setRandomCacheConfig } = await import(
    '../../apps/api/src/modules/115/service/picture/picture-cache-random-core'
  );

  await expect(
    setRandomCacheConfig({
      cloudProxyUrl: 'ftp://proxy.example.com/proxy',
    })
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-random-cache-config.test.ts`
Expected: FAIL because invalid protocols are still accepted.

- [ ] **Step 3: Write minimal implementation**

```ts
const isValidCloudProxyUrl = (value: string) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

if (!isValidCloudProxyUrl(next.cloudProxyUrl)) {
  badRequest(t('pic115Api.invalidCloudProxyUrl'));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-random-cache-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/115/service/picture/picture-cache-random-core.ts test/api/115-random-cache-config.test.ts packages/types/src/api/115.ts apps/api/src/modules/115/types/115.types.ts
git commit -m "feat: validate 115 cloud proxy config"
```

### Task 4: Wire the helper into every 115 remote-image response path

**Files:**
- Create: `apps/api/src/modules/115/service/picture/picture-cloud-proxy.ts`
- Modify: `apps/api/src/modules/115/service/picture/picture-cache-random-meta-queue.ts`
- Modify: `apps/api/src/modules/115/service/picture/api-liked.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('get115RandomPicCacheFileData wraps remote fallback urls with the configured proxy', async () => {
  getConfigMock.mockResolvedValue({
    picture_115_random_weights: JSON.stringify({
      cloudProxyUrl: 'https://proxy.example.com/proxy',
    }),
  });
  getFile115ByPcMock.mockResolvedValue({
    cid: 'root',
    parentCid: 'folder-a',
    pc: 'pc-1',
    fullPath: '/Root/Album A/01.jpg',
    isLiked: false,
    localCacheFileName: '',
  });
  get115FileDataMock.mockResolvedValue({
    info: {
      url: { url: 'https://img.115.com/01.jpg' },
      file_name: '01.jpg',
    },
  });

  const { get115RandomPicCacheFileData } = await import('../../apps/api/src/modules/115/service/picture.service');
  const result = await get115RandomPicCacheFileData('pc-1.01.jpg', 'test-agent');

  expect(result.kind).toBe('remote');
  expect(result.url).toBe('https://proxy.example.com/proxy?url=https%3A%2F%2Fimg.115.com%2F01.jpg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: FAIL because random-cache fallback still exposes the raw 115 URL.

- [ ] **Step 3: Write minimal implementation**

```ts
const buildRemotePicSourceFromFile = async (file: Cloud115DbFileItem, userAgent: string, errorMessageKey: string) => {
  const meta = parse115FileMeta(await get115FileData(file.pc, userAgent || DEFAULT_115_DOWNLOAD_UA));
  if (!meta.url) {
    badRequest(t(errorMessageKey));
  }

  return {
    kind: 'remote' as const,
    pc: file.pc,
    url: await resolve115CloudImageUrl(meta.url),
    fileName: meta.fileName || (file.fullPath ? path.posix.basename(file.fullPath) : DEFAULT_FILE_NAME),
    mimeType: mime.lookup(meta.fileName || '') || DEFAULT_MIME_TYPE,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/115/service/picture/api-liked.ts apps/api/src/modules/115/service/picture/picture-cache-random-meta-queue.ts apps/api/src/modules/115/service/picture/picture-cloud-proxy.ts test/api/115-picture.service.test.ts
git commit -m "feat: proxy 115 cloud image responses"
```

### Task 5: Expose the config in the web settings UI

**Files:**
- Modify: `apps/web-pc/src/apps/115/pic-setting.tsx`
- Modify: `apps/web-pc/src/services/115.ts`
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] **Step 1: Write the failing type-level/UI expectation**

```ts
interface RandomCacheFormValues {
  localWeight: number;
  cloudWeight: number;
  localMaxSizeMb: number;
  randomNoRepeatWindowMinutes: number;
  randomNoRepeatMaxCount: number;
  cloudProxyUrl: string;
}
```

- [ ] **Step 2: Run targeted checks to verify the field is missing**

Run: `pnpm exec tsc -p apps/web-pc/tsconfig.json --noEmit`
Expected: FAIL after adding the field until the form, service payload, and translations are updated consistently.

- [ ] **Step 3: Write minimal implementation**

```tsx
<Form.Input
  field="cloudProxyUrl"
  label={t('pic115.form.cloudProxyUrl')}
  placeholder="https://your-worker.example.com/proxy"
  showClear
  style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
/>;
<Typography.Text type="tertiary">{t('pic115.form.cloudProxyUrlHint')}</Typography.Text>
```

- [ ] **Step 4: Run targeted checks to verify it passes**

Run: `pnpm exec tsc -p apps/web-pc/tsconfig.json --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/115/pic-setting.tsx apps/web-pc/src/services/115.ts packages/i18n/src/locales/zh-CN/translation.json packages/i18n/src/locales/en-US/translation.json packages/types/src/api/115.ts
git commit -m "feat: add 115 cloud proxy setting"
```

### Task 6: Run end-to-end verification for the touched surfaces

**Files:**
- Reference: `test/api/115-random-cache-config.test.ts`
- Reference: `test/api/115-picture.service.test.ts`
- Reference: `apps/web-pc/src/apps/115/pic-setting.tsx`

- [ ] **Step 1: Run backend regression tests**

Run: `pnpm test test/api/115-random-cache-config.test.ts test/api/115-picture.service.test.ts`
Expected: PASS

- [ ] **Step 2: Run frontend type check**

Run: `pnpm exec tsc -p apps/web-pc/tsconfig.json --noEmit`
Expected: PASS

- [ ] **Step 3: Review the diff for accidental overlap with existing user changes**

Run: `git diff -- apps/api/src/modules/115/service/picture/picture-cache-random-core.ts apps/api/src/modules/115/service/picture/picture-cache-random-meta-queue.ts apps/api/src/modules/115/service/picture/api-liked.ts apps/web-pc/src/apps/115/pic-setting.tsx packages/types/src/api/115.ts`
Expected: Only the cloud-proxy config, helper usage, tests, and i18n additions appear.
