# I18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared full-stack i18n system for `zh-CN` and `en-US`, with header-based locale switching in the web app, `volix-language` propagation to the API, and `t({ id, defaultMessage }, params?)` support on both frontend and backend.

**Architecture:** Build a new `packages/i18n` workspace package that owns locale resolution, message descriptor typing, translation lookup, and interpolation. Integrate that runtime into the React app through a provider and HTTP interceptor, and into the Koa API through request-context locale resolution and request-scoped translation helpers.

**Tech Stack:** pnpm workspace, Turbo, TypeScript, tsup, React 18, Vite, Koa, Axios, Vitest

---

## File Structure

### Shared package

- Create: `packages/i18n/package.json` — workspace package manifest with `build`, `dev`, and `typecheck` scripts.
- Create: `packages/i18n/tsconfig.json` — compiler config aligned with `packages/utils`.
- Create: `packages/i18n/src/index.ts` — package exports.
- Create: `packages/i18n/src/locale.ts` — locale constants and resolution helpers.
- Create: `packages/i18n/src/types.ts` — `Locale`, `MessageDescriptor`, and interpolation param types.
- Create: `packages/i18n/src/interpolate.ts` — placeholder interpolation helper.
- Create: `packages/i18n/src/dictionary.ts` — locale dictionaries and lookup helpers.
- Create: `packages/i18n/src/translate.ts` — `translate()` and `createTranslator()` implementations.
- Create: `packages/i18n/src/locales/en-US/common.ts` — English common translations.
- Create: `packages/i18n/src/locales/en-US/auth.ts` — English auth translations.
- Create: `packages/i18n/src/locales/en-US/setting.ts` — English settings translations.
- Create: `packages/i18n/src/locales/en-US/rss.ts` — English RSS translations.
- Create: `packages/i18n/src/locales/en-US/index.ts` — English locale aggregator.
- Create: `packages/i18n/src/translate.test.ts` — runtime tests for locale resolution, translation lookup, and interpolation.

### Frontend integration

- Modify: `apps/web-pc/package.json` — add `@volix/i18n` dependency.
- Modify: `apps/web-pc/src/main.tsx` — wrap the app with the i18n provider.
- Create: `apps/web-pc/src/i18n/provider.tsx` — React provider and hook.
- Create: `apps/web-pc/src/i18n/storage.ts` — browser locale persistence helpers.
- Create: `apps/web-pc/src/i18n/index.ts` — provider exports.
- Modify: `apps/web-pc/src/utils/http.ts` — send `volix-language` on every request.
- Modify: `apps/web-pc/src/utils/error.ts` — use message descriptors for common HTTP fallbacks.
- Modify: `apps/web-pc/src/components/app-header/index.tsx` — add locale `Select` and translate visible labels.
- Modify: `apps/web-pc/src/layouts/router.tsx` — translate route titles, descriptions, and image alt text.
- Modify: `apps/web-pc/src/layouts/app-shell.tsx` — translate loading state if it still owns visible text.
- Modify: `apps/web-pc/src/layouts/error-boundary.tsx` — translate fallback title and description.
- Modify: `apps/web-pc/src/components/loading/index.tsx` — support translated fallback text.
- Modify: `apps/web-pc/src/stores/user-store.ts` — translate auth bootstrap fallback messages.
- Modify: `apps/web-pc/src/apps/auth/index.tsx` — migrate auth page text to `t(...)`.
- Modify: `apps/web-pc/src/apps/setting/index.tsx` — migrate settings shell labels to `t(...)`.
- Modify: `apps/web-pc/src/apps/setting/pages/system/index.tsx` — migrate system settings labels and toasts.
- Modify: `apps/web-pc/src/apps/setting/pages/config/config-rsshub.tsx` — migrate key RSS settings text and toasts.
- Modify: `apps/web-pc/src/apps/setting/pages/config/account-config-form.tsx` — migrate account config text and toasts.
- Modify: `apps/web-pc/src/apps/setting/pages/config/config-smtp.tsx` — migrate SMTP config text and toasts.

