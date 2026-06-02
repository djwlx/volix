# Docker Guide

[简体中文](./docker.zh-CN.md)

This guide covers the Docker workflow for running Volix from the packaged `dist/` output.

## Overview

You can run Volix either from prebuilt images published to registries or by building the image locally from source.

## Published Images

- Docker Hub: [`djwl/volix`](https://hub.docker.com/r/djwl/volix)
- GHCR: [`ghcr.io/djwlx/volix`](https://github.com/djwlx/volix/pkgs/container/volix)
- Verified tags on June 2, 2026: `latest`, `v1.0.29`, `v1.0.28`, `v1.0.27`, `v1.0.26`

## Pull a Published Image

Docker Hub:

```bash
docker pull djwl/volix:latest
```

GHCR:

```bash
docker pull ghcr.io/djwlx/volix:latest
```

To pin a release, replace `latest` with a version tag such as `v1.0.29`.

## Run a Published Image

Docker Hub example:

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  djwl/volix:latest
```

GHCR example:

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/djwlx/volix:latest
```

After the container starts, open `http://localhost:3000`.

## Build Locally

The local Docker build expects the repository root `dist/` directory to exist first. Generate it with:

```bash
pnpm release
pnpm build
```

## Build Image

```bash
docker build -t volix:latest .
```

## Run Container

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  volix:latest
```

After the container starts, open `http://localhost:3000`.

## Persistent Data

Mount `$(pwd)/data` to `/app/data` so the application database and uploaded files survive container replacement.

## Upgrade Container

Rebuild the project output and image, then replace the container while keeping the same mounted data directory:

```bash
pnpm release
pnpm build
docker build -t volix:latest .
docker rm -f volix
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  volix:latest
```

## Notes

- The container serves the built application, not the Vite development server.
- If `dist/` is missing, rebuild with `pnpm release` and `pnpm build` before running `docker build`.
- The published `latest` and `v1.0.29` manifests are multi-arch images with `linux/amd64` and `linux/arm64` variants.
