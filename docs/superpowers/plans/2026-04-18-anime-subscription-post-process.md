# Anime Subscription Post-Process Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collection-aware anime matching and switch anime subscription post-download handling to `copy -> AI organize -> notify`.

**Architecture:** Keep the existing anime subscription pipeline, but extend the matcher with a lightweight `matchKind` classification so collection-like torrents can enter the download flow without fake episode numbers. After qBittorrent completion, replace the current “organize means done” path with a small post-process orchestrator that copies into the series root, invokes the existing OpenList AI organizer against that series directory, and only then sends the success email.

**Tech Stack:** TypeScript, Sequelize models/services, existing anime subscription services, existing OpenList AI organizer services, Vitest.

---

### Task 1: Add collection-aware matcher output

**Files:**
- Modify: `apps/api/src/modules/anime-subscription/service/anime-matcher.service.ts`
- Modify: `apps/api/src/modules/anime-subscription/types/anime-subscription.types.ts`
- Test: `test/api/anime-matcher.test.ts`

- [ ] **Step 1: Write the failing matcher tests**

```ts
import { describe, expect, test } from 'vitest';
import { matchAnimeRssItem } from '../../apps/api/src/modules/anime-subscription/service/anime-matcher.service';

describe('anime matcher collection support', () => {
  const context = {
    name: 'My Anime',
    aliases: ['我的番'],
    matchKeywords: [],
    useAi: false,
  };

  test('marks normal episodes as episode matches', async () => {
    const result = await matchAnimeRssItem(context, {
      title: '[Group] My Anime - 03 [1080p]',
      description: '',
    });

    expect(result.matched).toBe(true);
    expect(result.matchKind).toBe('episode');
    expect(result.episode).toBe(3);
  });

  test('marks complete packs as collection matches without forcing episode', async () => {
    const result = await matchAnimeRssItem(context, {
      title: '[Group] My Anime Season Pack Complete [1080p]',
      description: '',
    });

    expect(result.matched).toBe(true);
    expect(result.matchKind).toBe('collection');
    expect(result.episode ?? null).toBeNull();
  });

  test('does not match unrelated collection keywords', async () => {
    const result = await matchAnimeRssItem(context, {
      title: '[Group] Other Anime Complete [1080p]',
      description: '',
    });

    expect(result.matched).toBe(false);
  });
});
```

- [ ] **Step 2: Run the matcher test to verify it fails**

Run: `pnpm exec vitest run test/api/anime-matcher.test.ts`
Expected: FAIL because `matchKind` is not part of the result yet and the collection case still falls through the old logic.

- [ ] **Step 3: Add the minimal matcher changes**

