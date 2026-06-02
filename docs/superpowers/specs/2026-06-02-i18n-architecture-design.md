# I18n Architecture Design

## Summary

This change adds full-stack internationalization support to Volix with one shared workspace package as the source of truth for locale definitions, message IDs, translation dictionaries, and fallback behavior. The initial rollout supports `zh-CN` and `en-US`, defaults to `zh-CN`, uses per-call `defaultMessage` as the primary fallback content, and allows the web app to switch language from the global header while sending the active locale to the API through a `volix-language` request header.

## Goals

- Add i18n support to both `apps/web-pc` and `apps/api`.
- Keep all translation keys and dictionaries in one shared workspace package.
- Support `zh-CN` and `en-US` in the first release.
- Make `zh-CN` the default locale and the runtime fallback locale.
- Ensure every user-facing message is addressed by a stable message ID.
- Let the web app switch locale from a header `Select`.
- Send the selected locale to the API on every request with `volix-language`.
- Make the design extensible for future locales without rewriting the runtime model.

## Non-Goals

- Translating every existing backend log line or internal debug message.
- Adding locale persistence to the database.
- Implementing browser-language auto-detection in the first release.
- Replacing the current route or app-shell architecture beyond what is needed for i18n.
- Introducing a large third-party i18n framework on both sides when the project can use a smaller shared runtime.

## Current State

The repository already uses a monorepo layout with shared workspace packages:

- `packages/utils`
- `packages/types`

This is a strong fit for a shared `packages/i18n` package.

The current user-facing text is scattered across both applications:

- route metadata in `apps/web-pc/src/layouts/router.tsx`
- page text, button labels, placeholders, `Toast` messages, and loading states in React components
- HTTP error fallbacks in `apps/web-pc/src/utils/error.ts`
- response defaults and business errors in `apps/api/src/utils/response.ts`, controllers, services, and middleware

At the moment:

- frontend text is mostly hard-coded Chinese strings
- backend response messages are also hard-coded Chinese strings
- request context does not carry locale
- there is no shared translation message system

## Proposed Architecture

## Shared Package

Create a new workspace package:

- `packages/i18n`

Its responsibilities:

- define supported locales
- define the fallback locale
- export dictionaries
- export message descriptor types
- export a small translation runtime
- export helpers for locale parsing and validation

This package should build in both `esm` and `cjs`, matching the existing package conventions used by `packages/utils` and `packages/types`.

## Package Layout

The package should stay modular so no file grows too large. A recommended structure:

```txt
packages/i18n/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ index.ts
   ├─ locale.ts
   ├─ translate.ts
   ├─ dictionary.ts
   ├─ keys.ts
   ├─ locales/
   │  ├─ zh-CN/
   │  │  ├─ common.ts
   │  │  ├─ auth.ts
   │  │  ├─ setting.ts
   │  │  ├─ rss.ts
   │  │  └─ index.ts
   │  └─ en-US/
   │     ├─ common.ts
   │     ├─ auth.ts
   │     ├─ setting.ts
   │     ├─ rss.ts
   │     └─ index.ts
   └─ shared/
      ├─ flatten.ts
      └─ interpolate.ts
```

Feature-domain dictionary files are preferred over one giant locale file so the codebase stays within the repository file-size rule and future translations remain manageable.

## Locale Model

The initial locale model:

- supported locales: `zh-CN`, `en-US`
- default locale: `zh-CN`
- fallback locale: `zh-CN`

The package should export:

- `SUPPORTED_LOCALES`
- `DEFAULT_LOCALE`
- `FALLBACK_LOCALE`
- `isSupportedLocale(value)`
- `resolveLocale(value)`

`resolveLocale(value)` should:

- accept unknown input
- return a supported locale when valid
- otherwise return `zh-CN`

This should be used in both frontend and backend so locale parsing behavior is identical.

## Message Descriptor Strategy

Each user-facing message should be addressed by a stable ID such as:

- `common.action.save`
- `common.action.cancel`
- `common.status.loading`
- `common.message.success`
- `auth.login.invalidCredentials`
- `auth.validation.invalidEmail`
- `setting.system.saveSuccess`
- `rss.subscription.removeConfirmTitle`