### Backend integration

- Modify: `apps/api/package.json` — add `@volix/i18n` dependency.
- Modify: `apps/api/src/utils/request-context.ts` — store request locale and export locale helpers.
- Modify: `apps/api/src/middleware/request-context.ts` — resolve `volix-language` and save it in request context.
- Create: `apps/api/src/utils/i18n.ts` — request-scoped `t()` wrapper.
- Modify: `apps/api/src/utils/response.ts` — localize default success message.
- Modify: `apps/api/src/modules/shared/http-handler.ts` — localize default internal server error message.
- Modify: `apps/api/src/middleware/authenticate.ts` — translate auth errors.
- Modify: `apps/api/src/modules/user/controller/auth.controller.ts` — migrate auth response messages.
- Modify: `apps/api/src/modules/user/controller/user-admin.controller.ts` — migrate user-admin response messages.
- Modify: `apps/api/src/modules/user/controller/system-setting.controller.ts` — migrate admin guard messages.
- Modify: `apps/api/src/modules/user/service/system-setting.service.ts` — migrate validation messages.
- Modify: `apps/api/src/modules/file/controller/file.controller.ts` — migrate file errors.
- Modify: `apps/api/src/modules/sqlite-admin/controller/sqlite-admin.controller.ts` — migrate sqlite-admin auth messages.
- Modify: `apps/api/src/modules/sqlite-admin/service/sqlite-admin.service.ts` — migrate sqlite-admin validation errors.
- Modify: `apps/api/src/modules/rss/controller/rss.controller.ts` — migrate RSS user-facing errors.
- Modify: `apps/api/src/modules/rss/service/rss.service.ts` — migrate RSS validation and workflow errors.
- Modify: `apps/api/src/modules/rss/service/rss-storage.service.ts` — migrate RSS storage status messages that surface to users.

### Workspace and verification

- Modify: `package.json` — add a workspace script for `@volix/i18n` tests if needed.
- Modify: `pnpm-workspace.yaml` — no package list change expected, but verify the new package path is already covered.
- Test: `pnpm --filter @volix/i18n build`
- Test: `pnpm --filter @volix/i18n typecheck`
- Test: `pnpm vitest run packages/i18n/src/translate.test.ts`
- Test: `pnpm --filter @volix/web-pc typecheck`
- Test: `pnpm --filter @volix/api typecheck`

## Task 1: Create the shared i18n workspace package

**Files:**
- Create: `packages/i18n/package.json`
- Create: `packages/i18n/tsconfig.json`
- Create: `packages/i18n/src/index.ts`
- Create: `packages/i18n/src/locale.ts`
- Create: `packages/i18n/src/types.ts`
- Create: `packages/i18n/src/interpolate.ts`
- Create: `packages/i18n/src/dictionary.ts`
- Create: `packages/i18n/src/translate.ts`
- Create: `packages/i18n/src/locales/en-US/common.ts`
- Create: `packages/i18n/src/locales/en-US/auth.ts`
- Create: `packages/i18n/src/locales/en-US/setting.ts`
- Create: `packages/i18n/src/locales/en-US/rss.ts`
- Create: `packages/i18n/src/locales/en-US/index.ts`

- [ ] **Step 1: Write the failing shared runtime test skeleton**

Create `packages/i18n/src/translate.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, resolveLocale } from './locale';
import { translate } from './translate';

describe('resolveLocale', () => {
  it('falls back to zh-CN for unknown input', () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('ja-JP')).toBe(DEFAULT_LOCALE);
  });
});

describe('translate', () => {
  it('returns localized text when the locale entry exists', () => {
    expect(
      translate('en-US', { id: 'common.action.save', defaultMessage: '保存' })
    ).toBe('Save');
  });

  it('falls back to defaultMessage when the locale entry is missing', () => {
    expect(
      translate('en-US', { id: 'missing.message', defaultMessage: '缺省文案' })
    ).toBe('缺省文案');
  });

  it('falls back to message id when defaultMessage is empty', () => {
    expect(
      translate('en-US', { id: 'missing.empty', defaultMessage: '' })
    ).toBe('missing.empty');
  });

  it('interpolates named placeholders', () => {
    expect(
      translate('en-US', {
        id: 'rss.subscription.pendingCount',
        defaultMessage: '待处理 {count}',
      }, { count: 3 })
    ).toBe('Pending 3');
  });
});
```

