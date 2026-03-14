---
id: package-rename-must-cover-shipped-docs-tests-and-migration-paths
date: 2026-03-14
scope: project
tags: [rename, packaging, docs, tests, migration]
source: retrospective
confidence: 0.3
related: []
---

# Package renames must update shipped docs, tests, and migration cleanup together

## Context
This repository was renamed from `oh-my-opencode-slim` to `oh-my-opencode-medium` across package metadata, runtime strings, config names, and published documentation.

## Mistake
The initial rename left behind references in shipped skill docs, logger tests, runtime log labels, and installer migration behavior for legacy plugin entries.

## Lesson
- When renaming a published package, verify all shipped artifacts, not just runtime source: docs included in `files`, skill docs, codemaps, and tests.
- Add or update migration tests for legacy package/config entries so rerunning installers produces a clean final state.
- Re-run `npm pack` and inspect the published payload after rename work, because packaged docs can still expose stale names even when tests pass.

## When to Apply
Apply this when renaming a package, CLI, plugin identity, or config basename, especially if the project publishes docs or skill files alongside runtime code.
