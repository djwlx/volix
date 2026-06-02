# README Documentation Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single Chinese README with a concise English-first homepage, add a Chinese mirror, split Docker usage into dedicated English and Chinese guides, and keep changelog and links aligned.

**Architecture:** Treat the repository homepage and Docker usage as separate documentation surfaces. Keep `README.md` and `README.zh-CN.md` structurally aligned, move operational Docker detail into `docs/docker.md` and `docs/docker.zh-CN.md`, and verify all links and commands against the existing build flow.

**Tech Stack:** Markdown, Git, existing pnpm and Docker workflow

---

## File Structure

- Modify: `README.md` — replace the current Chinese-only mixed-content homepage with the concise English entry document.
- Create: `README.zh-CN.md` — add the Chinese mirror of the new homepage.
- Create: `docs/docker.md` — add the English Docker usage guide.
- Create: `docs/docker.zh-CN.md` — add the Chinese Docker usage guide.
- Modify: `CHANGELOG.md` — record the documentation restructure so commits pass repository checks.
### Task 1: Lock the source facts for the docs rewrite
**Files:**
- Modify: none
- Test: none
- [ ] **Step 1: Inspect the current README, package metadata, and Dockerfile assumptions**
Run:

```bash
sed -n '1,240p' README.md
sed -n '1,220p' package.json
sed -n '1,240p' Dockerfile
```
Expected: confirm the current README sections, Node and pnpm requirements, and that the Docker image is built from the repository `dist/` output.
- [ ] **Step 2: Inspect the existing release/build script wording to keep docs accurate**
Run:

```bash
sed -n '1,260p' scripts/release.js
```
Expected: confirm that `pnpm release` builds workspace artifacts and `pnpm build` prepares the final deployable root `dist/` package.
- [ ] **Step 3: Record the doc scope before editing**
Use these content boundaries while writing:

```md
- README.md / README.zh-CN.md include: intro, features, installation, project structure, development.
- docs/docker.md / docs/docker.zh-CN.md include: build image, run container, persistent data, upgrade, notes.
- Do not keep roadmap content in the main README.
```
- [ ] **Step 4: Commit the planning checkpoint**

```bash
git add docs/superpowers/specs/2026-06-02-readme-documentation-restructure-design.md docs/superpowers/plans/2026-06-02-readme-documentation-restructure.md
git commit -m "docs: add readme restructure plan"
```
Expected: the plan and approved design are committed before implementation starts.
### Task 2: Rewrite `README.md` as the English homepage
**Files:**
- Modify: `README.md`
- Test: none
- [ ] **Step 1: Replace the existing README content with the new English structure**
Write `README.md` with this content:

```md
# Volix

[简体中文](./README.zh-CN.md)

Volix is an open-source personal toolkit for self-hosted daily utilities. It combines a web UI, authentication, permission control, and modular tool pages in a single full-stack project.

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

Docker usage is documented separately in [docs/docker.md](./docs/docker.md).

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
```
- [ ] **Step 2: Verify the README is concise and no longer includes Docker operations or roadmap sections**
Run:

```bash
rg -n "Roadmap|Docker|docker run|docker build" README.md
```
Expected: only the Docker guide link remains; roadmap content is gone.
- [ ] **Step 3: Verify the file stays within repository size guidance**
Run:

```bash
wc -l README.md
```
Expected: well under the 500-line file limit.
- [ ] **Step 4: Commit the English README rewrite**

```bash
git add README.md
git commit -m "docs: rewrite english readme"
```
### Task 3: Add `README.zh-CN.md` as the Chinese mirror
**Files:**
- Create: `README.zh-CN.md`
- Test: none
- [ ] **Step 1: Create the Chinese README with the same structure as the English README**
Write `README.zh-CN.md` with this content:

```md
# Volix

[English](./README.md)

Volix 是一个面向个人自托管场景的开源工具集合，用来统一承载日常会反复使用的小工具。它将 Web 界面、身份认证、权限控制和模块化工具页面组合在同一个全栈项目中。

## 功能概览

- 基于角色的用户与权限控制
- 支持头像上传的个人设置中心
- 按功能可见性展示的模块化工具页面
- 共享类型与工具函数的 monorepo 结构

## 安装

### 环境要求

- Node.js `>=20 <25`
- pnpm `8.15.9`

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm dev
```

默认本地入口：

- 前端：Vite 开发服务，默认端口 `5173`
- 后端：`http://localhost:3000`

### 生产构建

```bash
pnpm release
pnpm build
```

Docker 使用方式请查看 [docs/docker.zh-CN.md](./docs/docker.zh-CN.md)。

## 项目结构

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

## 开发命令

