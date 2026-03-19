import { describe, expect, it } from 'bun:test';
import { mergeCommands } from './register';
import type { CommandDefinition } from './types';

function command(template: string): CommandDefinition {
  return { template };
}

describe('mergeCommands', () => {
  it('keeps built-in commands by default', () => {
    const merged = mergeCommands({
      builtin: {
        handoff: command('Builtin handoff template'),
      },
    });

    expect(merged).toEqual({
      handoff: command('Builtin handoff template'),
    });
  });

  it('lets discovered skills override built-ins', () => {
    const merged = mergeCommands({
      builtin: {
        handoff: command('Builtin handoff template'),
      },
      skills: {
        handoff: command('Skill handoff template'),
      },
    });

    expect(merged.handoff).toEqual(command('Skill handoff template'));
  });

  it('lets explicit user commands override skills and built-ins', () => {
    const merged = mergeCommands({
      builtin: {
        handoff: command('Builtin handoff template'),
      },
      skills: {
        handoff: command('Skill handoff template'),
      },
      existing: {
        handoff: command('User handoff template'),
      },
    });

    expect(merged.handoff).toEqual(command('User handoff template'));
  });

  it('preserves unrelated existing commands', () => {
    const merged = mergeCommands({
      builtin: {
        handoff: command('Builtin handoff template'),
      },
      skills: {
        review: command('Skill review template'),
      },
      existing: {
        existing: command('User existing template'),
      },
    });

    expect(merged).toEqual({
      handoff: command('Builtin handoff template'),
      review: command('Skill review template'),
      existing: command('User existing template'),
    });
  });
});
