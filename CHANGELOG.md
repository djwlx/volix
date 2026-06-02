# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- For `GET /api/115/pic/cache/:pc?format=webp`, return the remote original image on cache miss and prewarm local/WebP cache asynchronously to avoid blocking first paint.
- Add a documentation redesign spec for splitting the README into bilingual entry points and dedicated Docker guides.
- Add bilingual README entry points, deployment notes, and dedicated Docker usage guides with published registry references for English and Chinese documentation.
- Add shared `zh-CN`/`en-US` i18n resources for web and API, wire frontend language switching and `volix-language` request propagation, and localize core settings, RSS, SQLite admin, and 115 user-facing copy.

### Fixed
- Fix garbled Chinese error message text in 115 liked-picture cache fallback path.
- Fix repeated settings data requests caused by unstable i18n hook dependencies, and restore missing translated status labels in the 115 cache UI.




## [1.1.3] - 2026-06-02

### 中文
#### Added
- 新增国际化支持 (i18n)
- 新增内存缓存机制
- 新增数据库错误处理
- 新增 Sharp 运行时配置工具
- 新增多项测试覆盖
#### Changed
- 优化图片缓存逻辑，提升性能
- 重构 115 SDK 错误处理
- 改进 RSS 订阅解析器
- 更新前端组件样式与交互
#### Fixed
- 修复图片缓存格式问题
- 修复随机查询服务中的边界情况

### English
#### Added
- Added internationalization (i18n) support
- Added memory caching mechanism
- Added database error handling
- Added Sharp runtime configuration utility
- Added multiple test coverage
#### Changed
- Optimized image caching logic for better performance
- Refactored 115 SDK error handling
- Improved RSS feed parser
- Updated frontend component styles and interactions
#### Fixed
- Fixed image cache format issue
- Fixed edge cases in random query service
## [1.1.2] - 2026-06-02

### 中文
#### Added
- 新增权限功能 (DJWL)
#### Changed
- 更新 Docker 发布工作流

### English
#### Added
- Add permission feature (DJWL)
#### Changed
- Update Docker release workflow