- [ ] **Step 2: Run the test file and verify it fails**

Run: `pnpm vitest run packages/i18n/src/translate.test.ts`
Expected: FAIL because `packages/i18n` files do not exist yet.

- [ ] **Step 3: Create the package manifest and TypeScript config**

Write `packages/i18n/package.json`:

```json
{
  "name": "@volix/i18n",
  "version": "1.0.29",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "typecheck": "tsc --noEmit",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch"
  }
}
```

Write `packages/i18n/tsconfig.json` by mirroring `packages/utils/tsconfig.json`.

- [ ] **Step 4: Implement the runtime primitives with locale tables**

Create these core files:

```ts
// packages/i18n/src/types.ts
export type Locale = 'zh-CN' | 'en-US';
export type MessageDescriptor = {
  id: string;
  defaultMessage: string;
};
export type MessageValues = Record<string, string | number>;
```

```ts
// packages/i18n/src/locale.ts
import type { Locale } from './types';

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;
export const DEFAULT_LOCALE: Locale = 'zh-CN';
export const FALLBACK_LOCALE: Locale = 'zh-CN';

export const isSupportedLocale = (value: unknown): value is Locale => {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
};

export const resolveLocale = (value: unknown): Locale => {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
};
```

```ts
// packages/i18n/src/interpolate.ts
import type { MessageValues } from './types';

export const interpolate = (template: string, values?: MessageValues) => {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : `{${key}}`;
  });
};
```

```ts
// packages/i18n/src/locales/en-US/common.ts
export const commonEnUs = {
  'common.action.save': 'Save',
  'common.action.cancel': 'Cancel',
  'common.status.loading': 'Loading...',
  'common.message.success': 'Success',
};
```

```ts
// packages/i18n/src/translate.ts
import { resolveLocale } from './locale';
import { getDictionary } from './dictionary';
import { interpolate } from './interpolate';
import type { Locale, MessageDescriptor, MessageValues } from './types';

export const translate = (locale: Locale, descriptor: MessageDescriptor, values?: MessageValues) => {
  const resolvedLocale = resolveLocale(locale);
  const table = getDictionary(resolvedLocale);
  const template = table[descriptor.id] || descriptor.defaultMessage || descriptor.id;
  return interpolate(template, values);
};

export const createTranslator = (locale: Locale) => {
  return (descriptor: MessageDescriptor, values?: MessageValues) => translate(locale, descriptor, values);
};
```

- [ ] **Step 5: Export the shared package surface**

Write `packages/i18n/src/index.ts`:

```ts
export * from './types';
export * from './locale';
export * from './dictionary';
export * from './translate';
```

- [ ] **Step 6: Run shared tests and package checks**

Run:

```bash
pnpm vitest run packages/i18n/src/translate.test.ts
pnpm --filter @volix/i18n typecheck
pnpm --filter @volix/i18n build
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/i18n package.json
git commit -m "feat: add shared i18n runtime package"
```

## Task 2: Integrate i18n into the web runtime and request pipeline

**Files:**
- Modify: `apps/web-pc/package.json`
- Modify: `apps/web-pc/src/main.tsx`
- Create: `apps/web-pc/src/i18n/provider.tsx`
- Create: `apps/web-pc/src/i18n/storage.ts`
- Create: `apps/web-pc/src/i18n/index.ts`
- Modify: `apps/web-pc/src/utils/http.ts`

- [ ] **Step 1: Write the failing frontend behavior checklist**

