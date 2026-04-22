# Home / Setting Migration And AI Organizer Cancel Design

## Summary

This change reshapes the web app information architecture so that `home` becomes the primary feature workspace and `setting` becomes a focused configuration center. At the same time, the OpenList AI organizer gains an explicit "stop task" capability for queued and running work.

The migration is intentionally direct:

- No compatibility routes for old business pages under `/setting/...`
- No redirect preservation for removed feature paths
- Existing page implementations are reused where possible, but their route ownership changes

## Goals

- Remove the oversized hero/dashboard section from `home`
- Make `home` fully modular and card-driven
- Move business features from `setting` into top-level feature routes surfaced on `home`
- Keep `setting` focused on configuration and administrative settings
- Allow OpenList AI organizer tasks to be canceled directly from the UI

## Non-Goals

- Redesign every migrated feature page internally
- Add dashboard summaries/widgets beyond module cards on `home`
- Preserve legacy `/setting/anime-subscription`, `/setting/openlist-ai-organizer`, or `/setting/scheduled-task` URLs
- Hard-cancel already in-flight low-level network requests to OpenList

## Current Problems

### Home Structure

The current `home` page mixes two concepts:

- a promotional hero section centered on AI chat
- a secondary grid of application cards

This creates an uneven hierarchy. The hero dominates the page while other important tools such as scheduled tasks, AI file organizer, and anime subscription live elsewhere inside settings.

### Setting Scope

The current `setting` area acts as both:

- a configuration center
- a business feature launcher

This overloads the navigation and makes settings feel like the main workspace, even though many of the pages there are operational tools rather than configuration.

### AI Organizer Task Control

The OpenList AI organizer currently supports:

- queued
- running
- succeeded
- failed

but it does not support explicit user-initiated cancellation. Once a task starts, the user must wait for completion or failure.

## Target UX

### Home

`home` becomes the main functional workspace. It presents only module cards grouped by purpose, without a large featured hero.

Expected modules on `home`:

- AI 助手
- 智能格式化
- 取色器
- 随机图片
- 自动追番
- AI 文件整理
- 定时任务
- SQLite 数据管理
- 设置 / 配置中心

Visibility rules continue to respect authentication and admin permissions.

### Setting

`setting` becomes a focused settings shell. It contains only:

- 个人信息
- 用户管理
- 角色管理
- 系统配置
- 各类账号配置

Removed from settings navigation:

- 自动追番
- AI 文件整理
- 定时任务

### AI Organizer

The organizer task UI exposes direct stop controls for `queued` and `running` tasks.

User-visible behavior:

- queued task: stop immediately, mark as canceled
- running task: stop as soon as the current step reaches a cancellation checkpoint
- canceled task: visible in task list and detail view with clear canceled state

## Route Design

### New Top-Level Business Routes

These routes become first-class feature pages:

- `/anime-subscription`
- `/anime-subscription/add`
- `/anime-subscription/edit/:id`
- `/openlist-ai-organizer`
- `/scheduled-task`

These pages continue to require authentication and retain any existing admin checks.

### Removed Business Routes Under Settings

The following routes are removed instead of redirected:

- `/setting/anime-subscription`
- `/setting/anime-subscription/add`
- `/setting/anime-subscription/edit/:id`
- `/setting/openlist-ai-organizer`
- `/setting/scheduled-task`

The router should no longer register them once the migration lands.

### Settings Routes Retained

Settings remains mounted under `/setting` and continues to own:

- `/setting/info`
- `/setting/user`
- `/setting/user/add`
- `/setting/user/edit/:id`
- `/setting/role`
- `/setting/role/add`
- `/setting/role/edit/:roleKey`
- `/setting/system`
- `/setting/config/...`

## Home Page Design

### Layout

Remove:

- hero
- hero stats
- featured AI workspace block

Retain and simplify:

- header
- a compact section title if still useful
- card grid

The visual result should feel like a clean modular launcher rather than a marketing landing page.

### Card Groups

The page should be organized as one or more flat card sections with consistent treatment. A simple single-grid layout is acceptable if it reads clearly.

Suggested grouping:

- 常用工具: 格式化、取色器、随机图片
- 工作台: AI 助手、自动追番、AI 文件整理、定时任务
- 管理: SQLite 数据管理、设置

The final implementation can collapse these into fewer sections if that keeps the page cleaner.

### Permissions

- anonymous users: only public tools
- authenticated non-admin users: authenticated features they are allowed to access
- admin users: all admin business modules and management modules