```ts
// apps/api/src/modules/anime-subscription/service/anime-matcher.service.ts
export interface AnimeMatchResult {
  matched: boolean;
  normalizedSeriesName: string;
  season?: number | null;
  episode?: number | null;
  subtitleLanguage: string;
  resolution: string;
  confidence: number;
  releaseGroup: string;
  reason: string;
  matchKind?: 'episode' | 'collection';
}

const COLLECTION_KEYWORD_PATTERN =
  /\b(season\s*pack|complete|合集|全集|全\d+话|fin(?:al)?|bd\s*box)\b/i;

const detectMatchKind = (title: string, parsedEpisode: ParsedSeasonEpisode) => {
  if (parsedEpisode.episode) {
    return 'episode' as const;
  }
  return COLLECTION_KEYWORD_PATTERN.test(title) ? ('collection' as const) : ('episode' as const);
};

const runRuleMatch = (context: AnimeMatchContext, input: AnimeMatchInput): AnimeMatchResult => {
  // keep existing matching logic...
  const matchKind = detectMatchKind(input.title, seasonEpisode);

  return {
    matched: Boolean(matchedCandidate),
    normalizedSeriesName: context.name,
    season: inferredSeason,
    episode: matchKind === 'collection' ? null : seasonEpisode.episode,
    subtitleLanguage,
    resolution,
    confidence: matchedCandidate ? 0.9 : 0.2,
    releaseGroup: detectReleaseGroup(input.title),
    reason: matchedCandidate
      ? matchedCandidate.seasonHint && seasonEpisode.seasonSource !== 'explicit'
        ? `规则命中：${matchedCandidate.raw}，按别名季数映射为 S${String(matchedCandidate.seasonHint).padStart(2, '0')}`
        : `规则命中：${matchedCandidate.raw}`
      : '规则未命中',
    matchKind,
  };
};

const normalizeAiMatchResult = (
  context: AnimeMatchContext,
  input: AnimeMatchInput,
  raw: Partial<AnimeMatchResult> | null | undefined
): AnimeMatchResult => {
  const base = runRuleMatch(context, input);

  return {
    matched: raw?.matched === true,
    normalizedSeriesName: String(raw?.normalizedSeriesName || context.name).trim() || context.name,
    season: Number.isFinite(Number(raw?.season)) ? Number(raw?.season) : base.season,
    episode:
      String(raw?.matchKind || base.matchKind) === 'collection'
        ? null
        : Number.isFinite(Number(raw?.episode))
          ? Number(raw?.episode)
          : base.episode,
    subtitleLanguage: String(raw?.subtitleLanguage || base.subtitleLanguage || '').trim(),
    resolution: String(raw?.resolution || base.resolution || '').trim(),
    confidence: Number.isFinite(Number(raw?.confidence)) ? Math.max(0, Math.min(1, Number(raw?.confidence))) : base.confidence,
    releaseGroup: base.releaseGroup,
    reason: String(raw?.reason || 'AI 判定').trim(),
    matchKind: raw?.matchKind === 'collection' || base.matchKind === 'collection' ? 'collection' : 'episode',
  };
};

export const matchAnimeRssItem = async (
  context: AnimeMatchContext,
  input: AnimeMatchInput
): Promise<AnimeMatchResult> => {
  const ruleResult = runRuleMatch(context, input);
  if (ruleResult.matched && (ruleResult.episode || ruleResult.matchKind === 'collection')) {
    return ruleResult;
  }
  // keep the existing AI fallback...
  return ruleResult;
};
```

- [ ] **Step 4: Run the matcher test to verify it passes**

Run: `pnpm exec vitest run test/api/anime-matcher.test.ts`
Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/anime-subscription/service/anime-matcher.service.ts \
  apps/api/src/modules/anime-subscription/types/anime-subscription.types.ts \
  test/api/anime-matcher.test.ts
git commit -m "feat: classify anime collection matches"
```

### Task 2: Let collection candidates enter the download selection flow

**Files:**
- Modify: `apps/api/src/modules/anime-subscription/service/anime-subscription.service.ts`
- Modify: `apps/api/src/modules/anime-subscription/service/anime-download.service.ts`
- Test: `test/api/anime-subscription-selection.test.ts`

- [ ] **Step 1: Write the failing candidate-selection test**

```ts
import { describe, expect, test } from 'vitest';
import { buildAnimeDownloadSelectionForTest } from '../../apps/api/src/modules/anime-subscription/service/anime-subscription.service';

describe('anime subscription candidate selection', () => {
  test('keeps collection candidates when episode is missing', () => {
    const result = buildAnimeDownloadSelectionForTest([
      {
        rss_guid: 'pack-1',
        rss_title: 'My Anime Complete',
        season: 1,
        episode: null,
        matchKind: 'collection',
        subtitle_language: 'zh',
        score: 10,
      },
    ]);

    expect(result.groupedKeys).toEqual(['collection:pack-1']);
  });
});
```

- [ ] **Step 2: Run the selection test to verify it fails**

Run: `pnpm exec vitest run test/api/anime-subscription-selection.test.ts`
Expected: FAIL because the current grouping drops items without an episode key.

- [ ] **Step 3: Implement minimal grouping changes**

```ts
// apps/api/src/modules/anime-subscription/service/anime-subscription.service.ts
const getDownloadCandidateGroupKey = (item: {
  rss_guid?: string;
  season?: number | null;
  episode?: number | null;
  matchKind?: 'episode' | 'collection';
}) => {
  if (item.matchKind === 'collection') {
    return `collection:${String(item.rss_guid || '').trim()}`;
  }
  return getEpisodeKey(item.season, item.episode);
};