Use this checklist as the red-state target:

```ts
// Startup behavior
// 1. locale defaults to zh-CN
// 2. localStorage key volix-language restores a supported locale
// 3. unsupported persisted values fall back to zh-CN
//
// Request behavior
// 4. every axios request includes volix-language
```

- [ ] **Step 2: Add the workspace dependency**

Update `apps/web-pc/package.json` dependencies:

```json
"@volix/i18n": "workspace:*"
```

- [ ] **Step 3: Implement browser locale storage and provider**

Write `apps/web-pc/src/i18n/storage.ts`:

```ts
import { DEFAULT_LOCALE, resolveLocale, type Locale } from '@volix/i18n';

const STORAGE_KEY = 'volix-language';

export const getStoredLocale = (): Locale => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return resolveLocale(window.localStorage.getItem(STORAGE_KEY));
};

export const setStoredLocale = (locale: Locale) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
};
```

Write `apps/web-pc/src/i18n/provider.tsx`:

```tsx
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { createTranslator, type Locale, type MessageDescriptor, type MessageValues } from '@volix/i18n';
import { getStoredLocale, setStoredLocale } from './storage';

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (descriptor: MessageDescriptor, values?: MessageValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  const setLocale = (next: Locale) => {
    setStoredLocale(next);
    setLocaleState(next);
  };

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: createTranslator(locale),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('I18nProvider is required');
  }
  return value;
};
```

- [ ] **Step 4: Mount the provider and attach request headers**

Wrap the root in `apps/web-pc/src/main.tsx`:

```tsx
import { I18nProvider } from '@/i18n';

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <AppRoot />
  </I18nProvider>
);
```

Update `apps/web-pc/src/utils/http.ts` request interceptor:

```ts
import { getStoredLocale } from '@/i18n/storage';

instance.interceptors.request.use(config => {
  config.headers = config.headers || {};
  (config.headers as Record<string, string>)['volix-language'] = getStoredLocale();
  return config;
});
```

- [ ] **Step 5: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web-pc/package.json apps/web-pc/src/main.tsx apps/web-pc/src/i18n apps/web-pc/src/utils/http.ts
git commit -m "feat: wire i18n into web runtime"
```

## Task 3: Add the header locale switcher and translate shared web shell text

**Files:**
- Modify: `apps/web-pc/src/components/app-header/index.tsx`
- Modify: `apps/web-pc/src/layouts/router.tsx`
- Modify: `apps/web-pc/src/layouts/app-shell.tsx`
- Modify: `apps/web-pc/src/layouts/error-boundary.tsx`
- Modify: `apps/web-pc/src/components/loading/index.tsx`
- Modify: `apps/web-pc/src/utils/error.ts`
- Modify: `apps/web-pc/src/stores/user-store.ts`

- [ ] **Step 1: Write the failing shared UI checklist**

```ts
// Shared shell expectations:
// 1. header shows a locale select with zh-CN and en-US
// 2. changing it rerenders labels immediately
// 3. router titles and descriptions use t(...)
// 4. loading and error fallbacks use t(...)
```

- [ ] **Step 2: Add locale select to the app header**

In `apps/web-pc/src/components/app-header/index.tsx`, import `Select` and `useI18n()`, then add:

```tsx
const { locale, setLocale, t } = useI18n();

<Select
  value={locale}
  optionList={[
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' },
  ]}
  onChange={value => setLocale(value as 'zh-CN' | 'en-US')}
  style={{ width: 132 }}
/>
```

Translate visible header labels such as:

```tsx
t({ id: 'header.menu.system', defaultMessage: '系统管理' })
t({ id: 'header.menu.logout', defaultMessage: '退出登录' })
t({ id: 'header.user.guest', defaultMessage: '未登录' })
```

- [ ] **Step 3: Translate route metadata and shared fallback text**

Update `apps/web-pc/src/layouts/router.tsx` by replacing raw strings such as:

```tsx
title: '我的应用'
```

with descriptor-backed resolution, for example:

```tsx
title: t({ id: 'route.home.title', defaultMessage: '我的应用' })
```

If route definitions cannot call hooks directly, refactor route metadata so the shell resolves descriptors at render time instead of storing raw strings.

Also migrate:

```tsx
// app-shell loading
text="正在加载页面..."

