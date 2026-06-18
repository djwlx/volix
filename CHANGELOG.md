# Changelog

## [1.1.20] - 2026-06-18

### 中文
#### Added
- 新增图片实时服务，支持实时查看图片更新
- 新增日志查看器实时服务，支持实时日志流
- 新增 RSS 实时服务，支持实时推送 RSS 更新
- 新增文件表格浏览器组件，替代旧的文件树组件
- 新增 115 文件表格视图，优化文件浏览体验
- 新增 RSSHub 实时配置页面
#### Changed
- 优化图片设置页面，增加实时相关配置
- 优化格式转换页面，使用新的文件表格浏览器
- 优化日志查看器页面，集成实时日志功能
- 优化 SQLite 管理页面，改进界面交互
- 更新国际化翻译文件，新增实时功能相关文本
#### Fixed
- 修复图片缓存相关逻辑中的潜在问题

### English
#### Added
- Added picture realtime service for live picture updates
- Added log viewer realtime service for real-time log streaming
- Added RSS realtime service for instant RSS updates
- Added file table browser component to replace the old file tree
- Added 115 file table view for improved file browsing
- Added RSSHub realtime configuration page
#### Changed
- Enhanced picture settings page with realtime configuration options
- Updated format conversion page to use the new file table browser
- Improved log viewer page with integrated real-time logs
- Refined SQLite admin page for better interaction
- Updated i18n translations with realtime feature texts
#### Fixed
- Fixed potential issues in picture cache logic

## [1.1.19] - 2026-06-17

### 中文
#### Added
- 新增数据库迁移脚本，移除文件表
#### Changed
- 重构文件模块，移除文件模型和服务层
- 更新 RSS 模块，支持文件附件类型
- 更新前端 RSS 页面，优化样式和解析逻辑
- 更新国际化翻译文件

### English
#### Added
- Added database migration to drop file table
#### Changed
- Refactored file module, removed file model and service layer
- Updated RSS module to support file attachment type
- Updated frontend RSS page with improved styles and parsing logic
- Updated i18n translation files

## [1.1.18] - 2026-06-16

### 中文
#### Added
- 新增 RSS 持久化条目资源回填服务及测试
- 新增 RSS 存储资源服务及测试
- 新增 RSS 存储路由元数据服务
#### Changed
- 优化 RSS 存储服务逻辑
- 更新 RSS Feed 数据库服务
- 更新 RSS Feed 条目持久化服务
- 更新依赖项

### English
#### Added
- Added RSS persisted item resource backfill service and tests
- Added RSS storage resource service and tests
- Added RSS storage route metadata service
#### Changed
- Optimized RSS storage service logic
- Updated RSS feed database service
- Updated RSS feed item persistence service
- Updated dependencies

## [1.1.17] - 2026-06-16

### 中文
#### Added
- 新增 RSS 条目资源服务，用于管理 RSS 条目中的远程资源
- 新增远程资源获取服务，替代旧的资源代理缓存服务
#### Changed
- 重构 RSS 存储相关服务，移除旧的公共资源路径服务
- 更新 RSS 控制器和路由以支持新的资源处理逻辑
- 更新多个依赖包的版本号

### English
#### Added
- Added RSS item resource service to manage remote resources in RSS items
- Added remote resource fetch service to replace the old resource proxy cache service
#### Changed
- Refactored RSS storage services, removed old public resource path service
- Updated RSS controller and routes to support new resource handling logic
- Updated version numbers of multiple dependency packages

## [1.1.16] - 2026-06-14

### 中文
#### Added
- 新增 RSS 公共资源路径服务
- 新增资源代理缓存路径服务
- 新增密码工具和密钥管理工具
- 新增加密存储工具
#### Changed
- 重构 RSS 存储资源服务，优化资源代理缓存逻辑
- 优化 115 图片缓存格式，移除内存缓存
- 更新配置服务，支持更多安全配置
- 更新用户认证控制器，增强安全性
- 更新 Dockerfile 和多个依赖版本
#### Fixed
- 修复若干安全漏洞

### English
#### Added
- Added RSS public resource path service
- Added resource proxy cache path service
- Added password utility and secrets management utility
- Added crypto store utility
#### Changed
- Refactored RSS storage resource service, optimized resource proxy cache logic
- Optimized 115 picture cache format, removed memory cache
- Updated config service to support more secure configuration
- Updated user auth controller for enhanced security
- Updated Dockerfile and multiple dependency versions
#### Fixed
- Fixed several security vulnerabilities

