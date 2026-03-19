import type { CommandDefinition } from './types';

interface MergeCommandsInput {
  builtin?: Record<string, CommandDefinition>;
  skills?: Record<string, CommandDefinition>;
  existing?: Record<string, CommandDefinition>;
}

export function mergeCommands({
  builtin = {},
  skills = {},
  existing = {},
}: MergeCommandsInput): Record<string, CommandDefinition> {
  return {
    ...builtin,
    ...skills,
    ...existing,
  };
}
