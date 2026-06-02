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
