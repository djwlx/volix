# Volix

[English](./README.md)

Volix 是一个面向个人自托管场景的开源工具箱，把 Web 界面、账号认证、权限控制、数据存储和多种内置工具整合进同一个全栈项目，方便你把常用的小工具集中部署在一个应用里。

## Volix 能做什么

Volix 适合希望把日常工具统一托管到自己服务器上的个人用户，也适合作为一个可持续扩展的轻量工具平台。

- 随机图片是核心能力：支持从 115 图片库随机取图、连续切换、同目录随机、自动播放、收藏喜欢的图片
- 开发工具开箱即用：内置智能格式化、取色器、SQLite 数据管理，适合调试接口、处理数据和排查内容
- RSS 阅读器可自托管使用：基于 RSSHub 管理订阅、聚合阅读、暂停订阅、查看本地缓存与历史
- 自托管账号与权限完整：支持注册登录、邮箱验证、个人资料维护、管理员与普通用户分级权限
- 配置集中管理：统一维护随机图片缓存策略、RSS 参数、SMTP、系统注册策略和用户级服务账号
- 双语界面：内置简体中文和英文国际化支持

## 内置功能

### 随机图片系统

- 从 115 图片源随机取图，支持“下一张”快速切换
- 支持同目录随机，方便围绕当前图继续浏览同一组素材
- 支持图片收藏和“我的喜欢”管理
- 支持自动播放，并可配置自动切换间隔
- 支持本地缓存与云端来源混合权重、去重窗口、缓存容量上限、代理与随机图接口地址配置
- 管理页可查看缓存状态、目录任务、失败重试和缓存清理

### 开发与调试工具

- 智能格式化：支持 JSON、XML、Base64 自动识别、递归解码和结构化查看
- 取色器：支持网页取色和上传图片后点击取色，自动生成 HEX、RGB、HSL，并支持一键复制
- SQLite 数据管理：管理员可直接查看表、分页浏览数据、新增/编辑/删除记录，并处理 JSON、布尔、数字、`null` 等字段值

### RSS 阅读与订阅管理

- 基于 RSSHub route 管理个人订阅
- 阅读页会聚合多个订阅源，并按时间统一排序
- 支持按订阅筛选、强制刷新和异常订阅提示
- 支持暂停/恢复订阅、删除订阅、清理历史、查看待处理数量与本地存储占用

### 账号、权限与系统配置

- 用户注册、登录和可选邮箱验证码注册
- 昵称、头像上传、邮箱验证等个人资料维护
- `admin` / `user` 角色与功能级可见性控制
- 管理员可维护系统用户、SMTP、注册策略，以及未登录随机图默认用户
- 支持用户级服务账号配置，便于保存各自独立的凭据和测试结果

## 部署方式

### 方式一：直接运行已发布 Docker 镜像

Docker Hub：

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  djwl/volix:latest
```

GHCR：

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/djwlx/volix:latest
```

启动后访问 `http://localhost:3000`。

镜像仓库：

- Docker Hub：[`djwl/volix`](https://hub.docker.com/r/djwl/volix)
- GHCR：[`ghcr.io/djwlx/volix`](https://github.com/djwlx/volix/pkgs/container/volix)

### 方式二：从源码构建并部署

环境要求：

- Node.js `>=20 <25`
- 支持 `.nvmrc` 的 `nvm`
- pnpm `8.15.9`
- Docker

先构建应用和镜像：

```bash
nvm use
pnpm install
pnpm release
pnpm build
docker build -t volix:latest .
```

再启动容器：

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  volix:latest
```

### 数据与升级

- 将 `./data` 挂载到 `/app/data`，可以保留数据库和上传文件
- 源码部署升级时，重新构建镜像并替换容器即可
- 如果希望固定版本，建议使用具体镜像标签而不是 `latest`

完整 Docker 流程见 [Docker 使用说明](./docs/docker.zh-CN.md)。

## 开发方式

### 环境要求

- Node.js `>=20 <25`
- `nvm`
- pnpm `8.15.9`

### 本地启动

```bash
nvm use
pnpm install
pnpm dev
```

默认本地入口：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000`

### 常用命令

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm release
pnpm build
```

## 项目结构

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
