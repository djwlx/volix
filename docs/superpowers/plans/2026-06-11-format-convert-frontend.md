# Format Convert Frontend Plan

## Task 6: Build the frontend tool page, services, and translated route/home entry

**Files:**
- Create: `apps/web-pc/src/services/format-convert.ts`
- Create: `apps/web-pc/src/apps/format-convert/index.tsx`
- Create: `apps/web-pc/src/apps/format-convert/index.module.scss`
- Create: `apps/web-pc/src/apps/format-convert/preset-options.ts`
- Create: `apps/web-pc/src/apps/format-convert/preset-options.test.ts`
- Create: `apps/web-pc/src/apps/format-convert/task-status.tsx`
- Create: `apps/web-pc/src/apps/format-convert/task-status.test.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/convert-option-form.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/local-convert-card.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/cloud-convert-card.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/openlist-browser.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/task-record-list.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/index.ts`
- Modify: `apps/web-pc/src/layouts/router.tsx`
- Modify: `apps/web-pc/src/apps/home/index.tsx`
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] Write the failing pure frontend tests.
- [ ] Run `pnpm test apps/web-pc/src/apps/format-convert/preset-options.test.ts apps/web-pc/src/apps/format-convert/task-status.test.tsx` and confirm failure.
- [ ] Implement shared page helpers and task rendering.
- [ ] Build the route, page, forms, record list, and service layer.
- [ ] Add all new copy to `zh-CN` and `en-US` i18n resources.
- [ ] Re-run focused frontend tests and `pnpm --filter @volix/web-pc typecheck`.

Reference sketch:

```ts
export const buildVideoCodecOptions = (targetFormat: string) => {
  return ['copy', 'h264', 'h265', 'vp9', 'av1']
    .filter(value => !(targetFormat === 'mp3' || targetFormat === 'aac' || targetFormat === 'wav'))
    .map(value => ({ label: value, value }));
};
```

```ts
export const getTaskStatusView = (status: FormatConvertTaskStatus) => {
  if (status === 'upload_failed') return { tone: 'danger', messageId: 'formatConvert.status.uploadFailed' };
  if (status === 'completed') return { tone: 'success', messageId: 'formatConvert.status.completed' };
  return { tone: 'warning', messageId: `formatConvert.status.${status}` };
};
```

```tsx
{
  path: 'format-convert',
  Component: FormatConvertApp,
  handle: routeHandle({
    requiresAuth: true,
    appHeader: {
      title: msg('route.formatConvert.title', '格式转换'),
      description: msg('route.formatConvert.description', '本地文件与 OpenList 云文件的统一格式转换工具'),
    },
  }),
}
```

## Acceptance Focus

- Local conversion and cloud conversion are split into two obvious entry panels.
- Target format and preset mode are primarily driven by dropdowns.
- Optional custom ffmpeg args are exposed as an advanced input.
- Record list shows task state transitions clearly for both local and cloud tasks.
- Completed local tasks expose a direct download action.
