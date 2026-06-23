# AI Translate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone AI translation tool that uses the current user's configured AI account and shows an in-page configuration prompt when no AI account is available.

**Architecture:** Extend the existing user module with a small authenticated translation endpoint that reuses stored AI account config and the shared AI SDK. Add a focused web app page plus route, home card, service call, and localized copy, keeping the missing-config state inside the page instead of redirecting automatically.

**Tech Stack:** Koa, React, React Router, Semi UI, Vitest, shared `@volix/types`, shared i18n resources

---

### Task 1: Add shared API contract and backend route coverage

**Files:**
- Modify: `packages/types/src/api/user.ts`
- Modify: `apps/api/src/modules/user/user.route.ts`
- Create: `test/api/user-ai-translate-route.test.ts`

- [ ] **Step 1: Write the failing route/type test**

```ts
import { describe, expect, it } from 'vitest';

describe('user ai translate route', () => {
  it('registers the authenticated ai translate endpoint', async () => {
    const route = (await import('../../apps/api/src/modules/user/user.route')).default;
    const stack = route.stack.map(item => `${item.methods.join(',')}:${item.path}`);

    expect(stack).toContain('POST:/user/ai/translate');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/api/user-ai-translate-route.test.ts`
Expected: FAIL because `POST:/user/ai/translate` is not registered.

- [ ] **Step 3: Add request/response types and route registration**

```ts
export interface TranslateTextPayload {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslateTextResponse {
  text: string;
}
```

```ts
.post('/ai/translate', http(translateText))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/api/user-ai-translate-route.test.ts`
Expected: PASS.

### Task 2: Add backend translation service and controller behavior

**Files:**
- Create: `apps/api/src/modules/user/service/ai-translate.service.ts`
- Modify: `apps/api/src/modules/user/controller/account-config.controller.ts`
- Modify: `apps/api/src/modules/user/controller/index.ts`
- Test: `test/api/user-ai-translate-controller.test.ts`

- [ ] **Step 1: Write the failing controller tests**

Cover:

```ts
it('rejects missing target language', async () => {
  await expect(translateText(ctx)).rejects.toThrow();
});

it('rejects missing ai config', async () => {
  mocked.createUserAiSdk.mockRejectedValue(new Error('AI account not configured'));
  await expect(translateText(ctx)).rejects.toThrow();
});

it('returns translated text from the sdk response', async () => {
  mocked.chat.mockResolvedValue('Hello');
  await expect(translateText(ctx)).resolves.toEqual({ text: 'Hello' });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run test/api/user-ai-translate-controller.test.ts`
Expected: FAIL because `translateText` does not exist yet.

- [ ] **Step 3: Implement minimal translation service and controller**

Service shape:

```ts
export async function translateUserText(
  userId: string | number,
  payload: TranslateTextPayload
): Promise<TranslateTextResponse> {
  const text = String(payload.text || '').trim();
  const sourceLanguage = String(payload.sourceLanguage || 'auto').trim() || 'auto';
  const targetLanguage = String(payload.targetLanguage || '').trim();

  if (!text) {
    badRequest(t('aiTranslate.validation.textRequired'));
  }
  if (!targetLanguage) {
    badRequest(t('aiTranslate.validation.targetLanguageRequired'));
  }

  const { sdk } = await createUserAiSdk(userId);
  const translated = await sdk.chat([
    { role: 'system', content: '...' },
    { role: 'user', content: `Source language: ${sourceLanguage}\nTarget language: ${targetLanguage}\nText:\n${text}` },
  ]);

  if (!translated.trim()) {
    badRequest(t('aiTranslate.error.emptyResult'));
  }

  return { text: translated.trim() };
}
```

Controller shape:

```ts
export const translateText: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  return translateUserText(userId, (ctx.request.body || {}) as TranslateTextPayload);
};
```

- [ ] **Step 4: Run controller tests to verify they pass**

Run: `pnpm vitest run test/api/user-ai-translate-controller.test.ts`
Expected: PASS.

### Task 3: Add frontend service call coverage

