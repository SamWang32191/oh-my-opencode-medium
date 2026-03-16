---
id: github-actions-merge-base-needs-full-history
date: 2026-03-16
scope: project
tags:
  - github-actions
  - git
  - releases
  - validation
  - history
source: retrospective
confidence: 0.3
related:
  - [[git-tags-only-capture-committed-version-bumps]]
---

# GitHub Actions merge-base checks need full history

## Context
While adding a release workflow guard that verifies a tagged commit is included
in `origin/medium`, the workflow used `git merge-base --is-ancestor HEAD
origin/medium` inside GitHub Actions.

## Mistake
I initially treated the default checkout history as sufficient. GitHub Actions
uses a shallow checkout by default, which can make ancestry checks fail even
when the tagged commit is valid.

## Lesson
- If a workflow uses `git merge-base --is-ancestor`, make sure the checkout or a
  follow-up fetch provides enough history for the comparison.
- Prefer an explicit history strategy in the workflow, such as
  `actions/checkout` with `fetch-depth: 0`, when release validation depends on
  branch ancestry.

## When to Apply
Apply this when writing GitHub Actions workflows that validate tags, branch
reachability, or commit ancestry before publishing or deploying.
