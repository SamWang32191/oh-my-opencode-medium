---
id: nested-skill-command-names-should-preserve-root-relative-path
date: 2026-03-13
scope: project
tags:
  - skills
  - loader
  - commands
  - naming
  - symlink
source: bug-fix
confidence: 0.5
related:
  - '[[skill-loader-must-deduplicate-realpath-traversal]]'
---

# Nested skill command names should preserve the root-relative path

## Context
The skill loader supports wrapped skills discovered from nested directories, including bundles exposed through symlinked roots like `superpowers/brainstorming`.

## Mistake
Wrapped skills used only the leaf directory name as the slash command, and nested wrapped skills with frontmatter `name` also let that leaf-style override erase the namespace, so bundles lost their prefix and could collide with other skills.

## Lesson
When loading wrapped skills from directories, derive the slash command name from the path relative to the configured skill root and join path segments with `:`. If a nested wrapped skill also defines frontmatter `name`, keep the discovered namespace and only replace the final segment unless the configured name is already fully qualified.

## When to Apply
Apply this when changing skill discovery, command registration, or any loader that maps nested filesystem paths into user-facing command names.
