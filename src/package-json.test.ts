import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('package.json metadata', () => {
  test('exports CLI bin with npm-safe relative path', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.bin).toEqual({
      'oh-my-opencode-medium': 'dist/cli/index.js',
    });

    expect(packageJson.scripts?.['release:medium']).toBe(
      'bun run scripts/release-medium.ts',
    );
    expect(packageJson.scripts?.['release:medium:dry']).toBe(
      'bun run scripts/release-medium.ts --dry-run',
    );
  });
});
