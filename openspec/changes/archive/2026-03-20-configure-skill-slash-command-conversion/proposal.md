## Why

The plugin currently always converts discovered skills into slash commands, which makes the behavior hard to opt out of when users want skills available on disk without registering them as commands. Adding a configuration switch preserves the current default while letting users disable command generation in environments where it conflicts with their workflow.

## What Changes

- Add a plugin configuration flag that controls whether discovered skills are converted into slash commands.
- Keep the default behavior enabled so existing installations continue to register skill-backed slash commands without changes.
- Skip skill command registration when the flag is explicitly disabled, while preserving builtin commands and user-defined commands.
- Add tests for config parsing and command registration when the feature is enabled and disabled.

## Capabilities

### New Capabilities
- `skill-slash-command-toggle`: Lets users disable automatic conversion of discovered skills into slash commands while leaving the default behavior enabled.

### Modified Capabilities

## Impact

- Affects plugin configuration schema and documentation metadata in `src/config/schema.ts`.
- Affects command registration flow in `src/index.ts` and related skill command discovery wiring.
- Affects tests covering config loading, skill discovery integration, and command merging behavior.