The call-site API should use a message descriptor rather than a bare ID:

```ts
t({ id: 'common.action.save', defaultMessage: '保存' });
```

This design is preferred because it keeps the source code searchable and self-explanatory during debugging. Developers can search by either the stable ID or the visible fallback text.

The shared package should export:

- `MessageDescriptor`
- `t(descriptor, params?)`
- helpers for locale-aware translation lookup

`defaultMessage` should be the canonical `zh-CN` fallback text for that call site.

Other locales such as `en-US` should provide translation tables keyed by message ID. Their values only need to contain the translated string, not a repeated descriptor object. This keeps secondary locale files concise while preserving readable source usage in frontend and backend code.

## Translation Runtime

The shared package should expose a lightweight translation API rather than pulling in a heavy framework.

Recommended primitives:

- `translate(locale, descriptor, params?)`
- `createTranslator(locale)`
- `getDictionary(locale)`

Runtime behavior:

1. resolve requested locale
2. read translated text by `descriptor.id` from that locale
3. if missing, use `descriptor.defaultMessage`
4. if still missing, return `descriptor.id`
5. interpolate named placeholders such as `{count}`

Example:

```ts
translate('en-US', { id: 'rss.subscription.pendingCount', defaultMessage: '待处理 {count}' }, { count: 3 });
```

If the `en-US` value is missing, the result should come from `defaultMessage`.

## Frontend Design

## Frontend State Model

The web app should own locale state globally so all React trees can re-render when the user switches language.

Recommended pieces:

- an `I18nProvider`
- a `useI18n()` hook
- a small locale store or provider state
- a persistence helper backed by `localStorage`

The stored locale should be restored during app startup. If nothing is stored, use `zh-CN`.

Recommended stored key:

- `volix-language`

## Frontend Translator API

Components should consume:

- `locale`
- `setLocale(nextLocale)`
- `t(descriptor, params?)`

This keeps component usage simple:

```tsx
const { t } = useI18n();
<Button>{t({ id: 'common.action.save', defaultMessage: '保存' })}</Button>
```

## Header Language Switcher

The shared application header should add a `Select` control for language switching.

Behavior:

- show `zh-CN` and `en-US`
- reflect the current locale
- update the global i18n state on change
- persist the selection to `localStorage`
- trigger React re-render so visible text updates immediately

The switcher belongs in the header because it applies app-wide and is expected to be reachable from any page.

## Request Header Propagation

The frontend HTTP client should send the current locale with every API request using:

- `volix-language`

This should be added inside the existing Axios request interceptor in `apps/web-pc/src/utils/http.ts`.

The header value should always come from the active locale state or its persistence layer, not from page-local component state.

## Frontend Migration Scope

The first rollout should convert the main shared user-facing text surfaces:

- router header titles and descriptions
- global loading and error boundary messages
- header menu labels
- auth-related text
- settings page form labels, placeholders, and toasts
- common `Toast` success and error fallbacks

Pages can then be migrated feature by feature until no hard-coded user-facing Chinese strings remain in normal web flows.

## Backend Design

## Request Locale Resolution

The API should resolve locale per request from:

- `volix-language` request header

Resolution rules:

- if the header is a supported locale, use it
- if missing or invalid, use `zh-CN`

The resolved locale should be stored in request context so any controller, service, or middleware can access it without threading locale parameters through every function signature.

## Request Context Extension

Extend the current request context value with:

- `locale`

Recommended shape addition:

```ts
interface RequestContextValue {
  userAgent?: string;
  actingUserId?: string;
  locale?: Locale;
}
```

The request context middleware should parse the request header once and store the resolved locale before the request enters business handlers.

## Backend Translator Access

Add backend helpers that read the current request locale from request context and expose a request-scoped `t()` function.

Recommended helpers:

- `getRequestLocale()`
- `t(descriptor, params?)`

`t()` should use the shared package runtime and current request locale. This allows backend code to move from:

- `badRequest('邮箱格式错误')`

to:

