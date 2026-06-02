# Volix

[简体中文](./README.zh-CN.md)

Volix is an open-source personal toolkit for self-hosted daily utilities. It combines a web UI, authentication, permission control, and modular tool pages in a single full-stack project.

## Intro

Volix is designed for running small, frequently used personal tools in one place. The project focuses on a simple full-stack setup that is easy to develop locally and straightforward to deploy on a lightweight server.

## Features

- User accounts with role-based access control
- Personal settings with avatar upload support
- Modular tool pages rendered by feature visibility
- Monorepo structure for shared types and utilities

## Installation

### Requirements

- Node.js `>=20 <25`
- pnpm `8.15.9`

### Install dependencies

```bash
pnpm install
```

### Start the development environment

```bash
pnpm dev
```

Default local endpoints:

- Web app: Vite dev server on port `5173`
- API: `http://localhost:3000`

### Build for production

```bash
pnpm release
pnpm build
```

For Docker usage, see [Docker Guide](./docs/docker.md).

## Deployment

Volix can be deployed either from published container images or from a local source build.

- Published images:
  - Docker Hub: [`djwl/volix`](https://hub.docker.com/r/djwl/volix)
  - GHCR: [`ghcr.io/djwlx/volix`](https://github.com/djwlx/volix/pkgs/container/volix)
- Verified tags on June 2, 2026: `latest`, `v1.0.29`, `v1.0.28`, `v1.0.27`, `v1.0.26`
- For deployment commands and upgrade steps, see [Docker Guide](./docs/docker.md).

## Project Structure

```txt
volix/
├─ apps/
│  ├─ web-pc/
│  └─ api/
├─ packages/
│  ├─ types/
│  └─ utils/
├─ data/
└─ dist/
```

## Development

```bash
pnpm dev
pnpm release
pnpm build
pnpm test
pnpm typecheck
```
