import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

interface OpenCodeConfig {
  command?: Record<
    string,
    {
      description?: string;
      template: string;
      model?: string;
      agent?: string;
      subtask?: boolean;
    }
  >;
  default_agent?: string;
}

describe('handoff command wiring', () => {
  let tempDir: string;
  let originalEnv: typeof process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-index-test-'));
    originalEnv = { ...process.env };

    process.env.HOME = path.join(tempDir, 'home');
    process.env.XDG_CONFIG_HOME = path.join(tempDir, 'xdg-config');
    fs.mkdirSync(process.env.HOME, { recursive: true });
    fs.mkdirSync(process.env.XDG_CONFIG_HOME, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  async function createPluginFor(projectDir: string) {
    const module = await import('./index');
    const { default: pluginFactory } = module;

    return pluginFactory({
      directory: projectDir,
      client: {
        provider: {
          list: vi.fn().mockResolvedValue([]),
        },
      },
    } as never);
  }

  test('built-in handoff exists by default', async () => {
    const projectDir = path.join(tempDir, 'project-default');
    fs.mkdirSync(projectDir, { recursive: true });

    const plugin = await createPluginFor(projectDir);
    const opencodeConfig: OpenCodeConfig = {};
    await plugin.config(opencodeConfig as Record<string, unknown>);

    expect(opencodeConfig.command?.handoff).toBeDefined();
    expect(opencodeConfig.command?.handoff.agent).toBe('orchestrator');
  });

  test('project handoff skill overrides built-in handoff command', async () => {
    const projectDir = path.join(tempDir, 'project-skill-override');
    const skillsDir = path.join(projectDir, '.opencode', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'handoff.md'),
      '---\ndescription: project handoff\n---\nProject skill handoff template',
    );

    const plugin = await createPluginFor(projectDir);
    const opencodeConfig: OpenCodeConfig = {};
    await plugin.config(opencodeConfig as Record<string, unknown>);

    expect(opencodeConfig.command?.handoff).toBeDefined();
    expect(opencodeConfig.command?.handoff.template).toContain(
      'Project skill handoff template',
    );
  });

  test('explicit user handoff override wins and unrelated commands stay', async () => {
    const projectDir = path.join(tempDir, 'project-user-override');
    const skillsDir = path.join(projectDir, '.opencode', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, 'handoff.md'),
      '---\ndescription: project handoff\n---\nProject skill handoff template',
    );

    const plugin = await createPluginFor(projectDir);
    const opencodeConfig: OpenCodeConfig = {
      command: {
        handoff: {
          description: 'user handoff',
          template: 'User-defined handoff template',
          agent: 'researcher',
        },
        review: {
          template: 'Existing review command',
        },
      },
    };

    await plugin.config(opencodeConfig as Record<string, unknown>);

    expect(opencodeConfig.command?.handoff.template).toBe(
      'User-defined handoff template',
    );
    expect(opencodeConfig.command?.handoff.agent).toBe('researcher');
    expect(opencodeConfig.command?.review).toEqual({
      template: 'Existing review command',
    });
  });
});
