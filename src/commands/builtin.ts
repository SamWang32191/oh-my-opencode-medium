import { HANDOFF_TEMPLATE } from './templates/handoff';
import type { CommandDefinition } from './types';

const allBuiltinCommands: Record<string, CommandDefinition> = {
  handoff: {
    description: 'Create a continuation handoff for the next agent session.',
    template: HANDOFF_TEMPLATE,
    agent: 'orchestrator',
  },
};

export function createBuiltinCommands(): Record<string, CommandDefinition> {
  return { ...allBuiltinCommands };
}
