# Docker 使用说明

[English](./docker.md)

本文档说明如何基于仓库根目录打包后的 `dist/` 产物，通过 Docker 运行 Volix。

## 概览

你可以直接使用已经发布到镜像仓库的容器镜像，也可以从本地源码构建镜像后运行。

## 已发布镜像

- Docker Hub：[`djwl/volix`](https://hub.docker.com/r/djwl/volix)
- GHCR：[`ghcr.io/djwlx/volix`](https://github.com/djwlx/volix/pkgs/container/volix)
- 截至 2026 年 6 月 2 日已确认存在的标签：`latest`、`v1.0.29`、`v1.0.28`、`v1.0.27`、`v1.0.26`

## 拉取已发布镜像

Docker Hub：

```bash
docker pull djwl/volix:latest
```

GHCR：

```bash
docker pull ghcr.io/djwlx/volix:latest
```

如果要固定版本，可将 `latest` 替换为具体标签，例如 `v1.0.29`。

## 运行已发布镜像

Docker Hub 示例：

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  djwl/volix:latest
```

GHCR 示例：

```bash
docker run -d \
  --name volix \
  -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/djwlx/volix:latest
```

容器启动后，可通过 `http://localhost:3000` 访问应用。

## 本地构建镜像

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
- 已确认发布的 `latest` 和 `v1.0.29` 为多架构镜像，包含 `linux/amd64` 和 `linux/arm64`。