If a module already enforces admin access internally, `home` should still hide it for non-admins to reduce dead-end navigation.

## Setting Shell Design

### Navigation

The settings nav should be trimmed so its labels reflect configuration rather than operations.

Top-level groups:

- 基础设置
- 管理设置
- 账号配置

Business workflow links are removed entirely.

### Header Copy

The settings header should no longer imply "后台管理" as the umbrella workspace if it only contains settings. Update copy to better match configuration intent, such as:

- 设置
- 配置中心

Exact wording can be chosen during implementation, but it should clearly differ from the old all-purpose admin workspace framing.

## AI Organizer Cancel Design

### Status Model

Introduce an additional task status:

- `canceled`

Valid user stop targets:

- `queued`
- `running`

No stop action for:

- `succeeded`
- `failed`
- `canceled`

### Cancel Semantics

#### Queued Task

If the task has not started:

- mark it as `canceled`
- set `finishedAt`
- update `currentStage` to a canceled message
- do not let the processor pick it up

#### Running Task

Use cooperative cancellation:

- persist a cancellation flag on the task record
- long-running flows check the flag at explicit checkpoints
- once observed, terminate the task cleanly
- mark status as `canceled`
- set `finishedAt`

This avoids adding abort propagation to every OpenList/AI request immediately.

### Cancellation Checkpoints

The organizer should check for cancellation:

- before expensive scan phases start
- between chunked scan or analysis loops
- before execute-stage batch actions
- between per-item execute operations

This gives users a real stop mechanism without requiring unsafe interruption of arbitrary async calls.

### API Changes

Add a new endpoint for task cancellation, likely:

- `POST /openlist-ai-organizer/tasks/:id/cancel`

Behavior:

- validate admin permission
- validate task existence
- only allow cancel from `queued` or `running`
- return updated task summary or task id + status confirmation

### Store Changes

Task storage needs one additional persisted field:

- `cancelRequested` or equivalent boolean marker

Processor behavior:

- skip queued tasks already marked canceled
- for running tasks, checkpoints read latest task state before continuing

### UI Changes

In the task list and current task area:

- show `停止任务` button for `queued` and `running`
- disable/replace button while stop request is submitting
- render `canceled` using a distinct neutral/warning tag color

In task details:

- show canceled stage text
- preserve any partial summary/result only if meaningful
- never present canceled work as succeeded/failed

## Error Handling

### Home / Setting Migration

- Removed settings business routes should naturally 404 if accessed directly after migration
- No compatibility redirects will be added

### Cancel Task

Return clear business errors for:

- task does not exist
- task already finished
- task already canceled
- permission denied

Frontend should surface these via existing toast patterns.

## Testing Strategy

### Router / Navigation

- `home` renders module cards without the hero section
- cards navigate to new top-level routes
- removed items no longer appear in settings navigation

### AI Organizer Cancel

- queued task can be canceled before execution
- running task transitions to canceled after a checkpoint
- canceled task is never executed afterward
- task list shows canceled status correctly
- cancel button hidden/disabled for finished tasks

### Regression Checks

- existing config pages still reachable under `/setting`
- anime subscription add/edit still work under new top-level routes
- scheduled task page still functions after route migration
- openlist organizer browse/analyze/execute still function when not canceled

## Implementation Plan Shape

The implementation should be split into these chunks:

1. Route migration and navigation cleanup
2. Home redesign to modular card layout
3. Settings shell cleanup and copy updates
4. OpenList AI organizer backend cancel support
5. OpenList AI organizer frontend stop controls and canceled status handling
6. Verification of migrated routes and organizer lifecycle

## Risks

### Route Breakage

Removing old `/setting/...` business routes means any hardcoded internal links must be updated in all pages, not just `home` and `setting`.

### Partial Execution Semantics

Running-task cancellation is cooperative, so users may still see one in-progress action finish before the task stops. This is acceptable and should be reflected in UI wording.

### Shared Task Store Logic

The task processor currently uses a file-backed queue. Cancel behavior must be implemented carefully so queue pickup and running-state updates do not re-activate canceled tasks.

## Recommendation

Proceed with the direct migration:

- make `home` the feature workspace
- narrow `setting` to configuration only
- implement cooperative cancel for organizer tasks

This delivers the requested product structure with the least unnecessary redesign and keeps the technical work focused on routing, navigation, and task lifecycle correctness.
