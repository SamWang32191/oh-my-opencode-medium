---
id: skill-loader-must-deduplicate-realpath-traversal
date: 2026-03-12
scope: project
tags:
  - skills
  - loader
  - symlink
  - traversal
source: bug-fix
confidence: 0.5
related:
  - '[[skill-loader-must-ignore-bad-user-skills]]'
---

# Skill loader must deduplicate realpath traversal

## Context
The skill loader walks user-controlled skill directories during startup and now follows symlinked directories so linked skill bundles work.

## Mistake
Traversal tracked only lexical paths, so cyclic or aliased symlink directories could be visited repeatedly before the filesystem finally errored.

## Lesson
When recursive startup discovery follows symlinks, resolve each directory to its realpath first and skip any realpath that was already visited.

## When to Apply
Apply this when adding or changing recursive file discovery for skills, prompts, configs, or any startup-loaded tree that may contain symlinks.
