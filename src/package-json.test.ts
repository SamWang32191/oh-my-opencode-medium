import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

describe('package.json metadata', () => {
  test('exports CLI bin with npm-safe relative path', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.bin).toEqual({
      'oh-my-opencode-medium': 'dist/cli/index.js',
    });

    expect(packageJson.scripts?.release).toBe(
      'bun run scripts/release-medium.ts',
    );
    expect(packageJson.scripts?.['release:dry']).toBe(
      'bun run scripts/release-medium.ts --dry-run',
    );
    expect(packageJson.scripts?.['release:medium']).toBeUndefined();
    expect(packageJson.scripts?.['release:medium:dry']).toBeUndefined();
  });

  test('publishes the documented medium schema with hashline_edit', () => {
    expect(existsSync('oh-my-opencode-medium.schema.json')).toBe(true);

    const schema = JSON.parse(
      readFileSync('oh-my-opencode-medium.schema.json', 'utf8'),
    ) as {
      properties?: Record<string, unknown>;
    };

    expect(schema.properties?.hashline_edit).toEqual({
      type: 'boolean',
    });
  });
});