**Files:**
- Modify: `apps/web-pc/src/services/user.ts`
- Create: `apps/web-pc/src/services/__tests__/ai-translate.test.ts`

- [ ] **Step 1: Write the failing service test**

```ts
it('posts translation payload to the ai translate endpoint', async () => {
  await translateText({
    text: '你好',
    sourceLanguage: 'zh-CN',
    targetLanguage: 'en-US',
  });

  expect(mocked.http.post).toHaveBeenCalledWith('/user/ai/translate', {
    text: '你好',
    sourceLanguage: 'zh-CN',
    targetLanguage: 'en-US',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web-pc/src/services/__tests__/ai-translate.test.ts`
Expected: FAIL because the service function does not exist.

- [ ] **Step 3: Add frontend API helper**

```ts
export const translateText = (data: TranslateTextPayload) => {
  return http.post<TranslateTextResponse>('/user/ai/translate', data);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web-pc/src/services/__tests__/ai-translate.test.ts`
Expected: PASS.

### Task 4: Add home card and translation page prompt state

**Files:**
- Modify: `apps/web-pc/src/apps/home/index.tsx`
- Modify: `apps/web-pc/src/layouts/router.tsx`
- Create: `apps/web-pc/src/apps/ai-translate/index.tsx`
- Create: `apps/web-pc/src/apps/ai-translate/languages.ts`
- Create: `apps/web-pc/src/apps/ai-translate/__tests__/home-card.test.ts`
- Create: `apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`

- [ ] **Step 1: Write the failing home/page tests**

Cover:

```ts
expect(markup).toContain('home.card.aiTranslate.title');
expect(markup).toContain('/ai-translate');
```

```ts
expect(container.textContent).toContain('aiTranslate.config.title');
expect(mocked.navigate).toHaveBeenCalledWith('/setting/config/account');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run apps/web-pc/src/apps/ai-translate/__tests__/home-card.test.ts apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`
Expected: FAIL because the new card/page does not exist.

- [ ] **Step 3: Add the page, route, and missing-config prompt**

Implement:

- home card linking to `/ai-translate`
- route metadata for the new page
- page load that fetches account configs
- prompt state with a manual navigation button to `/setting/config/account`

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run apps/web-pc/src/apps/ai-translate/__tests__/home-card.test.ts apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`
Expected: PASS.

### Task 5: Add translation submit flow and localized copy

**Files:**
- Modify: `apps/web-pc/src/apps/ai-translate/index.tsx`
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`
- Test: `apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`

- [ ] **Step 1: Extend the page test with a failing successful-translation case**

```ts
expect(mocked.translateText).toHaveBeenCalledWith({
  text: '你好',
  sourceLanguage: 'zh-CN',
  targetLanguage: 'en-US',
});
expect(container.textContent).toContain('Hello');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`
Expected: FAIL because submit flow/result rendering is not implemented yet.

- [ ] **Step 3: Implement the translation form and i18n messages**

Implement:

- source text textarea
- source/target language selects
- translate button
- result panel
- loading/error handling
- all new copy under `aiTranslate.*`, `home.card.aiTranslate.*`, and `route.aiTranslate.*`

- [ ] **Step 4: Run page test to verify it passes**

Run: `pnpm vitest run apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`
Expected: PASS.

### Task 6: Run focused verification for the feature

**Files:**
- No code changes required unless verification exposes issues.

- [ ] **Step 1: Run backend tests**

Run: `pnpm vitest run test/api/user-ai-translate-route.test.ts test/api/user-ai-translate-controller.test.ts`
Expected: PASS.

- [ ] **Step 2: Run frontend tests**

Run: `pnpm vitest run apps/web-pc/src/services/__tests__/ai-translate.test.ts apps/web-pc/src/apps/ai-translate/__tests__/home-card.test.ts apps/web-pc/src/apps/ai-translate/__tests__/page.test.ts`
Expected: PASS.

- [ ] **Step 3: Run a broader safety check**

Run: `pnpm vitest run apps/web-pc/src/services/__tests__/format-convert.test.ts test/api/format-convert-controller.test.ts`
Expected: PASS, confirming nearby service/route patterns still work.
