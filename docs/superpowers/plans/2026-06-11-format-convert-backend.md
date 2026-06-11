# Format Convert Backend Plan

## Task 1: Split OpenList SDK and lock full API coverage with failing tests

**Files:**
- Create: `test/api/openlist-sdk-full-surface.test.ts`
- Create: `apps/api/src/sdk/openlist/core/request-openlist.ts`
- Create: `apps/api/src/sdk/openlist/core/openlist.types.ts`
- Create: `apps/api/src/sdk/openlist/auth/openlist-auth.ts`
- Create: `apps/api/src/sdk/openlist/user/openlist-user.ts`
- Create: `apps/api/src/sdk/openlist/admin/openlist-admin.ts`
- Create: `apps/api/src/sdk/openlist/fs/openlist-fs.ts`
- Create: `apps/api/src/sdk/openlist/public/openlist-public.ts`
- Create: `apps/api/src/sdk/openlist/share/openlist-share.ts`
- Modify: `apps/api/src/sdk/openlist/create-openlist.sdk.ts`
- Modify: `apps/api/src/sdk/openlist/index.ts`

- [ ] Write the failing grouped SDK test.
- [ ] Run `pnpm test test/api/openlist-sdk-full-surface.test.ts` and confirm failure.
- [ ] Implement the split request core and grouped method files.
- [ ] Rebuild the facade and export typed modules.
- [ ] Re-run `pnpm test test/api/openlist-sdk-full-surface.test.ts` and confirm pass.

Reference sketch:

```ts
export function createOpenlistSdk(options: CreateOpenlistSdkOptions) {
  const requestOpenlist = createRequestOpenlist(options);
  return {
    ...createOpenlistAuthModule(requestOpenlist),
    ...createOpenlistUserModule(requestOpenlist),
    ...createOpenlistAdminModule(requestOpenlist),
    ...createOpenlistFsModule(requestOpenlist),
    ...createOpenlistPublicModule(requestOpenlist),
    ...createOpenlistShareModule(requestOpenlist),
  };
}
```

## Task 2: Add shared format-convert API types and persistent task schema

**Files:**
- Create: `packages/types/src/api/format-convert.ts`
- Modify: `packages/types/src/api/index.ts`
- Create: `apps/api/migrations/20260611000000-add-format-convert-task.cjs`
- Create: `apps/api/src/modules/format-convert/model/format-convert-task.model.ts`
- Create: `apps/api/src/modules/format-convert/types/format-convert.types.ts`
- Modify: `apps/api/src/utils/path.ts`
- Modify: `apps/api/src/utils/dependencies.ts`

- [ ] Write the failing shared-type test.
- [ ] Run `pnpm test test/api/format-convert-option.service.test.ts` and confirm failure.
- [ ] Add shared API contracts and task-local types.
- [ ] Add the migration and path scaffolding.
- [ ] Run `pnpm test test/api/format-convert-option.service.test.ts` and `pnpm typecheck`.

Reference sketch:

```ts
export const FORMAT_CONVERT_RECOVERABLE_STATUSES = [
  'downloading',
  'converting',
  'uploading',
  'download_failed',
  'convert_failed',
  'upload_failed',
] as const;
```

```js
await queryInterface.createTable('format_convert_task', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: Sequelize.INTEGER, allowNull: false },
  mode: { type: Sequelize.STRING, allowNull: false },
  status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
  optionJson: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
  attemptCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  workspaceDir: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  resultLocalPath: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  resultOpenlistPath: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  createdAt: { type: Sequelize.DATE, allowNull: false },
  updatedAt: { type: Sequelize.DATE, allowNull: false },
});
```

## Task 3: Build runtime validation, presets, and workspace helpers with test-first coverage

**Files:**
- Create: `test/api/format-convert-option.service.test.ts`
- Create: `test/api/format-convert-runtime.service.test.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-option.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-workspace.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service.ts`