## [1.1.15] - 2026-06-14

### 中文
#### Added
- 新增用户目录键（user-dir-key）支持，为后续用户数据隔离奠定基础
- 新增图片缓存路径管理模块，优化缓存路径生成逻辑
- 新增 RSS 存储路径服务，统一管理 RSS 资源存储路径
- 新增用户目录服务，提供用户目录管理功能
- 新增多项单元测试，覆盖图片缓存、格式转换、日志查看、RSS 存储路径、用户目录键、用户目录、依赖、日志、路径等模块
#### Changed
- 重构图片缓存随机核心、启动同步、统一缓存等模块，使用新的路径服务
- 重构格式转换工作区服务与运行器，优化工作区管理逻辑
- 重构日志查看器服务，改进日志查询与展示
- 重构 RSS 相关服务（归档、缓存、增量缓存、HTML 文件、持久化、清理、存储、资源代理等），统一使用新的存储路径服务
- 重构资源代理缓存服务，优化缓存策略
- 更新用户服务，集成用户目录键功能
- 更新前端日志查看器界面，改进样式与交互
- 更新前端首页应用卡片样式
- 更新多个包版本号（api、web-pc、i18n、types、utils）
#### Fixed
- 修复图片缓存启动同步中的路径处理问题
- 修复格式转换控制器中的参数校验问题
- 修复 RSS 控制器中的路由处理问题
- 修复 RSS 存储清理服务中的路径清理逻辑
- 修复日志工具中的日志级别处理问题
- 修复依赖工具中的依赖解析问题

### English
#### Added
- Added user-dir-key support, laying foundation for user data isolation
- Added picture cache path management module, optimizing cache path generation
- Added RSS storage path service, unifying RSS resource storage path management
- Added user directory service for user directory management
- Added multiple unit tests covering picture cache, format conversion, log viewer, RSS storage path, user-dir-key, user directory, dependencies, logger, and path modules
#### Changed
- Refactored picture cache random core, startup sync, and unified cache modules to use new path service
- Refactored format conversion workspace service and runner, optimizing workspace management logic
- Refactored log viewer service, improving log query and display
- Refactored RSS-related services (archive, cache, incremental cache, HTML file, persist, cleanup, storage, resource proxy) to use new storage path service
- Refactored resource proxy cache service, optimizing caching strategy
- Updated user service to integrate user-dir-key functionality
- Updated frontend log viewer UI, improving styles and interaction
- Updated frontend home app card styles
- Updated package versions for api, web-pc, i18n, types, utils
#### Fixed
- Fixed path handling issue in picture cache startup sync
- Fixed parameter validation issue in format conversion controller
- Fixed route handling issue in RSS controller
- Fixed path cleanup logic in RSS storage cleanup service
- Fixed log level handling issue in logger utility
- Fixed dependency resolution issue in dependencies utility

## [1.1.14] - 2026-06-13

### 中文
#### Changed
- 修复类型定义

### English
#### Changed
- Fix type definition

## [1.1.12] - 2026-06-13

### 中文
#### Added
- 新增运行时日志查看模块，支持实时查看和解析日志
- 新增 WebSocket 共享运行时，支持前后端实时通信
- 格式转换任务支持实时状态推送，无需手动刷新
- 新增设置页面更新日志弹窗，方便查看版本变更
- 新增 PageCard 通用组件
#### Changed
- 优化日志维护工具，提升日志清理效率
- 改进格式转换任务列表，集成实时更新
- 更新系统设置相关页面，优化配置体验
- 更新国际化翻译文件，新增相关词条
#### Fixed
- 修复构建问题，确保编译通过
- 修复日志维护测试文件位置错误

### English
#### Added
- Added runtime log viewer module for real-time log viewing and parsing
- Added shared WebSocket runtime for real-time frontend-backend communication
- Format conversion tasks now support real-time status updates without manual refresh
- Added changelog modal in settings page for easy version history viewing
- Added PageCard common component
#### Changed
- Optimized log maintenance utility for improved log cleanup efficiency
- Improved format conversion task list with real-time updates integration
- Updated system settings related pages for better configuration experience
- Updated i18n translation files with new entries
#### Fixed
- Fixed build issues to ensure successful compilation
- Fixed incorrect location of log maintenance test file