// error boundary
title = '页面加载失败'
description = '应用发生了一个未处理错误，请稍后重试。'

// http error fallback
'请求失败，请稍后重试'
```

to descriptor-based `t(...)` calls.

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/components/app-header/index.tsx apps/web-pc/src/layouts/router.tsx apps/web-pc/src/layouts/app-shell.tsx apps/web-pc/src/layouts/error-boundary.tsx apps/web-pc/src/components/loading/index.tsx apps/web-pc/src/utils/error.ts apps/web-pc/src/stores/user-store.ts
git commit -m "feat: add i18n switcher to shared web shell"
```

## Task 4: Migrate key frontend pages to descriptor-based text

**Files:**
- Modify: `apps/web-pc/src/apps/auth/index.tsx`
- Modify: `apps/web-pc/src/apps/setting/index.tsx`
- Modify: `apps/web-pc/src/apps/setting/pages/system/index.tsx`
- Modify: `apps/web-pc/src/apps/setting/pages/config/config-rsshub.tsx`
- Modify: `apps/web-pc/src/apps/setting/pages/config/account-config-form.tsx`
- Modify: `apps/web-pc/src/apps/setting/pages/config/config-smtp.tsx`

- [ ] **Step 1: Write the failing migration target list**

```ts
// Must migrate in this task:
// auth page labels and submit messages
// settings side navigation labels
// system settings form labels and save toasts
// RSS config labels, dialogs, and toasts
// account config labels and connect/save toasts
// SMTP config labels and connect/save toasts
```

- [ ] **Step 2: Replace hard-coded strings with t({ id, defaultMessage })**

Use this pattern throughout the listed files:

```tsx
const { t } = useI18n();

Toast.success(
  t({ id: 'setting.system.saveSuccess', defaultMessage: '系统配置保存成功' })
);

<AppForm.Input
  field="username"
  label={t({ id: 'setting.account.username', defaultMessage: '账号' })}
  placeholder={t({ id: 'setting.account.usernamePlaceholder', defaultMessage: '请输入账号' })}
/>
```

- [ ] **Step 3: Search for leftover hard-coded Chinese strings in migrated files**

Run:

```bash
rg -n "[一-龥]" apps/web-pc/src/apps/auth/index.tsx apps/web-pc/src/apps/setting/index.tsx apps/web-pc/src/apps/setting/pages/system/index.tsx apps/web-pc/src/apps/setting/pages/config/config-rsshub.tsx apps/web-pc/src/apps/setting/pages/config/account-config-form.tsx apps/web-pc/src/apps/setting/pages/config/config-smtp.tsx
```

Expected: remaining Chinese text should only appear inside `defaultMessage` literals or unavoidable sample values such as example URLs.

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/auth/index.tsx apps/web-pc/src/apps/setting/index.tsx apps/web-pc/src/apps/setting/pages/system/index.tsx apps/web-pc/src/apps/setting/pages/config/config-rsshub.tsx apps/web-pc/src/apps/setting/pages/config/account-config-form.tsx apps/web-pc/src/apps/setting/pages/config/config-smtp.tsx
git commit -m "feat: migrate key web pages to i18n descriptors"
```

## Task 5: Add request-scoped i18n to the API

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/utils/request-context.ts`
- Modify: `apps/api/src/middleware/request-context.ts`
- Create: `apps/api/src/utils/i18n.ts`
- Modify: `apps/api/src/utils/response.ts`
- Modify: `apps/api/src/modules/shared/http-handler.ts`

- [ ] **Step 1: Write the failing backend locale checklist**

