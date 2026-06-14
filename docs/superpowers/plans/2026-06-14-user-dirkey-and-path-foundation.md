# User DirKey And Path Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stable per-user `dirKey` and refactor the core path helpers so all future user-scoped file storage can live under `/data/users/<dirKey>/...`.

**Architecture:** Extend the user schema with an immutable filesystem-safe `dir_key`, add shared user-path helper functions in the API layer, and update app bootstrap code to initialize only system-level directories. This phase does not move every feature yet; it establishes the stable primitives that later path migrations will consume.

**Tech Stack:** Node.js, TypeScript, Sequelize, SQLite, Vitest

---

### Task 1: Add `dir_key` To The User Schema

**Files:**
- Create: `apps/api/migrations/20260614000000-add-user-dir-key.cjs`
- Modify: `apps/api/src/modules/user/model/user.model.ts`
- Modify: `apps/api/src/modules/user/types/user.types.ts`
- Modify: `apps/api/src/modules/user/service/user.service.ts`
- Test: `apps/api/src/modules/user/service/__tests__/user-dir-key.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildUserDirKey } from '../user.service';

describe('buildUserDirKey', () => {
  it('returns a filesystem-safe stable key', () => {
    expect(buildUserDirKey('user-123')).toMatch(/^[a-z0-9_-]+$/);
  });

  it('produces different keys for different user ids', () => {
    expect(buildUserDirKey('user-a')).not.toBe(buildUserDirKey('user-b'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- apps/api/src/modules/user/service/__tests__/user-dir-key.test.ts`
Expected: FAIL because `buildUserDirKey` does not exist yet.

- [ ] **Step 3: Add the migration**

```js
'use strict';

const crypto = require('crypto');

const buildDirKey = userId =>
  crypto.createHash('sha256').update(String(userId || '').trim()).digest('hex').slice(0, 24);

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user', 'dir_key', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    const rows = await queryInterface.sequelize.query('SELECT id FROM volix_user;', {
      type: Sequelize.QueryTypes.SELECT,
    });

    for (const row of rows) {
      const dirKey = buildDirKey(row.id);
      await queryInterface.sequelize.query('UPDATE volix_user SET dir_key = :dirKey WHERE id = :id', {
        replacements: { id: row.id, dirKey },
      });
    }

    await queryInterface.changeColumn('volix_user', 'dir_key', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('volix_user', 'dir_key');
  },
};
```

- [ ] **Step 4: Add minimal model and service support**

```ts
// user.model.ts
dir_key: {
  type: DataTypes.STRING,
  allowNull: false,
}
```

```ts
// user.service.ts
import crypto from 'crypto';

export const buildUserDirKey = (userId: string) =>
  crypto.createHash('sha256').update(String(userId || '').trim()).digest('hex').slice(0, 24);
```

- [ ] **Step 5: Ensure new users always get a `dir_key`**

```ts
const nextUserId = String(uuid || createdUser.id || '');
const dirKey = buildUserDirKey(nextUserId);
```

Persist `dir_key` when creating users, and include it when serializing user DTOs that stay server-side.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- apps/api/src/modules/user/service/__tests__/user-dir-key.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/migrations/20260614000000-add-user-dir-key.cjs apps/api/src/modules/user/model/user.model.ts apps/api/src/modules/user/types/user.types.ts apps/api/src/modules/user/service/user.service.ts apps/api/src/modules/user/service/__tests__/user-dir-key.test.ts
git commit -m "feat: add stable user dir keys"
```

### Task 2: Add User-Scoped Path Helpers

**Files:**
- Modify: `apps/api/src/utils/path.ts`
- Test: `apps/api/src/utils/__tests__/path.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  PATH,
  getUserRootDir,
  getUserUploadDir,
  getUserFormatTaskDir,
  getUserRssCacheDir,
} from '../path';