```bash
pnpm dev
pnpm release
pnpm build
pnpm test
pnpm typecheck
```
```
- [ ] **Step 2: Verify the Chinese README mirrors the English section order**
Run:

```bash
rg -n "^## " README.md README.zh-CN.md
```
Expected: both files expose five top-level sections in matching order.
- [ ] **Step 3: Verify the language switch links are reciprocal**
Run:

```bash
rg -n "README.zh-CN.md|README.md" README.md README.zh-CN.md
```
Expected: `README.md` links to `README.zh-CN.md`, and `README.zh-CN.md` links back to `README.md`.
- [ ] **Step 4: Commit the Chinese README**

```bash
git add README.zh-CN.md
git commit -m "docs: add chinese readme"
```
### Task 4: Add the English Docker guide
**Files:**
- Create: `docs/docker.md`
- Test: none
- [ ] **Step 1: Create the English Docker guide with runnable commands**
Write `docs/docker.md` with this content:

```md
# Docker Guide

[简体中文](./docker.zh-CN.md)

This guide covers the Docker workflow for running Volix from the packaged `dist/` output.

## Overview

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
```
- [ ] **Step 2: Verify the guide only documents supported local image flow**
Run:

```bash
rg -n "pnpm release|pnpm build|docker build|docker run|/app/data" docs/docker.md
```
Expected: the guide includes build prerequisites, image build, container run, and data persistence.
- [ ] **Step 3: Verify the file path and file size constraints**
Run:

```bash
wc -l docs/docker.md
```
Expected: the file is well under the 500-line limit.
- [ ] **Step 4: Commit the English Docker guide**

```bash
git add docs/docker.md
git commit -m "docs: add docker guide"
```
### Task 5: Add the Chinese Docker guide
**Files:**
- Create: `docs/docker.zh-CN.md`
- Test: none
- [ ] **Step 1: Create the Chinese Docker guide with the same operational scope**
Write `docs/docker.zh-CN.md` with this content:

```md
# Docker 使用说明

[English](./docker.md)

本文档说明如何基于仓库根目录打包后的 `dist/` 产物，通过 Docker 运行 Volix。

## 概览

本地构建镜像前，需要先生成根目录 `dist/`：

```bash
pnpm release
pnpm build
```

## 构建镜像

```bash
docker build -t volix:latest .
```

## 运行容器

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  volix:latest
```

容器启动后，可通过 `http://localhost:3000` 访问应用。

## 数据持久化

将 `$(pwd)/data` 挂载到 `/app/data`，可以在替换容器后保留数据库和上传文件。

## 升级容器

重新生成构建产物和镜像后，保留同一个数据目录并重建容器：

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

## 说明

- 容器中运行的是构建后的应用，不是 Vite 开发服务。
- 如果缺少 `dist/`，请先执行 `pnpm release` 和 `pnpm build`，再运行 `docker build`。
```
- [ ] **Step 2: Verify the Chinese Docker guide mirrors the English section order**
Run:

```bash
rg -n "^## " docs/docker.md docs/docker.zh-CN.md
```
Expected: both files expose six top-level sections in matching order.
- [ ] **Step 3: Verify reciprocal language links between Docker guides**
Run:

```bash
rg -n "docker.zh-CN.md|docker.md" docs/docker.md docs/docker.zh-CN.md
```
Expected: `docs/docker.md` links to `docs/docker.zh-CN.md`, and the Chinese guide links back to the English guide.
- [ ] **Step 4: Commit the Chinese Docker guide**

```bash
git add docs/docker.zh-CN.md
git commit -m "docs: add chinese docker guide"
```
### Task 6: Update changelog and verify the full documentation set
**Files:**
- Modify: `CHANGELOG.md`
- Test: none
- [ ] **Step 1: Add or refine the unreleased changelog note for the README and Docker doc split**

Ensure `CHANGELOG.md` contains this line under `## [Unreleased]` -> `### Changed`:

```md
- Add bilingual README entry points and dedicated Docker usage guides for English and Chinese documentation.
```
- [ ] **Step 2: Stage the documentation files and review the diff**
Run:

```bash
git add README.md README.zh-CN.md docs/docker.md docs/docker.zh-CN.md CHANGELOG.md
git diff --cached -- README.md README.zh-CN.md docs/docker.md docs/docker.zh-CN.md CHANGELOG.md
```
Expected: the diff shows the README split, Docker guide additions, and one changelog update without unrelated file changes.
- [ ] **Step 3: Verify all cross-links and key phrases**
Run:

```bash
rg -n "docs/docker|README.zh-CN|README.md|Docker Guide|Docker 使用说明" README.md README.zh-CN.md docs/docker.md docs/docker.zh-CN.md
```
Expected: both README files link to the same-language Docker guide, and both Docker guides include reciprocal language links.
- [ ] **Step 4: Verify the repository status before the final commit**
Run:

```bash
git status --short
```
Expected: only the documentation files for this task are staged or modified.
- [ ] **Step 5: Commit the completed documentation restructure**

```bash
git add README.md README.zh-CN.md docs/docker.md docs/docker.zh-CN.md CHANGELOG.md
git commit -m "docs: restructure readme and docker docs"
```