```ts
// Backend expectations:
// 1. request context stores locale
// 2. volix-language invalid values fall back to zh-CN
// 3. resSuccess default message uses request locale
// 4. 500 response default message uses request locale
```

- [ ] **Step 2: Add the workspace dependency and locale context**

Update `apps/api/package.json` dependencies:

```json
"@volix/i18n": "workspace:*"
```

Extend `apps/api/src/utils/request-context.ts`:

```ts
import type { Locale } from '@volix/i18n';

export interface RequestContextValue {
  userAgent?: string;
  actingUserId?: string;
  locale?: Locale;
}

export const getRequestLocale = () => {
  return getRequestContext()?.locale;
};
```

- [ ] **Step 3: Resolve the header once per request and create request-scoped t()**

Update `apps/api/src/middleware/request-context.ts`:

```ts
import { resolveLocale } from '@volix/i18n';

const locale = resolveLocale(ctx.request.headers['volix-language']);

return runWithRequestContext(
  {
    userAgent,
    locale,
  },
  () => next()
);
```

Create `apps/api/src/utils/i18n.ts`:

```ts
import { createTranslator, DEFAULT_LOCALE } from '@volix/i18n';
import { getRequestLocale } from './request-context';

export const t = createTranslator(DEFAULT_LOCALE);

export const getRequestTranslator = () => {
  return createTranslator(getRequestLocale() || DEFAULT_LOCALE);
};
```

If using the static `t` export is confusing, prefer a function:

```ts
export const t = (descriptor, values) => {
  return createTranslator(getRequestLocale() || DEFAULT_LOCALE)(descriptor, values);
};
```

- [ ] **Step 4: Localize shared response defaults**

Update `apps/api/src/utils/response.ts`:

```ts
import { t } from './i18n';

message: message || t({ id: 'common.message.success', defaultMessage: '成功' })
```

Update `apps/api/src/modules/shared/http-handler.ts`:

```ts
message: t({ id: 'common.error.server', defaultMessage: '服务器错误' })
```

- [ ] **Step 5: Run API typecheck**

Run: `pnpm --filter @volix/api typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/package.json apps/api/src/utils/request-context.ts apps/api/src/middleware/request-context.ts apps/api/src/utils/i18n.ts apps/api/src/utils/response.ts apps/api/src/modules/shared/http-handler.ts
git commit -m "feat: add request-scoped api i18n"
```

## Task 6: Migrate the first-pass backend user-facing errors

**Files:**
- Modify: `apps/api/src/middleware/authenticate.ts`
- Modify: `apps/api/src/modules/user/controller/auth.controller.ts`
- Modify: `apps/api/src/modules/user/controller/user-admin.controller.ts`
- Modify: `apps/api/src/modules/user/controller/system-setting.controller.ts`
- Modify: `apps/api/src/modules/user/service/system-setting.service.ts`
- Modify: `apps/api/src/modules/file/controller/file.controller.ts`
- Modify: `apps/api/src/modules/sqlite-admin/controller/sqlite-admin.controller.ts`
- Modify: `apps/api/src/modules/sqlite-admin/service/sqlite-admin.service.ts`
- Modify: `apps/api/src/modules/rss/controller/rss.controller.ts`
- Modify: `apps/api/src/modules/rss/service/rss.service.ts`
- Modify: `apps/api/src/modules/rss/service/rss-storage.service.ts`

- [ ] **Step 1: Write the failing migration target list**

```ts
// First-pass backend surfaces:
// authenticate middleware
// user auth
// user admin
// system setting validation
// file not found errors
// sqlite-admin validation/auth messages
// rss validation, subscription, and storage-status messages
```

- [ ] **Step 2: Replace raw response strings with translated descriptors**

Use this pattern:

```ts
import { t } from '../../../utils/i18n';

badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }));
unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
badRequest(t({ id: 'rss.subscription.addFailed', defaultMessage: '添加订阅失败' }));
```

For response status messages that are built in service layers, keep descriptors inline at the call sites so searching for either ID or Chinese default text remains easy.

