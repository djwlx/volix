# Volix

[English](./README.md)

Volix 是一个面向个人自托管场景的开源工具集合，用来统一承载日常会反复使用的小工具。它将 Web 界面、身份认证、权限控制和模块化工具页面组合在同一个全栈项目中。

## 简介

Volix 的目标是把常用的个人工具集中到一个系统里，方便本地开发、自托管部署和后续扩展。项目采用前后端一体化结构，尽量保持上手简单、运行直接。

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

Docker 使用方式请查看 [Docker 使用说明](./docs/docker.zh-CN.md)。

## 部署

Volix 可以通过已发布的容器镜像部署，也可以从本地源码构建部署。

- 已发布镜像：
  - Docker Hub：[`djwl/volix`](https://hub.docker.com/r/djwl/volix)
  - GHCR：[`ghcr.io/djwlx/volix`](https://github.com/djwlx/volix/pkgs/container/volix)
- 截至 2026 年 6 月 2 日已确认存在的标签：`latest`、`v1.0.29`、`v1.0.28`、`v1.0.27`、`v1.0.26`
- 具体部署命令和升级方式请查看 [Docker 使用说明](./docs/docker.zh-CN.md)。

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
