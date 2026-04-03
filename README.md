# Volix

一个面向个人场景的开源工具包（Personal Toolkit）。

Volix 的目标是把日常会反复使用的小工具统一放在一个系统里，提供：
- 统一登录与权限管理
- 可扩展的功能模块（按功能枚举控制可见性）
- 简单可部署的前后端一体化架构

当前项目以个人自托管为主，适合在本地或轻量服务器部署，后续会持续增强扩展能力。

## 核心功能

### 1. 用户与权限系统
- 邮箱注册/登录
- JWT 鉴权
- 用户角色：`user` / `admin`
- 角色组与功能权限绑定（基于 `AppFeature` 枚举）
- 管理员可管理用户、角色、角色权限

### 2. 个人设置中心
- 个人信息维护（昵称、头像）
- 支持头像上传（上传后自动使用 `/file/...` 路径）
- 完整后台布局（顶部 + 左侧菜单 + 内容区）

### 3. 工具模块（当前）
- `我的 115`（账号配置、资源相关能力）
- `随机图片`

> 首页展示的工具会根据当前用户的功能权限动态显示。

## 技术栈

### 前端
- React 18
- React Router 7
- Semi Design (`@douyinfe/semi-ui`)
- Vite
- TypeScript

### 后端
- Node.js + Koa
- Sequelize + SQLite
- JWT
- koa-body / koa-static / koa-router

### 工程化
- pnpm workspace
- Turborepo

## 项目结构

```txt
volix/
├─ apps/
│  ├─ web-pc/      # 前端应用
│  └─ api/         # 后端 API
├─ packages/
│  ├─ types/       # 前后端共享类型（含 AppFeature 枚举）
│  └─ utils/       # 共享工具
├─ data/           # 本地数据目录（sqlite 等）
└─ dist/           # 打包产物（release 后生成）
```

## 快速开始（开发环境）

## 环境要求
- Node.js: `>=20 <25`（建议 Node 20）
- pnpm: `8.15.9`

## 安装依赖

```bash
pnpm install
```

## 启动开发环境（前后端）

```bash
pnpm dev
```

默认情况下：
- 前端开发服务：Vite（默认 5173）
- 后端服务：`http://localhost:3000`

前端通过 Vite 代理访问后端：
- `/api` -> `http://localhost:3000`
- `/file` -> `http://localhost:3000`

## 单独启动

```bash
# 仅后端
pnpm --filter @volix/api dev

# 仅前端
pnpm --filter @volix/web-pc dev
```

## 构建与部署

## 1) 本地生产构建

```bash
pnpm release
```

## 2) 生成可部署产物（前后端合并）

```bash
pnpm build
```

该命令会执行仓库内脚本，将前端产物复制到后端静态目录，并整理根目录 `dist/` 为可运行部署包。

## 3) 生产启动（API 包内）

```bash
pnpm --filter @volix/api start
```

## 4) Docker（可选）

仓库提供了 `Dockerfile`，基于根目录 `dist/` 进行镜像构建。

典型流程：

```bash
pnpm build
docker build -t volix:latest .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name volix volix:latest
```

## 配置说明

当前后端基础配置位于：
- `apps/api/config/index.ts`

默认配置：
- `port: 3000`
- `token: volix-token`（请求头键名）

> 建议在生产环境通过配置管理或环境注入方式覆盖敏感配置。

## 数据与初始化

后端启动时会自动：
- 创建必要目录（如上传目录）
- 执行基础数据迁移（补齐用户表字段、角色表等）
- 初始化默认角色与默认功能权限

相关逻辑见：
- `apps/api/src/utils/dependencies.ts`

## 开发脚本（常用）

```bash
pnpm dev                # 前后端并行开发
pnpm release            # turbo 构建
pnpm build              # 打包并整理部署产物
pnpm typecheck          # 类型检查任务
```

## 后续计划（Roadmap）

### 近期待办
- 完善插件化机制：支持工具模块按目录注册/启停
- 丰富权限粒度：从“页面可见”扩展到“操作级权限”
- 增强设置中心：统一表单校验规则、统一错误提示
- 优化移动端体验：更好的布局与交互适配

### 中期规划
- 增加更多个人工具模块（文件处理、效率工具、自动化任务）
- 支持多存储后端（如对象存储）
- 提供更清晰的配置体系（环境变量 + 配置文件）

### 长期规划
- 模块市场化（社区共享模块）
- 更完整的审计日志与安全策略
- 多端统一（Web / 桌面端）

---

如果这个项目对你有帮助，欢迎 Star。