export const buildAnimeDownloadSelectionForTest = (processedCandidates: Array<{
  rss_guid?: string;
  season?: number | null;
  episode?: number | null;
  matchKind?: 'episode' | 'collection';
}>) => {
  const grouped = processedCandidates.reduce<Record<string, typeof processedCandidates>>((acc, item) => {
    const key = getDownloadCandidateGroupKey(item);
    if (!key) {
      return acc;
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  return {
    grouped,
    groupedKeys: Object.keys(grouped),
  };
};

// replace the in-function reduce with buildAnimeDownloadSelectionForTest(processedCandidates).grouped
```

```ts
// apps/api/src/modules/anime-subscription/service/anime-download.service.ts
interface DownloadCandidate {
  // keep existing fields...
  matchKind?: 'episode' | 'collection';
}
```

- [ ] **Step 4: Run the selection test to verify it passes**

Run: `pnpm exec vitest run test/api/anime-subscription-selection.test.ts`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/anime-subscription/service/anime-subscription.service.ts \
  apps/api/src/modules/anime-subscription/service/anime-download.service.ts \
  test/api/anime-subscription-selection.test.ts
git commit -m "feat: allow anime collection candidates into download selection"
```

### Task 3: Split post-download handling into copy and AI organize stages

**Files:**
- Create: `apps/api/src/modules/anime-subscription/service/anime-post-process.service.ts`
- Modify: `apps/api/src/modules/anime-subscription/service/anime-organizer.service.ts`
- Modify: `apps/api/src/modules/anime-subscription/service/anime-download.service.ts`
- Test: `test/api/anime-post-process.test.ts`

- [ ] **Step 1: Write the failing post-process tests**

```ts
import { describe, expect, test, vi } from 'vitest';
import { runAnimePostProcess } from '../../apps/api/src/modules/anime-subscription/service/anime-post-process.service';

vi.mock('../../apps/api/src/modules/anime-subscription/service/anime-organizer.service', () => ({
  copyDownloadedAnimeToLibrary: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer.service', () => ({
  organizeOpenlistPathForAnimeLibrary: vi.fn(),
}));

describe('anime post process', () => {
  test('copies single episodes and then invokes AI organizer', async () => {
    const result = await runAnimePostProcess({
      subscription: { id: 1, name: 'My Anime', series_root_path: '/anime/My Anime' } as any,
      item: { id: 1, match_kind: 'episode' } as any,
      torrent: { name: 'My Anime - 03' } as any,
    });

    expect(result.organized).toBe(true);
    expect(result.stage).toBe('ai_organized');
  });

  test('preserves collection source names before AI organizer', async () => {
    const result = await runAnimePostProcess({
      subscription: { id: 1, name: 'My Anime', series_root_path: '/anime/My Anime' } as any,
      item: { id: 2, match_kind: 'collection' } as any,
      torrent: { name: 'My Anime Complete' } as any,
    });

    expect(result.organized).toBe(true);
    expect(result.copyMode).toBe('preserve_source_name');
  });
});
```

- [ ] **Step 2: Run the post-process test to verify it fails**

Run: `pnpm exec vitest run test/api/anime-post-process.test.ts`
Expected: FAIL because `anime-post-process.service.ts` and the new copy/organize APIs do not exist yet.

- [ ] **Step 3: Implement minimal copy + AI organize orchestration**

```ts
// apps/api/src/modules/anime-subscription/service/anime-organizer.service.ts
export const copyDownloadedAnimeToLibrary = async (
  subscription: AnimeSubscriptionEntity,
  item: AnimeSubscriptionItemEntity,
  torrent: QbittorrentTorrentInfo
) => {
  const source = await findMediaEntry(/* keep existing lookup logic */);
  if (!source) {
    return {
      copied: false,
      reason: '未在 OpenList 可见下载目录中找到已完成文件',
    };
  }

  const useSourceName = item.match_kind === 'collection';
  const target = useSourceName
    ? {
        targetPath: path.posix.join(subscription.series_root_path, source.srcName),
        targetDir: subscription.series_root_path,
        targetName: source.srcName,
      }
    : getTargetParts(subscription, item, source.srcName);

  await ensureOpenlistDirExists(sdk, target.targetDir);
  await sdk.copy({
    srcDir: source.srcDir,
    dstDir: target.targetDir,
    names: [source.srcName],
  });

  if (!useSourceName && source.srcName !== target.targetName) {
    await sdk.rename({
      path: path.posix.join(target.targetDir, source.srcName),
      name: target.targetName,
    });
  }

  return {
    copied: true,
    targetPath: target.targetPath,
    copyMode: useSourceName ? 'preserve_source_name' : 'rename_to_target',
  };
};
```

```ts
// apps/api/src/modules/anime-subscription/service/anime-post-process.service.ts
import { copyDownloadedAnimeToLibrary } from './anime-organizer.service';
import { logAnimeError, logAnimeEvent } from './anime-log.service';
import { runOpenlistAnimeLibraryOrganize } from '../../openlist-ai-organizer/service/openlist-ai-organizer.service';

export const runAnimePostProcess = async (params: {
  subscription: AnimeSubscriptionEntity;
  item: AnimeSubscriptionItemEntity;
  torrent: QbittorrentTorrentInfo;
}) => {
  const subscriptionId = params.subscription.id as string | number;
  logAnimeEvent(subscriptionId, 'post_process_copy_start', { itemId: params.item.id, qbitHash: params.item.qbit_hash });

  const copied = await copyDownloadedAnimeToLibrary(params.subscription, params.item, params.torrent);
  if (!copied.copied) {
    return {
      organized: false,
      reason: copied.reason,
      stage: 'copy_skipped' as const,
    };
  }

  logAnimeEvent(subscriptionId, 'post_process_copy_success', {
    itemId: params.item.id,
    targetPath: copied.targetPath,
    copyMode: copied.copyMode,
  });

  try {
    logAnimeEvent(subscriptionId, 'post_process_ai_organize_start', {
      itemId: params.item.id,
      rootPath: params.subscription.series_root_path,
    });
    await runOpenlistAnimeLibraryOrganize(params.subscription.series_root_path);
    logAnimeEvent(subscriptionId, 'post_process_ai_organize_success', {
      itemId: params.item.id,
      rootPath: params.subscription.series_root_path,
    });
    return {
      organized: true,
      stage: 'ai_organized' as const,
      targetPath: copied.targetPath,
      copyMode: copied.copyMode,
    };
  } catch (error) {
    logAnimeError(subscriptionId, 'post_process_ai_organize_error', error, {
      itemId: params.item.id,
      rootPath: params.subscription.series_root_path,
    });
    throw error;
  }
};
```

- [ ] **Step 4: Wire the new orchestrator into download sync and rerun tests**

```ts
// apps/api/src/modules/anime-subscription/service/anime-download.service.ts
import { runAnimePostProcess } from './anime-post-process.service';

// replace the existing organizeDownloadedAnime(...) block with:
const organized = await runAnimePostProcess({ subscription, item, torrent });
if (organized.organized) {
  const targetPath = String(organized.targetPath || '').trim();
  organizedCount += 1;
  await updateAnimeSubscriptionItem(item.id as string | number, {
    decision_status: AnimeSubscriptionItemStatus.ORGANIZED,
    target_path: targetPath,
    reason: 'organized',
  });
  logAnimeEvent(subscription.id as string | number, 'organize_success', {
    itemId: item.id,
    qbitHash: item.qbit_hash,
    targetPath,
    stage: organized.stage,
    copyMode: organized.copyMode,
  });
} else {
  await updateAnimeSubscriptionItem(item.id as string | number, {
    reason: organized.reason,
  });
  logAnimeEvent(subscription.id as string | number, 'organize_skip', {
    itemId: item.id,
    qbitHash: item.qbit_hash,
    reason: organized.reason,
  });
}
```

Run: `pnpm exec vitest run test/api/anime-post-process.test.ts`
Expected: PASS with 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/anime-subscription/service/anime-organizer.service.ts \
  apps/api/src/modules/anime-subscription/service/anime-post-process.service.ts \
  apps/api/src/modules/anime-subscription/service/anime-download.service.ts \
  test/api/anime-post-process.test.ts
git commit -m "feat: route anime downloads through ai post process"
```

### Task 4: Send mail only after AI organize succeeds and run end-to-end regression

**Files:**
- Modify: `apps/api/src/modules/anime-subscription/service/anime-download.service.ts`
- Modify: `apps/api/src/modules/anime-subscription/service/anime-log.service.ts`
- Test: `test/api/anime-download-notify.test.ts`
- Test: `test/api/anime-post-process.test.ts`
- Test: `test/api/anime-matcher.test.ts`
- Test: `test/api/anime-subscription-selection.test.ts`

- [ ] **Step 1: Write the failing notification timing test**

```ts
import { describe, expect, test, vi } from 'vitest';
import { syncAnimeDownloadStatus } from '../../apps/api/src/modules/anime-subscription/service/anime-download.service';

describe('anime organized mail notification', () => {
  test('sends mail only after ai organize succeeds', async () => {
    const sendMail = vi.fn();
    const runPostProcess = vi.fn().mockResolvedValue({
      organized: true,
      stage: 'ai_organized',
      targetPath: '/anime/My Anime/E03.mkv',
    });

    // inject mocks with vi.mock(...) in the real test file

    await syncAnimeDownloadStatus({ id: 1, name: 'My Anime' } as any);

    expect(runPostProcess).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the notification test to verify it fails**

Run: `pnpm exec vitest run test/api/anime-download-notify.test.ts`
Expected: FAIL because the mail timing is still coupled to the old organization block or because no dedicated test seam exists yet.

- [ ] **Step 3: Make the notification timing explicit**

```ts
// apps/api/src/modules/anime-subscription/service/anime-download.service.ts
const sendOrganizedNotificationMail = async (
  subscription: AnimeSubscriptionEntity,
  item: AnimeSubscriptionItemEntity,
  targetPath: string
) => {
  // keep current SMTP logic...
  await sendSmtpMail({
    // keep current SMTP fields...
    subject: `Volix 自动追番已复制并整理完成：${subscription.name}`,
    text: [
      `番剧：${subscription.name}`,
      `标题：${item.rss_title}`,
      `目标路径：${targetPath}`,
      '状态：已完成 AI 文件整理',
    ].filter(Boolean).join('\n'),
    html: `
      <div>
        <p>自动追番已复制完成，并已完成 AI 文件整理。</p>
        <p><b>番剧：</b>${subscription.name}</p>
        <p><b>标题：</b>${item.rss_title}</p>
        <p><b>目标路径：</b>${targetPath}</p>
      </div>
    `,
  });
};
```

```ts
// apps/api/src/modules/anime-subscription/service/anime-log.service.ts
const STAGE_LABELS = {
  // keep existing labels...
  post_process_copy_start: '开始复制已下载文件到番剧目录',
  post_process_copy_success: '已复制已下载文件到番剧目录',
  post_process_ai_organize_start: '开始执行 AI 文件整理',
  post_process_ai_organize_success: 'AI 文件整理完成',
  post_process_ai_organize_error: 'AI 文件整理失败',
} as const;
```

- [ ] **Step 4: Run the focused tests and final regression**

Run: `pnpm exec vitest run test/api/anime-matcher.test.ts test/api/anime-subscription-selection.test.ts test/api/anime-post-process.test.ts test/api/anime-download-notify.test.ts`
Expected: PASS with all new anime subscription tests green.

Run: `pnpm exec tsc -p apps/api/tsconfig.json --noEmit`
Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/anime-subscription/service/anime-download.service.ts \
  apps/api/src/modules/anime-subscription/service/anime-log.service.ts \
  test/api/anime-download-notify.test.ts \
  test/api/anime-post-process.test.ts \
  test/api/anime-matcher.test.ts \
  test/api/anime-subscription-selection.test.ts
git commit -m "feat: notify after anime ai organization completes"
```

## Self-Review

- Spec coverage:
  - 合集识别与放行: Task 1, Task 2
  - `copy -> ai organize -> notify`: Task 3, Task 4
  - 日志与邮件语义调整: Task 3, Task 4
  - 测试覆盖 matcher / post-process / notification: Task 1-4
- Placeholder scan:
  - No `TODO`/`TBD`
  - Each task includes exact files, commands, and minimal code shapes
- Type consistency:
  - `matchKind` is consistently used as `'episode' | 'collection'`
  - post-process stage uses `organized`, `stage`, `targetPath`, `copyMode` consistently