- [ ] Write the failing option and runtime tests.
- [ ] Run `pnpm test test/api/format-convert-option.service.test.ts test/api/format-convert-runtime.service.test.ts` and confirm failure.
- [ ] Implement the preset catalog and custom-arg guardrails.
- [ ] Implement runtime probing and workspace helpers.
- [ ] Re-run the focused tests and confirm pass.

Reference sketch:

```ts
const FORBIDDEN_CUSTOM_ARGS = new Set(['-i', '-y', '-n']);
```

```ts
export const parseProbeResult = (payload: ProbePayload) => {
  const video = payload.streams.find(item => item.codec_type === 'video');
  const audio = payload.streams.find(item => item.codec_type === 'audio');
  return {
    hasVideo: Boolean(video),
    hasAudio: Boolean(audio),
    width: video?.width || 0,
    height: video?.height || 0,
    durationSeconds: Number(payload.format?.duration || 0),
    sizeBytes: Number(payload.format?.size || 0),
    formatName: String(payload.format?.format_name || ''),
  };
};
```

## Task 4: Implement the persisted queue, restart recovery, and local/cloud workers

**Files:**
- Create: `test/api/format-convert-runner.service.test.ts`
- Create: `test/api/format-convert-queue.service.test.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-openlist.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-runner.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-queue.service.ts`

- [ ] Write the failing local/cloud worker tests.
- [ ] Run `pnpm test test/api/format-convert-runner.service.test.ts test/api/format-convert-queue.service.test.ts` and confirm failure.
- [ ] Implement DB helpers, OpenList adapter, and worker flow.
- [ ] Implement the queue and startup recovery entrypoint.
- [ ] Re-run the focused tests and confirm pass.

Reference sketch:

```ts
export const runFormatConvertTask = async (task: FormatConvertTaskEntity, hooks?: RunnerHooks) => {
  if (task.mode === 'cloud') {
    await hooks?.onStatusChange?.('downloading');
    await downloadOpenlistSource(task);
  }

  await hooks?.onStatusChange?.('converting');
  await executeFormatConvert(task);

  if (task.mode === 'cloud') {
    await hooks?.onStatusChange?.('uploading');
    await uploadOpenlistResult(task);
  }

  await persistCompletedResult(task);
  await hooks?.onStatusChange?.('completed');
};
```

```ts
export const collectRecoverableTasks = (statuses: FormatConvertTaskStatus[]) =>
  statuses.filter(status => FORMAT_CONVERT_RECOVERABLE_STATUSES.includes(status as never));
```

## Task 5: Add Koa APIs for local creation, cloud creation, list, retry, result download, and OpenList browsing

**Files:**
- Create: `test/api/format-convert-controller.test.ts`
- Create: `apps/api/src/modules/format-convert/controller/format-convert.controller.ts`
- Create: `apps/api/src/modules/format-convert/format-convert.route.ts`
- Create: `apps/api/src/modules/format-convert/index.ts`
- Modify: `apps/api/src/modules/index.ts`
- Modify: `apps/api/src/routes/index.ts`
- Modify: `apps/api/app.ts`

- [ ] Write the failing controller test.
- [ ] Run `pnpm test test/api/format-convert-controller.test.ts` and confirm failure.
- [ ] Implement controller methods and route wiring.
- [ ] Mount the module in the app and hook startup recovery.
- [ ] Re-run the focused test and confirm pass.

Reference sketch:

```ts
const router = new Router({ prefix: '/format-convert' });

router
  .post('/local-task', http(createLocalFormatConvertTask))
  .post('/cloud-task', http(createCloudFormatConvertTask))
  .get('/tasks', http(getFormatConvertTasks))
  .post('/task/:id/retry', http(retryFormatConvertTask))
  .get('/task/:id/result', http(downloadFormatConvertResult))
  .get('/openlist/fs', http(listOpenlistFsForFormatConvert));
```
