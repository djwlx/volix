# SQLite Admin And Root Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only SQLite table editor in the home workspace and move test cases into a root-level `test/` setup backed by Vitest.

**Architecture:** Keep SQLite editing as structured CRUD over discovered table metadata instead of arbitrary SQL. Add a small admin module in `apps/api`, shared API types in `packages/types`, a dedicated `apps/web-pc` page linked from home for admins only, and a root Vitest setup that runs migrated regression tests from `test/`.

**Tech Stack:** Koa, Sequelize + SQLite, React + Semi UI, Vitest, TypeScript

---