describe('user path helpers', () => {
  const dirKey = 'abc123';

  it('builds the user root under /data/users', () => {
    expect(getUserRootDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey));
  });

  it('builds upload and format task paths', () => {
    expect(getUserUploadDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey, 'upload'));
    expect(getUserFormatTaskDir(dirKey, '9')).toBe(path.join(PATH.usersRoot, dirKey, 'upload', 'format', '.tasks', '9'));
  });

  it('builds rss cache paths', () => {
    expect(getUserRssCacheDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey, 'rss', 'cache'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- apps/api/src/utils/__tests__/path.test.ts`
Expected: FAIL because the new helpers do not exist yet.

- [ ] **Step 3: Implement the helper surface**

Add:

```ts
export const getUserRootDir = (dirKey: string) => path.join(PATH.usersRoot, sanitizeDirKey(dirKey));
export const getUserUploadDir = (dirKey: string) => path.join(getUserRootDir(dirKey), 'upload');
export const getUserManualUploadDir = (dirKey: string) => path.join(getUserUploadDir(dirKey), 'manual');
export const getUserCloudUploadDir = (dirKey: string) => path.join(getUserUploadDir(dirKey), 'cloud');
export const getUserFormatRootDir = (dirKey: string) => path.join(getUserUploadDir(dirKey), 'format');
export const getUserFormatResultRootDir = (dirKey: string) => path.join(getUserFormatRootDir(dirKey), 'results');
export const getUserFormatTaskDir = (dirKey: string, taskId: string | number) =>
  path.join(getUserFormatRootDir(dirKey), '.tasks', String(taskId));
export const getUser115RootDir = (dirKey: string) => path.join(getUserRootDir(dirKey), '115-files');
export const getUser115OriginalDir = (dirKey: string) => path.join(getUser115RootDir(dirKey), 'original');
export const getUser115FormatDir = (dirKey: string) => path.join(getUser115RootDir(dirKey), 'format');
export const getUser115TaskDir = (dirKey: string) => path.join(getUser115RootDir(dirKey), '.tasks');
export const getUserRssRootDir = (dirKey: string) => path.join(getUserRootDir(dirKey), 'rss');
export const getUserRssFeedDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), 'feed');
export const getUserRssHistoryDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), 'history');
export const getUserRssCacheDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), 'cache');
export const getUserRssTaskDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), '.tasks');
```

Also add `PATH.usersRoot`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- apps/api/src/utils/__tests__/path.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/utils/path.ts apps/api/src/utils/__tests__/path.test.ts
git commit -m "feat: add user-scoped path helpers"
```

### Task 3: Refactor Bootstrap Directory Initialization

**Files:**
- Modify: `apps/api/src/utils/dependencies.ts`
- Test: `apps/api/src/utils/__tests__/dependencies.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { getBootstrapPathList } from '../dependencies';
import { PATH } from '../path';

describe('bootstrap path list', () => {
  it('creates only system-level directories up front', () => {
    expect(getBootstrapPathList()).toEqual([
      { filePath: PATH.data, type: 'dir' },
      { filePath: PATH.log, type: 'dir' },
      { filePath: PATH.usersRoot, type: 'dir' },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- apps/api/src/utils/__tests__/dependencies.test.ts`
Expected: FAIL because `getBootstrapPathList` does not exist and old cache/upload paths are still hard-coded.

- [ ] **Step 3: Implement the minimal bootstrap refactor**

Extract:

```ts
export const getBootstrapPathList = () => [
  { filePath: PATH.data, type: 'dir' as const },
  { filePath: PATH.log, type: 'dir' as const },
  { filePath: PATH.usersRoot, type: 'dir' as const },
];
```

Use it inside `initApp`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- apps/api/src/utils/__tests__/dependencies.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/utils/dependencies.ts apps/api/src/utils/__tests__/dependencies.test.ts
git commit -m "refactor: bootstrap only system data directories"
```

### Task 4: Add User Directory Resolution Helpers

**Files:**
- Create: `apps/api/src/modules/user/service/user-dir.service.ts`
- Modify: `apps/api/src/modules/user/service/index.ts` or nearest export barrel if present
- Test: `apps/api/src/modules/user/service/__tests__/user-dir.service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { resolveUserDirKeyOrThrow } from '../user-dir.service';

describe('resolveUserDirKeyOrThrow', () => {
  it('returns the stable dir key for a user id', async () => {
    const dirKey = await resolveUserDirKeyOrThrow('seed-user-id');
    expect(dirKey).toMatch(/^[a-z0-9_-]+$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- apps/api/src/modules/user/service/__tests__/user-dir.service.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Implement minimal lookup helpers**

Create:

```ts
export const getUserDirKeyById = async (userId: string) => {
  const row = await UserModel.findByPk(userId);
  return String(row?.dataValues?.dir_key || '').trim();
};

export const resolveUserDirKeyOrThrow = async (userId: string) => {
  const dirKey = await getUserDirKeyById(userId);
  if (!dirKey) {
    throw new Error('user-dir-key-not-found');
  }
  return dirKey;
};
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- apps/api/src/modules/user/service/__tests__/user-dir.service.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/user/service/user-dir.service.ts apps/api/src/modules/user/service/__tests__/user-dir.service.test.ts
git commit -m "feat: add user dir key lookup helpers"
```

### Task 5: Document The Foundation Changes

**Files:**
- Modify: `docs/superpowers/specs/2026-06-14-user-data-layout-design.md`

- [ ] **Step 1: Update the spec status**

Add a short “Foundation status” note recording:

- `dir_key` exists on the user model
- user-scoped helper APIs are available
- bootstrap only initializes system directories

- [ ] **Step 2: Run typecheck as final verification**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-14-user-data-layout-design.md
git commit -m "docs: note user data path foundation status"
```
