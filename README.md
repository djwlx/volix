# Volix

[简体中文](./README.zh-CN.md)

Volix is an open-source self-hosted toolkit for personal daily utilities. It packages a web UI, authentication, permissions, storage, and multiple built-in tools into one full-stack project so you can keep frequently used utilities in a single deployable app.

## What Volix Does

Volix is built for people who want a lightweight personal toolbox they can run on their own server and expand over time.

- Random image workflows are the centerpiece: pull images from a 115 library, jump to the next image, browse random siblings, autoplay, and save favorites
- Developer tools are built in: formatter, color picker, and SQLite Admin help with debugging payloads, inspecting data, and fixing content quickly
- Media tooling is built in: format convert handles local uploads and OpenList cloud files through preset or custom `ffmpeg` jobs
- RSS reading is self-hosted: manage RSSHub subscriptions, read aggregated feeds, pause routes, and inspect local cache/history
- Self-hosted accounts and permissions are included: sign in, sign up, optional email verification, profile management, and role-based access
- Configuration is centralized: manage random image cache strategy, RSS settings, SMTP, registration rules, and per-user service accounts
- Bilingual interface: Simplified Chinese and English i18n support

## Built-In Features

### Random Image System

- Pull random images from 115-backed sources with a fast next-image flow
- Jump to another random image from the same folder when you want related material
- Save favorites and manage them in My Likes
- Enable autoplay with a configurable interval
- Tune local/cloud source weights, no-repeat windows, cache size limits, proxy behavior, and random-image endpoint settings
- Review cache status, folder tasks, retry failures, and clear cached data from the management page

### Developer and Debugging Tools

- Formatter: auto-detect, recursively decode, and inspect JSON, XML, and Base64 content
- Color Picker: sample colors from web pages or uploaded images, generate HEX/RGB/HSL values, and copy them quickly
- SQLite Admin: browse tables, page through records, create/edit/delete rows, and work with JSON, booleans, numbers, and `null` values directly
- Format Convert: upload local media or pick OpenList files, choose preset output targets, optionally pass custom `ffmpeg` args, and track task status end to end

### RSS Reading and Subscription Management

- Manage personal RSSHub route subscriptions
- Aggregate items from multiple feeds into one reader sorted by time
- Filter by subscription, force refresh, and surface partial-load errors
- Pause/resume routes, remove subscriptions, clear history, and inspect queue/local storage usage

### Accounts, Permissions, and System Settings

- User registration, sign-in, and optional email-verification sign-up
- Profile editing with nickname, avatar upload, and email verification
- `admin` / `user` roles with feature-level visibility control
- Administrator controls for users, SMTP, registration policy, and the default random-image user for guests
- Per-user service account settings so each user can keep separate credentials and test results

## Deployment

### Option 1: Run a Published Docker Image

Docker Hub:

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  djwl/volix:latest
```

GHCR:

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/djwlx/volix:latest
```

Then open `http://localhost:3000`.

Published image registries:

- Docker Hub: [`djwl/volix`](https://hub.docker.com/r/djwl/volix)
- GHCR: [`ghcr.io/djwlx/volix`](https://github.com/djwlx/volix/pkgs/container/volix)

### Option 2: Build and Deploy from Source

Requirements:

- Node.js `>=20 <25`
- `nvm` with `.nvmrc` support
- pnpm `8.15.9`
- Docker
- `ffmpeg` and `ffprobe` available to the runtime that executes media conversion

Build the app and image:

```bash
nvm use
pnpm install
pnpm release
pnpm build
docker build -t volix:latest .
```

Run the container:

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  volix:latest
```

### Data and Upgrades

- Mount `./data` to `/app/data` to keep the database and uploaded files across container replacement
- Format convert uses `data/cache/media/format-convert` for temporary workspaces and clears them automatically after tasks finish or are recovered on restart
- Rebuild the image and recreate the container when upgrading a source-based deployment
- Use version tags instead of `latest` if you want a pinned release

For the full Docker workflow, see [Docker Guide](./docs/docker.md).

## Development

### Requirements

- Node.js `>=20 <25`
- `nvm`
- pnpm `8.15.9`
- `ffmpeg`
- `ffprobe`

### Local Setup

```bash
nvm use
pnpm install
pnpm dev
```

Default local endpoints:

- Web app: `http://localhost:5173`
- API: `http://localhost:3000`

### Common Commands

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm release
pnpm build
```

## Project Layout

```txt
volix/
├─ apps/
│  ├─ api/
│  └─ web-pc/
├─ packages/
│  ├─ i18n/
│  ├─ types/
│  └─ utils/
├─ docs/
└─ data/
```
