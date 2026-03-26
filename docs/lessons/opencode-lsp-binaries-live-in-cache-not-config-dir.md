---
id: opencode-lsp-binaries-live-in-cache-not-config-dir
date: 2026-03-26
scope: project
tags:
  - opencode
  - lsp
  - cache
  - config
  - paths
source: bug-fix
confidence: 0.5
related:
  - '[[plugin-auto-update-must-install-in-opencode-cache]]'
---

# OpenCode LSP binaries live in cache, not config dir

## Context

`src/tools/lsp/config.ts` used `OPENCODE_CONFIG_DIR/bin` (or
`~/.config/opencode/bin`) when checking whether an LSP binary was installed.
OpenCode 1.3.0+ moved managed binaries to the cache area instead.

## Mistake

I reused the old config-directory assumption for LSP binary lookup, so binaries
installed in OpenCode's real cache location could be reported as missing.

## Lesson

- For OpenCode 1.3.0+, binary discovery logic must treat the cache directory as
  the source of managed tools, not the config directory.
- Non-Windows lookup should use `XDG_CACHE_HOME/opencode/bin`, falling back to
  `~/.cache/opencode/bin` when unset or blank.
- Windows lookup should use `LOCALAPPDATA/opencode/bin`, falling back to
  `homedir()/opencode/bin` when `LOCALAPPDATA` is unavailable.

## When to Apply

Apply this when implementing or updating any OpenCode-managed binary lookup,
installation, validation, or diagnostics flow, especially when older code still
refers to `OPENCODE_CONFIG_DIR/bin`.
