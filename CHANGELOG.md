# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- Add a pre-commit changelog check to require updating `CHANGELOG.md` for code changes.
- For `GET /api/115/pic/cache/:pc?format=webp`, return the remote original image on cache miss and prewarm local/WebP cache asynchronously to avoid blocking first paint.

### Fixed
- Fix garbled Chinese error message text in 115 liked-picture cache fallback path.