- `badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }))`

## Response Message Handling

The API currently has localized message strings embedded directly in handlers and defaults.

This rollout should move backend response messages to translation keys for:

- default success messages
- default internal server error message
- authentication and authorization errors
- common validation failures
- major user-facing settings and RSS flows

The response envelope stays the same:

```ts
{
  code,
  message,
  data
}
```

Only the `message` generation source changes.

## Backend Migration Scope

First-pass backend migration should focus on user-facing HTTP responses, not logs. Prioritize:

- `apps/api/src/modules/user`
- `apps/api/src/modules/rss`
- `apps/api/src/modules/sqlite-admin`
- `apps/api/src/modules/file`
- shared middleware error responses

Internal log text may remain unchanged for now because it is operational, not end-user interface.

## Fallback Rules

The runtime fallback rules should be consistent across frontend and backend:

1. use requested locale if supported
2. if the translation is missing in that locale, use `defaultMessage`
3. if `defaultMessage` is empty or missing, return `id`

This ensures:

- future locales can ship incrementally
- users never get `undefined` text
- backend response messages remain stable even if a secondary locale is incomplete

## Extensibility

The design should make future locale addition low-risk. Adding a new locale should require:

1. creating a new locale directory under `packages/i18n/src/locales/`
2. implementing a translation table keyed by message ID
3. registering the locale in `SUPPORTED_LOCALES`
4. adding a frontend display label for the header `Select`

No changes should be needed in the core translation runtime or HTTP transport contract.

## Error Handling

### Unsupported Locale Input

- invalid `volix-language` header values fall back to `zh-CN`
- invalid persisted browser locale values also fall back to `zh-CN`

### Missing Translation Entries

- missing locale entries resolve to `defaultMessage`
- missing `defaultMessage` resolves to the message ID itself

### Rendering Safety

The frontend should not crash if a translation entry is missing. The page should render `defaultMessage`, or the message ID as a final fallback.

### Backend Safety

The backend should always produce a string message even if a locale entry is missing.

## Testing Strategy

## Shared Package

- verify `resolveLocale()` falls back to `zh-CN`
- verify `translate()` returns locale value when present
- verify `translate()` falls back to `defaultMessage` when a locale entry is missing
- verify interpolation works for named placeholders

## Frontend

- verify startup defaults to `zh-CN`
- verify persisted locale is restored from `localStorage`
- verify changing the header `Select` updates visible UI text
- verify Axios includes `volix-language` in outgoing requests
- verify missing translations render `defaultMessage`

## Backend

- verify request context stores locale from `volix-language`
- verify invalid header values fall back to `zh-CN`
- verify translated API errors use the request locale
- verify untranslated entries still produce `defaultMessage` or ID fallback instead of empty strings

## Migration And Delivery Plan

Implementation should be incremental:

1. create `packages/i18n`
2. add shared locale resolution and translation runtime tests
3. connect frontend provider, persistence, and request-header propagation
4. add header language `Select`
5. connect backend request locale parsing and request-scoped translation helpers
6. migrate shared frontend and backend user-facing text
7. run typecheck and targeted tests for the shared package, web app, and API

This sequence keeps the project working while the text migration is in progress.

## Risks And Mitigations

### Risk: incomplete migration leaves mixed-language UI

Mitigation:

- prioritize shared shell, auth, settings, and common toasts first
- keep a searchable migration pass for remaining hard-coded strings

### Risk: translation files grow too large

Mitigation:

- split dictionaries by domain
- keep locale aggregators thin

### Risk: frontend and backend locale logic drift

Mitigation:

- keep locale parsing and translation runtime in the shared package
- avoid duplicating locale resolution logic per app

### Risk: request locale becomes disconnected from UI locale

Mitigation:

- source the request header from the same global locale state used by rendering
- centralize header injection in the Axios interceptor

## Implementation Notes

- `packages/i18n` should follow the existing workspace package build pattern with `tsup`
- the design intentionally prefers a small custom runtime over adding separate frontend and backend i18n libraries
- the current first phase should focus on end-user interface strings and HTTP response messages, not internal operational logs
