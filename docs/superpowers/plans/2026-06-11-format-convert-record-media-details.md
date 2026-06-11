# Format Convert Record Media Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist ffprobe-based source/result media summaries on format convert tasks and show them in expandable task record rows.

**Architecture:** Extend shared task types with structured media-summary fields, persist them through the format-convert task model and runner, then render the summaries in a compact expanded-row UI with localized labels. Reuse ffprobe probing in the runner so cloud and local tasks both produce consistent metadata.

**Tech Stack:** TypeScript, Sequelize, Koa, React, Semi Table, Vitest, i18n JSON resources

---
