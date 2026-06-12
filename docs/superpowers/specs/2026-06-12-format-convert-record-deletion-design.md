# Format Convert Record Deletion Design

## Summary

Add record deletion to the format convert task history with two entry points:

- per-row deletion for a single finished task
- table multi-select deletion with select-all support for multiple finished tasks

Deletion removes both the persisted task record and any local artifacts owned by the task, including uploaded source files, generated outputs, logs, and workspace directories.

The deletion surface must only allow finished tasks to be selected. Running or pending tasks remain visible but cannot be selected or deleted from the batch action.

## Goals

- Allow deleting a single finished convert record directly from the row actions.
- Allow deleting multiple finished convert records through Semi Table row selection.
- Allow selecting all currently deletable rows through the table header checkbox.
- Delete the task records together with their local artifacts in one confirmed action.
- Keep running and pending tasks safe from accidental deletion.

## Non-Goals

- Cancelling or deleting running tasks.
- Adding filter-based “delete all finished tasks” without explicit row selection.
- Deleting remote OpenList result files.
- Replacing the existing retry, download, or detail flows.

## User Experience

### Record Table

The existing record list remains a Semi `Table`, but gains controlled row selection.

- Finished rows can be selected.
- Pending and running rows render disabled checkboxes.
- The header checkbox selects all deletable rows currently shown in the table.
- Expanded detail rows continue to work unchanged.

### Row Actions

Each deletable row gets a destructive action labeled as record deletion rather than local-file cleanup.

Behavior:

- clicking the action opens a confirmation dialog
- confirm deletes the row’s local artifacts and the record itself
- success refreshes the table and clears any stale selection state

### Batch Actions

The card header gains a destructive batch action button on the right side.

Behavior:

- disabled when no deletable rows are selected
- enabled once at least one finished row is selected
- click opens a confirmation dialog
- confirm deletes only the selected finished tasks
- success refreshes the table and clears selected row keys

### Confirmation Copy

The confirmation dialog should state outcome and scope only:

- selected convert records will be deleted
- related uploaded files, outputs, logs, and workspace directories will be deleted
- the action cannot be undone

It should not include operational guidance or step-by-step usage instructions.

## Eligibility Rules

Only finished tasks are deletable.

For this feature, “finished” means:

- completed tasks
- failed tasks
- any other terminal state already treated as non-running by backend task lifecycle rules

Pending and running tasks are not deletable:

- they cannot be selected in the table
- they cannot show the row delete action
- backend must still validate status and reject invalid deletion requests

## Frontend Design

### TaskRecordList

`apps/web-pc/src/apps/format-convert/components/task-record-list.tsx`

Changes:

- add controlled `rowSelection`
- track `selectedRowKeys`
- derive deletable rows from task status
- disable row checkbox through `getCheckboxProps` for non-deletable rows
- add header-level batch delete button
- replace per-row cleanup action with per-row delete action
- open confirmation dialog for single delete and batch delete

Props evolve from:

- `onCleanup(task)`

to:

- `onDelete(task)`
- `onBatchDelete(taskIds)`

The component should stay presentation-oriented:

- selection state may live inside the table component
- actual API calls stay in the page container

### App Container

`apps/web-pc/src/apps/format-convert/index.tsx`

Changes:

- wire single delete callback
- wire batch delete callback
- show success and failure toast
- reload tasks after successful deletion

Batch success toast should mention actual deleted count returned by backend.

### Frontend Service Layer

`apps/web-pc/src/services/format-convert.ts`

Add:

- `deleteFormatConvertTask(taskId)`
- `deleteFormatConvertTasks(taskIds)`

Recommended endpoints:

- `POST /format-convert/task/:id/delete`
- `POST /format-convert/tasks/delete`

Batch request payload:

```ts
{
  taskIds: number[]
}
```

Batch response payload:

```ts
{
  success: true,
  deletedCount: number
}
```

## Backend Design

### Routing

`apps/api/src/modules/format-convert/format-convert.route.ts`

