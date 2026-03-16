---
id: git-tags-only-capture-committed-version-bumps
date: 2026-03-16
scope: project
tags:
  - git
  - tags
  - releases
  - versioning
  - automation
source: retrospective
confidence: 0.3
related: []
---

# Git tags only capture committed version bumps

## Context
While building a release helper that updates `package.json` and creates a git
tag, the initial implementation wrote the new version and then created the tag
without creating a commit first.

## Mistake
I treated the tag as if it would capture the working tree state. Git tags point
to commits, so the tag would have referenced the old `HEAD` and missed the new
`package.json` version.

## Lesson
- When release automation updates version files and also creates a tag, commit
  the version bump before creating the tag.
- If the workflow must stay no-commit, split it into separate steps instead of
  pretending the tag includes uncommitted changes.

## When to Apply
Apply this when writing release scripts, version bump automation, or any git
workflow that updates files and then immediately creates tags.
