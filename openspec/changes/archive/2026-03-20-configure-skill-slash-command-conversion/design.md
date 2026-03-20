## Context

The plugin currently discovers skills and always feeds them into command registration during the `config` hook in `src/index.ts`. Configuration already supports opt-in and opt-out booleans such as `hashline_edit`, so this change should follow the same schema and runtime pattern while keeping the current slash-command behavior as the default.

## Goals / Non-Goals

**Goals:**
- Add a boolean plugin config flag that controls whether discovered skills are exposed as slash commands.
- Preserve the current default behavior so existing users keep their skill-backed commands without migration.
- Ensure disabling the flag only removes auto-generated skill commands and does not affect builtin or user-defined commands.
- Cover the new behavior with focused config and integration tests.

**Non-Goals:**
- Changing skill discovery paths or how skills are parsed.
- Changing merge precedence between builtin, skill, and user-defined commands.
- Adding per-skill or per-directory filtering; this change is a single global on/off switch.

## Decisions

- Add a top-level boolean config field in `PluginConfigSchema` with metadata describing that skill-to-slash-command conversion is enabled by default. This matches the existing config authoring pattern and keeps the setting visible alongside related plugin toggles.
- Gate the `discoverAllSkills()` result before command merging in `src/index.ts` by passing an empty skill command map when the flag is `false`. This keeps the merge pipeline unchanged and isolates the behavior change to one integration point.
- Preserve builtin and user-defined commands regardless of the new flag by continuing to call `mergeCommands()` with builtin and existing command sources. The flag only changes the `skills` input.
- Add regression tests in config and command registration integration areas to verify the default-enabled path and the explicit-disabled path. This is preferred over changing loader tests because the behavior change happens at configuration wiring rather than skill parsing.

## Risks / Trade-offs

- [Risk] Users may misread the new flag as disabling skills entirely rather than only slash-command registration. -> Mitigation: use a precise config description that states it only controls conversion into slash commands.
- [Risk] Skipping skill command registration in `src/index.ts` could hide future assumptions that skill discovery always runs. -> Mitigation: keep the change limited to the merge input and cover both enabled and disabled flows with integration tests.
- [Trade-off] A global toggle is simpler to implement but less flexible than per-skill configuration. -> Mitigation: keep scope narrow now and revisit finer-grained controls only if users ask for them.
