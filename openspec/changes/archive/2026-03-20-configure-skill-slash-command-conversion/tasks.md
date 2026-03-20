## 1. Configuration Schema

- [x] 1.1 Add a plugin config boolean for skill-to-slash-command conversion in `src/config/schema.ts` with metadata showing it defaults to enabled.
- [x] 1.2 Add or update config loader tests to verify the new flag is accepted and preserves the default-enabled behavior when omitted.

## 2. Command Registration

- [x] 2.1 Update the plugin `config` hook in `src/index.ts` so skill-backed slash commands are only merged when the new flag is not `false`.
- [x] 2.2 Ensure builtin commands and user-defined commands remain registered when skill slash command conversion is disabled.

## 3. Verification

- [x] 3.1 Add or update integration tests covering the default-enabled path for discovered skill commands.
- [x] 3.2 Add or update integration tests covering the explicit-disabled path and confirm no skill-backed slash commands are registered.