- [ ] **Step 3: Search for leftover hard-coded Chinese HTTP messages in migrated files**

Run:

```bash
rg -n "badRequest\\('|unauthorized\\('|resError\\(|message: '" apps/api/src/middleware/authenticate.ts apps/api/src/modules/user/controller/auth.controller.ts apps/api/src/modules/user/controller/user-admin.controller.ts apps/api/src/modules/user/controller/system-setting.controller.ts apps/api/src/modules/user/service/system-setting.service.ts apps/api/src/modules/file/controller/file.controller.ts apps/api/src/modules/sqlite-admin/controller/sqlite-admin.controller.ts apps/api/src/modules/sqlite-admin/service/sqlite-admin.service.ts apps/api/src/modules/rss/controller/rss.controller.ts apps/api/src/modules/rss/service/rss.service.ts apps/api/src/modules/rss/service/rss-storage.service.ts
```

Expected: remaining raw strings should be operational logs or non-user-facing internal text, not HTTP response messages.

- [ ] **Step 4: Run API typecheck**

Run: `pnpm --filter @volix/api typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/middleware/authenticate.ts apps/api/src/modules/user/controller/auth.controller.ts apps/api/src/modules/user/controller/user-admin.controller.ts apps/api/src/modules/user/controller/system-setting.controller.ts apps/api/src/modules/user/service/system-setting.service.ts apps/api/src/modules/file/controller/file.controller.ts apps/api/src/modules/sqlite-admin/controller/sqlite-admin.controller.ts apps/api/src/modules/sqlite-admin/service/sqlite-admin.service.ts apps/api/src/modules/rss/controller/rss.controller.ts apps/api/src/modules/rss/service/rss.service.ts apps/api/src/modules/rss/service/rss-storage.service.ts
git commit -m "feat: translate api user-facing messages"
```

## Task 7: Final verification and migration audit

**Files:**
- Modify: none
- Test: workspace runtime, frontend, and backend verification commands

- [ ] **Step 1: Run the shared package checks**

Run:

```bash
pnpm vitest run packages/i18n/src/translate.test.ts
pnpm --filter @volix/i18n typecheck
pnpm --filter @volix/i18n build
```

Expected: PASS.

- [ ] **Step 2: Run app typechecks**

Run:

```bash
pnpm --filter @volix/web-pc typecheck
pnpm --filter @volix/api typecheck
```

Expected: PASS.

- [ ] **Step 3: Audit remaining user-facing hard-coded Chinese strings**

Run:

```bash
rg -n "[一-龥]" apps/web-pc/src apps/api/src
```

Expected: remaining strings are either:

- `defaultMessage` literals
- log-only text
- sample values or content data rather than UI / HTTP response copy

- [ ] **Step 4: Smoke-check locale switching and API header propagation**

Manual verification:

```md
1. Start the app with `pnpm dev`.
2. Open the web app and confirm the header locale select defaults to zh-CN.
3. Switch to en-US and verify shared shell labels update.
4. Trigger one authenticated API request and confirm the request includes `volix-language: en-US`.
5. Trigger one backend validation error and confirm the returned `message` is English.
```

- [ ] **Step 5: Commit the final verified state**

```bash
git add packages/i18n apps/web-pc apps/api
git commit -m "feat: add full-stack i18n support"
```

## Self-Review

- Spec coverage:
  - shared package, locale resolution, and fallback behavior are covered in Tasks 1 and 7
  - frontend provider, persistence, request header propagation, and header locale switcher are covered in Tasks 2 and 3
  - backend request-context locale handling and shared response localization are covered in Tasks 5 and 6
  - first-pass migration for key frontend and backend user-facing surfaces is covered in Tasks 4 and 6
- Placeholder scan:
  - no `TODO` or `TBD` markers remain
  - every task names exact files and exact commands
- Type consistency:
  - `Locale`, `MessageDescriptor`, `MessageValues`, `translate()`, and `t()` are named consistently across tasks
