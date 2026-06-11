# Changelog

## [1.1.7] - 2026-06-11

### 中文
#### Added
- 新增格式转换功能，支持本地和云端文件格式转换
- 新增 Openlist SDK 模块，提供文件系统、用户、分享等 API
- 新增数据库迁移脚本，创建格式转换任务表和日志路径表
- 新增格式转换相关类型定义和国际化文案
- 新增格式转换前端页面，包括转换卡片、任务记录列表等组件
- 新增格式转换后端服务，包括任务队列、FFmpeg 调用、工作空间管理等
- 新增格式转换 API 路由和控制器
- 新增格式转换单元测试和集成测试
#### Changed
- 更新 Dockerfile 以支持格式转换依赖
- 更新 README 和文档，添加格式转换相关说明
- 更新 Openlist SDK 重构，拆分模块并优化类型
- 更新依赖和包版本

### English
#### Added
- Added format conversion feature, supporting local and cloud file format conversion
- Added Openlist SDK module, providing file system, user, share, and other APIs
- Added database migration scripts to create format conversion task table and log path table
- Added type definitions and i18n translations for format conversion
- Added format conversion frontend pages, including conversion cards, task record list, and other components
- Added format conversion backend services, including task queue, FFmpeg invocation, workspace management, etc.
- Added format conversion API routes and controller
- Added unit and integration tests for format conversion
#### Changed
- Updated Dockerfile to support format conversion dependencies
- Updated README and documentation with format conversion instructions
- Refactored Openlist SDK, splitting modules and optimizing types
- Updated dependencies and package versions

## [1.1.6] - 2026-06-03

### 中文
#### Added
- 新增图片缓存下载功能及相关测试
- 新增图片下载URL生成功能及相关测试
- 新增图片设置统计功能及相关测试
- 新增格式化器面板状态管理及相关测试
- 新增格式化器卡片样式模块
- 新增图片喜欢布局组件及相关测试
- 新增应用头部菜单项组件及相关测试
#### Changed
- 优化图片缓存随机核心逻辑
- 重构图片缓存文件系统文件夹处理
- 改进格式化器卡片组件和JSON代码视图
- 更新图片设置页面
- 更新图片喜欢页面样式
- 更新应用头部组件
- 更新路由配置
- 更新国际化翻译（中英文）
- 更新多个包的依赖版本

### English
#### Added
- Added picture cache download feature and related tests
- Added picture download URL generation feature and related tests
- Added picture setting statistics feature and related tests
- Added formatter panel state management and related tests
- Added formatter card style module
- Added picture liked layout component and related tests
- Added app header menu items component and related tests
#### Changed
- Optimized picture cache random core logic
- Refactored picture cache filesystem folder handling
- Improved formatter card component and JSON code view
- Updated picture settings page
- Updated picture liked page styles
- Updated app header component
- Updated router configuration
- Updated i18n translations (Chinese and English)
- Updated dependency versions of multiple packages

## [1.1.5] - 2026-06-03

### 中文
#### Added
- 新增云代理功能，支持通过云端代理获取图片
- 新增自动图片功能，可自动选择随机图片
- 新增图片缓存随机配置模块
- 新增云代理服务模块
- 新增相关文档和测试
#### Changed
- 重构随机图片控制器，移除旧的随机代理控制器
- 优化图片设置页面，简化配置选项
- 更新国际化翻译
- 更新依赖版本
#### Fixed
- 修复已知问题

### English
#### Added
- Added cloud proxy feature to fetch images via cloud proxy
- Added auto image feature to automatically select random images
- Added picture cache random config module
- Added cloud proxy service module
- Added related documentation and tests
#### Changed
- Refactored random picture controller, removed old random proxy controller
- Optimized picture settings page, simplified configuration options
- Updated i18n translations
- Updated dependency versions
#### Fixed
- Fixed known issues

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
