# README Documentation Restructure Design

## Summary

Restructure the project documentation around a concise English-first GitHub entry point, with a mirrored Chinese README and dedicated Docker guides in both languages. The main README files should explain what Volix is, how to install and run it for development, and where to find Docker-specific instructions without mixing deployment detail into the homepage.

## Goals

- Make the repository homepage easier to scan for new users.
- Provide an English default README and a Chinese mirror.
- Move Docker usage into dedicated documentation files.
- Keep the main README focused on introduction, installation, project structure, and common development commands.

## Non-Goals

- Changing product behavior, build logic, or release automation.
- Rewriting all project documentation outside the README and Docker guides.
- Adding advanced deployment options beyond the current Docker workflow.

## Current State

The current `README.md` is Chinese-only and mixes multiple concerns:

- project introduction
- feature descriptions
- development environment setup
- build and deployment flow
- Docker usage
- roadmap and internal implementation detail

This makes the main page longer than necessary and reduces clarity for both English readers and users who only need quick setup guidance.

## Proposed Structure

### Files

- `README.md`
- `README.zh-CN.md`
- `docs/docker.md`
- `docs/docker.zh-CN.md`

### README.md

English-first landing document with these sections:

1. Intro
2. Features
3. Installation
4. Project Structure
5. Development

The installation section should include:

- runtime requirements
- dependency installation
- development startup
- production build entry points
- links to Docker documentation

It should not include detailed Docker commands beyond a pointer to the Docker guide.

### README.zh-CN.md

Chinese mirror of the English README with equivalent structure and intent:

1. 简介
2. 功能概览
3. 安装
4. 项目结构
5. 开发命令

The Chinese version should be a proper translation, not a partially diverged rewrite, so maintenance stays predictable.

### docs/docker.md

English Docker guide focused on operational usage:

1. Overview
2. Build Image
3. Run Container
4. Persistent Data
5. Upgrade Container
6. Notes

Expected content:

- `pnpm build` prerequisite when building locally
- `docker build`
- `docker run`
- port exposure
- `data` directory volume mapping
- replacing a container while preserving mounted data

### docs/docker.zh-CN.md

Chinese mirror of `docs/docker.md` with the same structure and operational scope.

## Content Rules

- Keep the README concise and user-facing.
- Remove roadmap content from the main README.
- Avoid implementation-heavy explanations unless they directly help installation or development.
- Keep both language variants aligned in section order and scope.
- Use stable links between the two README files and from each README to its Docker guide.

## Proposed README Content Level

The main README should follow a medium-detail level:

- enough context for a new developer or self-hosting user to understand the project
- enough commands to get running locally
- not enough detail to duplicate dedicated deployment documentation

This keeps the homepage useful without turning it into an operations manual.

## Linking Strategy

Each README should include:

- a language switch link to the alternate README
- a visible link to the Docker guide in the same language

This creates a clear navigation path:

- homepage overview
- local install and development
- Docker usage in dedicated docs

## Risks and Mitigations

### Risk: language drift

The English and Chinese files may diverge over time.

Mitigation:

- keep both files structurally identical
- keep Docker docs mirrored the same way
- prefer concise sections so updates stay small

### Risk: missing operational detail after trimming README

Users may miss Docker setup steps if the README becomes too short.

Mitigation:

- keep the Docker guide link prominent in Installation
- ensure the Docker guide contains complete runnable commands

## Testing and Verification

Verification for this documentation change should include:

- confirm all referenced files exist
- confirm README links are valid
- confirm Docker commands match the existing repository flow
- review both language files for section parity

## Implementation Notes

The actual implementation should update only documentation files unless a broken link or referenced path requires a minimal supporting adjustment. The existing Docker release workflow does not need modification for this task.
