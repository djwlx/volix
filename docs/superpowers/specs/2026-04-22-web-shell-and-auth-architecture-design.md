# Web Shell And Auth Architecture Design

## Summary

This change simplifies the web frontend architecture around three core ideas:

- one global `AppShell` renders the shared application header
- route definitions provide page header metadata instead of page components rendering headers themselves
- authentication and current-user state are managed through a unified Zustand store rather than route guard components

The goal is to make the routing tree easier to understand, reduce repeated page shell code, and move all permission decisions to the user state layer.

## Goals

- Introduce a single global header shell for main application pages
- Make route metadata the source of truth for page title, icon, and optional description
- Remove route guard components such as `GuestOnlyRoute`, `RequireAuthRoute`, and temporary bridge wrappers
- Centralize current-user state and auth lifecycle in Zustand
- Make unauthenticated access to protected pages redirect to `/`
- Remove layout files whose only purpose was route gating or context bridging

## Non-Goals

- Rebuild every feature page internally
- Redesign the visual language of every page beyond the shared header structure
- Replace all local component state with Zustand
- Add role-based policy engines beyond the current `role` and `featurePermissions` checks

## Current Problems

### Route Tree Is Carrying Too Much Responsibility

The current router does more than page mapping:

- guest-only gating
- auth-required gating
- temporary outlet context bridging for pages moved out of settings
- redirect-only wrappers

This makes route ownership harder to follow and creates extra layout files whose only job is to patch routing behavior.

### Page Headers Are Duplicated

Multiple pages render `AppHeader` directly. This causes:

- repeated page-shell code
- inconsistent title and icon handling
- extra effort whenever a new module is added

Because the route already knows which module is active, the page component should not need to redefine that identity.

### Auth State Has Multiple Sources

Current user and auth behavior are spread across:

- local token utilities
- `useUser`
- route guard components
- outlet context provided by `SettingApp`
- feature pages doing their own permission checks

This leads to unnecessary coupling and makes moved pages fragile, as seen with pages that still expected settings outlet context after becoming top-level routes.

## Target Architecture

## AppShell

`AppShell` becomes the shared layout for application pages that should show the unified top header.

Responsibilities:

- render the single global `AppHeader`
- read current route metadata via React Router matching APIs
- provide the standard page content container
- enforce the "unauthenticated users go to home" behavior for protected pages

`AppShell` does not own business logic for individual pages.

### Header Resolution

Each route can declare:

- `title`
- `icon`
- optional `description`
- optional `requiresAuth`

These are stored in route `handle.appHeader` and related route metadata.

`AppShell` uses `useMatches()` and resolves the active header from the deepest matched route that defines header metadata. If a child route omits header metadata, the shell falls back to the nearest parent route with metadata.

This gives nested routes sensible defaults while still allowing detail pages such as "新增追番任务" or "编辑追番任务" to override their titles.

## Route Design

### Router Responsibilities

After the refactor, `router.ts` is responsible only for:

- declaring routes
- attaching route metadata
- rendering layout hierarchy

It no longer performs authentication or permission gating through wrapper components.

### Protected Page Behavior

Routes that require authentication declare that requirement in route metadata rather than through wrapper elements.

When `AppShell` resolves a matched route that requires auth:

- if current user is available, render normally
- if current user loading is still in progress, show shell-level loading state
- if no current user exists after loading, redirect to `/`

This keeps auth behavior centralized without turning the router itself into a guard system.

### Public Page Behavior

Public pages such as `home`, `formatter`, `color-picker`, and `pic` can still use `AppShell` and shared header metadata, but they do not trigger auth redirects.

### Legacy Helper Files

These files should be removed once the new architecture lands:

- `apps/web-pc/src/layouts/route-access.tsx`
- `apps/web-pc/src/layouts/setting-context-bridge.tsx`

`redirect-to-setting.tsx` should only remain if there is still a real route compatibility use case. Otherwise it should also be removed.

## Zustand Auth Model

## Store Ownership

A dedicated Zustand auth store becomes the single source of truth for user session state.

Recommended state shape:

- `currentUser: UserInfoResponse | null`
- `userLoading: boolean`
- `userLoaded: boolean`
- `authInitialized: boolean`
- optional `authError: string | null`

Recommended actions:

- `initializeAuth()`
- `refreshCurrentUser()`
- `setCurrentUser(user)`
- `clearAuth()`

## Initialization Flow

On app startup:

1. check whether a token exists
2. if no token exists, mark auth initialization complete without requesting `/user/me`
3. if token exists, request `/user/me`
4. if successful, store the user in Zustand
5. if failed, clear token and user state, then finish initialization

This flow should run once near the app root.

## Consumption Model

Pages and layouts should read user state directly from Zustand or from a very thin hook that only wraps the store.

The store becomes the source for:

- whether the user is logged in
- whether the user is admin
- whether a protected page can render
- whether feature-level permission UI should be shown

## Settings And Feature Pages

Settings pages and the newly promoted top-level feature pages should no longer depend on `useOutletContext<SettingOutletContext>()`.

Instead, they read:

- `currentUser`
- `isAdmin`
- permissions

directly from global state.

Navigation helpers such as `requestNavigate` should be replaced by direct router navigation where possible. Leave guards should be handled by reusable hooks at the page level rather than through settings-specific outlet context.

## Header Metadata Model

Each relevant route defines metadata in a consistent format.

Example shape:

```ts
handle: {
  appHeader: {
    title: 'AI 文件整理',
    icon: <SomeIcon />,
    description: '分析目录、确认计划并执行整理'
  },
  requiresAuth: true
}
```

The exact field grouping can be refined in implementation, but these concepts should exist:

- header identity
- auth requirement
- optional page description

## Migration Scope

The shared shell should cover the main application pages:

- `/`
- `/ai`
- `/anime-subscription`
- `/anime-subscription/add`
- `/anime-subscription/edit/:id`
- `/openlist-ai-organizer`
- `/scheduled-task`
- `/sqlite-admin`
- `/formatter`
- `/color-picker`
- `/pic`
- `/setting/*`

The auth page remains separate and does not use the standard authenticated app shell.

## Error Handling

- if auth initialization fails, user state is cleared and protected pages fall back to redirecting home
- if a page needs admin privileges, the page can still render an explicit "暂无权限" state based on current user role
- shell-level auth checks should not swallow page-level business errors

## Testing Strategy

### Routing And Shell

- verify route metadata drives header title and icon correctly
- verify nested routes inherit or override header metadata as expected
- verify pages no longer render duplicate local headers

### Auth Behavior

- verify protected routes redirect to `/` when user is not authenticated
- verify authenticated users can access protected pages after store initialization
- verify invalid token flow clears user state and redirects correctly

### Regression Coverage

- verify pages previously depending on settings outlet context still work after moving to direct store consumption
- verify home remains publicly accessible
- verify settings and feature pages still show correct admin-only states

## Implementation Notes

- prefer incremental migration rather than rewriting every page at once
- first establish `AppShell` and route metadata
- then migrate pages away from local `AppHeader`
- then replace outlet-context dependencies with Zustand-backed state
- finally remove obsolete layout and guard files

## Open Decisions Resolved

- unauthenticated access to protected pages redirects to `/`
- route guard components are removed rather than replaced with new guard wrappers
- shared header identity is driven by router metadata
- global auth state is unified in Zustand
