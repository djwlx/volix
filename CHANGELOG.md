# Changelog

## [1.1.4] - 2026-06-03

### 中文
#### Added
- 新增 RSS 订阅暂停功能，支持暂停/恢复订阅
- 新增数据库迁移文件，添加订阅启用状态字段
- 新增 RSS 订阅工具服务模块
- 新增 SQLite 管理页面卡片组件
#### Changed
- 重构 RSS 服务模块，优化订阅状态管理逻辑
- 优化 SQLite 管理页面布局，使用卡片组件替代原有表格
- 更新国际化翻译文件，新增暂停相关文案
- 更新 API 类型定义，新增订阅启用状态字段
#### Fixed
- 修复 RSS 存储服务中的状态更新问题

### English
#### Added
- Added RSS subscription pause/resume functionality
- Added database migration for subscription enabled field
- Added RSS subscription utility service module
- Added card component for SQLite admin page
#### Changed
- Refactored RSS service module for improved subscription state management
- Optimized SQLite admin page layout with card components
- Updated i18n translations with pause-related strings
- Updated API type definitions with subscription enabled field
#### Fixed
- Fixed state update issue in RSS storage service

## [1.1.3] - 2026-06-02

### 中文
#### Added
- 新增国际化支持（i18n）。
- 新增内存缓存机制。
- 新增数据库错误处理。
- 新增 Sharp 运行时配置工具。
- 新增多项测试覆盖。

#### Changed
- 优化图片缓存逻辑，提升性能。
- 重构 115 SDK 错误处理。
- 改进 RSS 订阅解析器。
- 更新前端组件样式与交互。

#### Fixed
- 修复图片缓存格式问题。
- 修复随机查询服务中的边界情况。

### English
#### Added
- Added internationalization (i18n) support.
- Added a memory caching mechanism.
- Added database error handling.
- Added a Sharp runtime configuration utility.
- Added broader test coverage.

#### Changed
- Optimized image caching logic for better performance.
- Refactored 115 SDK error handling.
- Improved the RSS subscription parser.
- Updated frontend component styles and interactions.

#### Fixed
- Fixed image cache formatting issues.
- Fixed edge cases in the random query service.

## [1.1.2] - 2026-06-02

### 中文
#### Added
- 新增权限功能（DJWL）。

#### Changed
- 更新 Docker 发布工作流。

### English
#### Added
- Added the permission feature (DJWL).

#### Changed
- Updated the Docker release workflow.
