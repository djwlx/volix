# AI Translate Design

## Summary

This change adds a new `AI Translate` tool to the web home page. The tool is a standalone page for single-text translation and uses the current logged-in user's AI account configuration. If the user has not configured an AI account, the page stays in place, shows a configuration prompt, and lets the user manually navigate to the account settings page.

## Goals

- Add an `AI Translate` card under the home `tools` section.
- Add a standalone translation page in `apps/web-pc`.
- Use the current user's stored AI account to perform translations.
- Support only single-text translation in the first release.
- Show an in-page empty/prompt state when AI account configuration is missing.
- Keep all new user-visible copy in shared i18n resources.

## Non-Goals

- Batch translation.
- Translation history.
- Glossaries, style presets, or terminology controls.
- Browser-side direct calls to third-party AI providers.
- Admin-level shared AI credentials.

## Current State

The repository already has the core pieces needed for this feature:

- user-level AI account configuration UI in `apps/web-pc/src/apps/setting/pages/config/ai-account-card.tsx`
- account config APIs in `apps/web-pc/src/services/user.ts`
- backend account-config controllers in `apps/api/src/modules/user/controller/account-config.controller.ts`
- a reusable OpenAI-compatible AI SDK in `apps/api/src/sdk/ai/create-ai.sdk.ts`

The home page currently exposes tool cards for formatter, color picker, random image, RSS, and format convert. There is no translation tool or translation API yet.

## Proposed Design

## User Flow

1. The user opens the home page and sees a new `AI Translate` tool card.
2. The user enters the translation page.
3. The page loads the current user's account configs.
4. If no valid AI config is present, the page renders a prompt card with a `Go Configure` action that navigates to `/setting/config/account`.
5. If AI config is present, the page renders a single-text translation form.
6. The user enters source text, selects source language and target language, and submits.
7. The backend uses the user's AI account to call the configured model and returns translated text only.

## Frontend

Add a new app page in `apps/web-pc/src/apps/ai-translate/` with small focused files so code file size stays under repository limits.

The page should include:

- a textarea for source text
- a source-language select
- a target-language select
- a translate action
- a result panel
- loading and error states

The page should request account configs on load. Missing AI config should be treated as a normal empty state rather than a hard error.

The prompt state should:

- explain that translation requires the current user's AI account
- provide a button that navigates to the account settings page
- avoid auto-redirecting the user away from the current page

The form should initially support a compact built-in language list such as:

- auto detect
- Chinese
- English
- Japanese
- Korean

This list is enough for the first release and can be expanded later without changing the API shape.

## Backend

Add a user-authenticated translation endpoint under the user module. Recommended shape:

- `POST /user/ai/translate`

Request payload:

- `text`
- `sourceLanguage`
- `targetLanguage`

Response payload:

- `text`

Backend flow:

1. verify login
2. load current user's account configs
3. validate that AI config exists and is usable
4. create AI SDK from the stored config
5. send a strict translation prompt to the configured model
6. return only the translated text

The translation prompt should clearly require:

- preserve original meaning
- output only the translated result
- no explanation, markdown, or extra commentary
- treat `auto` source language as automatic detection

If AI config is missing, the API should return a translated business error that the frontend can map to the prompt state or toast feedback.

## Data and Validation

Validation rules:

- `text` is required and must not be blank after trim
- `targetLanguage` is required
- source and target can be equal, but frontend should discourage it

The first release does not need persistence for translation content or result history.

## Error Handling

Frontend should handle three cases distinctly:

- missing AI account config: show prompt state with navigation button
- request failure from AI provider or backend: show error toast/message
- empty translation result: treat as failure and show translated fallback text

Backend should return explicit localized errors for:

- unauthenticated user
- missing AI account config
- invalid translation payload
- upstream AI request failure

## Testing

Frontend tests should cover:

- home page includes the new translation card
- translation page shows config prompt when AI config is absent
- translation page submits and renders result when API succeeds

Backend tests should cover:

- translation endpoint rejects unauthenticated access
- translation endpoint rejects missing AI config
- translation endpoint validates required text/target language
- translation endpoint returns translated text from the AI SDK result

## File Impact

Expected main changes:

- add a new home card and route metadata
- add `ai-translate` frontend app files
- add frontend service for translation API
- add backend controller/service/route files for translation
- add shared type definitions if needed for request/response payloads
- add i18n keys in `packages/i18n/src/locales/zh-CN/translation.json` and `en-US/translation.json`

## Open Decisions Resolved

- entry form: standalone tool page
- missing config behavior: in-page prompt with manual navigation
- initial scope: single-text translation only

