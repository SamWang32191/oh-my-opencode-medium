import { describe, expect, test } from 'bun:test';
import { createBuiltinCommands } from './builtin';

describe('createBuiltinCommands', () => {
  test('includes a built-in handoff command that targets orchestrator', () => {
    const commands = createBuiltinCommands();

    expect(commands.handoff).toBeDefined();
    expect(commands.handoff.agent).toBe('orchestrator');
  });
});
