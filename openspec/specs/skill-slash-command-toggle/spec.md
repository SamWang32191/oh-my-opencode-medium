## Purpose

Define the expected behavior for exposing discovered skills as slash commands,
including the configuration switch that disables this conversion while
preserving builtin and user-defined commands.

## Requirements

### Requirement: Skill slash command conversion can be disabled by configuration
The plugin SHALL provide a configuration flag that controls whether discovered
skills are converted into slash commands, and the flag MUST default to enabled
when omitted.

#### Scenario: Configuration omitted
- **WHEN** the plugin loads configuration and the skill slash command
  conversion flag is not set
- **THEN** discovered skills are converted into slash commands

#### Scenario: Configuration explicitly enabled
- **WHEN** the plugin loads configuration and the skill slash command
  conversion flag is set to `true`
- **THEN** discovered skills are converted into slash commands

#### Scenario: Configuration explicitly disabled
- **WHEN** the plugin loads configuration and the skill slash command
  conversion flag is set to `false`
- **THEN** discovered skills are not converted into slash commands

### Requirement: Disabling skill slash command conversion preserves other commands
When skill slash command conversion is disabled, the plugin MUST continue
registering builtin commands and MUST preserve user-defined commands supplied by
OpenCode configuration.

#### Scenario: Builtin commands remain available
- **WHEN** skill slash command conversion is disabled
- **THEN** builtin plugin commands remain registered

#### Scenario: User-defined commands remain available
- **WHEN** skill slash command conversion is disabled and the user has defined
  custom commands
- **THEN** the custom commands remain registered unchanged