## [1.1.10] - 2026-06-12

### 中文
#### Added
- 新增图片格式转换功能，支持将图片转换为 JPEG、PNG、WebP 等格式
- 新增批量选择功能，支持在格式转换中批量选择文件
- 新增本地批量上传功能，支持从本地上传多个文件进行转换
- 新增云端文件树浏览组件，支持从云端选择文件
- 新增转换类型切换组件，支持在媒体转换和图片转换之间切换
- 新增图片转换设置表单，支持配置图片质量、尺寸等选项
- 新增媒体转换面板和图片转换面板，分离不同转换类型的界面
- 新增工作台样式文件，优化转换任务卡片布局
#### Changed
- 重构格式转换任务卡片组件，拆分出多个子组件
- 优化格式转换选项表单，支持更多自定义设置
- 优化任务记录列表，增加删除记录功能
- 更新国际化翻译，新增图片转换相关文案
- 移动测试文件到统一的 __tests__ 目录
#### Fixed
- 修复格式转换任务数据库服务中的若干问题
- 修复错误处理工具中的类型定义问题

### English
#### Added
- Added image format conversion support, enabling conversion to JPEG, PNG, WebP, etc.
- Added batch selection feature for selecting multiple files in format conversion
- Added local batch upload feature for uploading multiple files from local
- Added cloud file tree browser component for selecting files from cloud
- Added conversion type switch component for toggling between media and image conversion
- Added image conversion settings form for configuring image quality, dimensions, etc.
- Added media conversion panel and image conversion panel, separating UI for different conversion types
- Added workbench style file, optimizing conversion task card layout
#### Changed
- Refactored format conversion task card component, splitting into multiple sub-components
- Optimized format conversion option form, supporting more custom settings
- Optimized task record list, adding record deletion functionality
- Updated internationalization translations, adding image conversion related copy
- Moved test files to unified __tests__ directory
#### Fixed
- Fixed several issues in format conversion task database service
- Fixed type definition issues in error handling utility

## [1.1.9] - 2026-06-11

### 中文
#### Added
- 新增图片缓存任务队列，支持异步处理缓存刷新
- 新增作用域运行时映射，用于管理不同作用域下的运行时实例
- 新增 FFmpeg 格式转换服务测试
- 新增国际化翻译条目
#### Changed
- 优化图片缓存文件系统文件夹逻辑
- 优化 SDK 服务中缓存相关逻辑
- 优化格式转换控制器和 FFmpeg 服务
- 优化 OpenList 格式转换服务
- 更新前端格式转换组件（云转换卡片、任务卡片、OpenList 浏览器）
- 更新依赖版本
#### Fixed
- 修复图片随机 API 中的缓存问题

### English
#### Added
- Added picture cache job queue for async cache refresh
- Added scoped runtime map to manage runtime instances per scope
- Added tests for FFmpeg format conversion service
- Added new i18n translation entries
#### Changed
- Optimized picture cache file system folder logic
- Optimized cache-related logic in SDK service
- Optimized format conversion controller and FFmpeg service
- Optimized OpenList format conversion service
- Updated frontend format conversion components (cloud convert card, task card, OpenList browser)
- Updated dependency versions
#### Fixed
- Fixed cache issue in picture random API

## [1.1.8] - 2026-06-11

### 中文
#### Added
- 新增上传进度弹窗组件，实时显示文件上传进度
- 新增页面关闭前未完成上传的提示功能
- 新增数据库迁移记录转换请求的 User-Agent
- 新增上传进度弹窗相关单元测试
#### Changed
- 优化转换任务卡片组件，支持上传进度展示
- 更新国际化文案，新增上传进度相关翻译
- 更新多个依赖包版本
#### Fixed
- 修复转换任务状态更新逻辑中的潜在问题

### English
#### Added
- Added upload progress modal component to display real-time file upload progress
- Added prompt for incomplete uploads before page unload
- Added database migration to record User-Agent for conversion requests
- Added unit tests for upload progress modal
#### Changed
- Optimized convert task card component to support upload progress display
- Updated i18n translations with upload progress related strings
- Updated multiple dependency package versions
#### Fixed
- Fixed potential issue in convert task status update logic

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