Add:

- `POST /format-convert/task/:id/delete`
- `POST /format-convert/tasks/delete`

Keep existing cleanup route untouched for now only if backward compatibility is needed elsewhere. If the UI fully migrates and no other consumer exists, the old cleanup route may remain internally supported but unused by the web app.

### Controller

`apps/api/src/modules/format-convert/controller/format-convert.controller.ts`

Add two handlers:

- `deleteFormatConvertTask`
- `deleteFormatConvertTasks`

Handler responsibilities:

- authenticate current user
- load owned task(s)
- filter to deletable terminal statuses
- remove local artifacts
- delete task rows
- return deleted count

Single delete should return:

```ts
{
  success: true
}
```

Batch delete should return:

```ts
{
  success: true,
  deletedCount: number
}
```

If a requested task is not found or is not deletable, the single-delete route should reject.
For batch delete, invalid or non-deletable task ids should be ignored after ownership filtering, and the response should report the actual deleted count.

### Task DB Service

`apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts`

Add helpers:

- `deleteFormatConvertTaskByIdAndUserId(taskId, userId)`
- `listFormatConvertTasksByIdsAndUserId(taskIds, userId)`
- `deleteFormatConvertTasksByIdsAndUserId(taskIds, userId)`

These helpers keep ownership checks close to persistence logic and avoid scattering raw model access in controllers.

### Artifact Cleanup

Reuse the existing local artifact cleanup service:

- `cleanupFormatConvertTaskLocalArtifacts`

No behavior change is needed there; record deletion simply calls cleanup first, then removes the row instead of blanking stored paths.

### Status Model

Introduce a shared predicate for deletable terminal states so frontend and backend can align on one concept.

Recommended shape:

```ts
isFormatConvertTaskDeletable(status): boolean
```

This should live in a shared format-convert domain utility or existing status constant module, depending on current repo conventions.

### Error Handling

- Single delete returns an error if the task does not belong to the user or is not deletable.
- Batch delete never deletes running or pending tasks even if ids are supplied manually.
- Artifact cleanup should remain best-effort per file path, matching current cleanup behavior.
- If artifact cleanup for a task throws unexpectedly, that task record must not be deleted before cleanup completes for that task.

For batch deletion, processing should be sequential and conservative:

- try deleting each eligible task
- stop and surface an error on the first unexpected hard failure

This avoids partial record deletion without artifact cleanup for later tasks.

## i18n

All new user-visible strings must be added to both locale files.

Expected additions:

- row delete action label
- batch delete action label
- single delete confirm title/content/confirm button
- batch delete confirm title/content/confirm button
- batch delete success toast
- delete failure toast
- empty selection disabled-state friendly label if needed

Copy should describe consequences only and must avoid operational instructions.

## Testing

### Frontend Tests

`apps/web-pc/src/apps/format-convert/components/task-record-list.test.ts`

Add coverage for:

- finished rows are selectable
- running rows render disabled selection
- row delete action appears only for deletable rows
- batch delete button enables when selection exists
- single delete confirmation triggers callback
- batch delete confirmation sends selected ids

`apps/web-pc/src/services/format-convert.test.ts`

Add coverage for:

- single delete endpoint
- batch delete endpoint

### Backend Tests

`test/api/format-convert-controller.test.ts`

Add route assertions for:

- `POST /format-convert/task/:id/delete`
- `POST /format-convert/tasks/delete`

Add controller/service tests for:

- single delete removes artifacts and record
- batch delete deletes only terminal tasks
- running and pending tasks survive batch delete
- batch response reports actual deleted count

## Rollout Notes

- Migrate the web app away from the old row-level cleanup action.
- Keep existing download and retry actions unchanged.
- Preserve table expansion behavior and row key stability while adding selection.

## Open Decisions Resolved

- deleting a record also deletes the record row itself
- batch deletion uses explicit row selection rather than a blind “clear all”
- only finished tasks are deletable
- table multi-select and header select-all are implemented with Semi Table `rowSelection`
