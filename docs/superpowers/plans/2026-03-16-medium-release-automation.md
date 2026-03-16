# Medium Release Automation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local `medium` release helper that derives the next fork version from upstream tags, updates `package.json`, and creates an annotated git tag without pushing or publishing.

**Architecture:** Keep the git-facing entrypoint in `scripts/release-medium.ts` and move version parsing/calculation into a small helper module so the tricky logic is testable without mocking a repository. Expose the workflow through `package.json` scripts for normal and dry-run execution.

**Tech Stack:** Bun, TypeScript, Bun test, git CLI, JSON file I/O

---

## File Map

- Create: `scripts/release-medium.ts` - validates git state, fetches upstream tags, computes release version, updates `package.json`, creates annotated git tag, supports `--dry-run`
- Create: `src/release/medium-version.ts` - parses release tags, filters upstream tags, computes next `medium` package/tag versions
- Create: `src/release/medium-version.test.ts` - TDD coverage for parsing and next-version calculation
- Modify: `package.json` - add `release:medium` and `release:medium:dry` scripts

## Chunk 1: Version Calculation Helpers

### Task 1: Add the first failing parsing test

**Files:**
- Create: `src/release/medium-version.test.ts`
- Create: `src/release/medium-version.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'bun:test';
import { parseMediumTag } from './medium-version';

describe('parseMediumTag', () => {
  test('parses a matching medium release tag', () => {
    expect(parseMediumTag('v0.8.3-medium.2')).toEqual({
      upstreamVersion: '0.8.3',
      forkPatch: 2,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/release/medium-version.test.ts`
Expected: FAIL because `./medium-version` or `parseMediumTag` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
const MEDIUM_TAG_PATTERN = /^v(\d+\.\d+\.\d+)-medium\.(\d+)$/;

export function parseMediumTag(tag: string) {
  const match = MEDIUM_TAG_PATTERN.exec(tag);

  if (!match) {
    return null;
  }

  return {
    upstreamVersion: match[1],
    forkPatch: Number.parseInt(match[2], 10),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/release/medium-version.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/release/medium-version.ts src/release/medium-version.test.ts
git commit -m "test: add medium tag parsing helper"
```

### Task 2: Drive upstream semver selection and next-version calculation

**Files:**
- Modify: `src/release/medium-version.test.ts`
- Modify: `src/release/medium-version.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import {
  getLatestStableUpstreamVersion,
  getNextMediumRelease,
} from './medium-version';

test('selects the latest stable upstream version by semver', () => {
  expect(
    getLatestStableUpstreamVersion([
      'v0.8.9',
      'v0.10.0',
      'v0.10.0-rc.1',
      'v1.2',
      'not-a-tag',
    ]),
  ).toBe('0.10.0');
});

test('starts a new upstream version at medium.1', () => {
  expect(
    getNextMediumRelease('0.8.3', ['v0.8.2-medium.7', 'v0.8.3-medium.2']),
  ).toEqual({
    packageVersion: '0.8.3-medium.3',
    gitTag: 'v0.8.3-medium.3',
  });
});

test('uses medium.1 when no matching fork tag exists', () => {
  expect(getNextMediumRelease('0.8.4', ['v0.8.3-medium.2'])).toEqual({
    packageVersion: '0.8.4-medium.1',
    gitTag: 'v0.8.4-medium.1',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/release/medium-version.test.ts`
Expected: FAIL because the new functions do not exist or return the wrong result.

- [ ] **Step 3: Write minimal implementation**

```ts
const STABLE_UPSTREAM_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;

function compareVersions(a: string, b: string) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (aParts[index] !== bParts[index]) {
      return aParts[index] - bParts[index];
    }
  }

  return 0;
}

export function getLatestStableUpstreamVersion(tags: string[]) {
  const versions = tags
    .map((tag) => {
      const match = STABLE_UPSTREAM_TAG_PATTERN.exec(tag);
      return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
    })
    .filter((version): version is string => version !== null)
    .sort(compareVersions);

  return versions.at(-1) ?? null;
}

export function getNextMediumRelease(
  upstreamVersion: string,
  existingTags: string[],
) {
  const highestForkPatch = existingTags
    .map(parseMediumTag)
    .filter(
      (
        parsed,
      ): parsed is { upstreamVersion: string; forkPatch: number } =>
        parsed !== null && parsed.upstreamVersion === upstreamVersion,
    )
    .reduce((highest, parsed) => Math.max(highest, parsed.forkPatch), 0);

  const nextForkPatch = highestForkPatch + 1;
  const packageVersion = `${upstreamVersion}-medium.${nextForkPatch}`;

  return {
    packageVersion,
    gitTag: `v${packageVersion}`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/release/medium-version.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/release/medium-version.ts src/release/medium-version.test.ts
git commit -m "feat: add medium release version calculator"
```

## Chunk 2: Release Script Entrypoint

### Task 3: Add a dry-run test seam and implement the git/file workflow

**Files:**
- Modify: `src/release/medium-version.ts`
- Create: `scripts/release-medium.ts`

- [ ] **Step 1: Write the failing test**

Add a pure helper export that formats the release plan so the entrypoint stays thin:

```ts
import { buildMediumReleasePlan } from './medium-version';

test('builds the next release plan from upstream and existing tags', () => {
  expect(
    buildMediumReleasePlan({
      upstreamTags: ['v0.8.3', 'v0.8.2'],
      existingTags: ['v0.8.3-medium.2'],
    }),
  ).toEqual({
    upstreamTag: 'v0.8.3',
    packageVersion: '0.8.3-medium.3',
    gitTag: 'v0.8.3-medium.3',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/release/medium-version.test.ts`
Expected: FAIL because `buildMediumReleasePlan` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `buildMediumReleasePlan` in `src/release/medium-version.ts` by combining `getLatestStableUpstreamVersion` and `getNextMediumRelease` and throwing a clear error when no stable upstream tag is found.

Create `scripts/release-medium.ts` with these responsibilities:

```ts
#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs';
import { buildMediumReleasePlan } from '../src/release/medium-version';

// helper: run git command and return stdout or throw descriptive error
// helper: assert upstream remote exists
// helper: assert current branch is medium
// helper: assert clean working tree
// helper: read package.json and update only the version field
// helper: create annotated tag unless --dry-run
```

Implementation details to follow exactly:
- use `git remote get-url upstream` to validate the remote exists
- use `git symbolic-ref --short HEAD` for the branch check
- use `git status --porcelain` for the clean-tree check
- run `git fetch upstream --prune --tags`
- gather all tags with `git tag --list`
- compute the plan from helper functions
- in `--dry-run`, print the upstream tag, package version, and git tag
- in normal mode, update `package.json` `version`, then re-check `git tag --list <target>` immediately before `git tag -a`
- use tag message `medium release vX.Y.Z-medium.N`

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/release/medium-version.test.ts`
Expected: PASS

- [ ] **Step 5: Manually verify dry-run output**

Run: `bun run scripts/release-medium.ts --dry-run`
Expected: either a computed release plan that prints upstream tag, package version, and git tag, or a clear precondition error without modifying files or creating tags.

- [ ] **Step 6: Commit**

```bash
git add src/release/medium-version.ts src/release/medium-version.test.ts scripts/release-medium.ts
git commit -m "feat: add medium release helper script"
```

### Task 3b: Add release precondition guards

**Files:**
- Modify: `scripts/release-medium.ts`

- [ ] **Step 1: Add upstream remote validation**

Implement a helper that runs `git remote get-url upstream` and throws an actionable error when the remote is missing.

- [ ] **Step 2: Add branch validation**

Implement a helper that runs `git symbolic-ref --short HEAD` and throws when the current branch is not exactly `medium` or when HEAD is detached.

- [ ] **Step 3: Add clean working tree validation**

Implement a helper that runs `git status --porcelain` and throws when any output is present.

- [ ] **Step 4: Add duplicate tag guard**

Implement a helper that runs `git tag --list <targetTag>` and fails when the target already exists; call it once before writing `package.json` and again immediately before creating the tag.

- [ ] **Step 5: Manually verify one failure path**

Run a validation helper in a controlled invalid state if available, or review the code path and confirm each thrown message is specific to its failed precondition.

- [ ] **Step 6: Commit**

```bash
git add scripts/release-medium.ts
git commit -m "feat: validate medium release preconditions"
```

## Chunk 3: Package Script Wiring and Verification

### Task 4: Wire the script into `package.json`

**Files:**
- Modify: `package.json`
- Test: `src/package-json.test.ts`

- [ ] **Step 1: Write the failing test**

Extend `src/package-json.test.ts` with assertions for:

```ts
expect(packageJson.scripts?.['release:medium']).toBe(
  'bun run scripts/release-medium.ts',
);
expect(packageJson.scripts?.['release:medium:dry']).toBe(
  'bun run scripts/release-medium.ts --dry-run',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/package-json.test.ts`
Expected: FAIL because the scripts are not present yet.

- [ ] **Step 3: Write minimal implementation**

Update `package.json` scripts:

```json
{
  "scripts": {
    "release:medium": "bun run scripts/release-medium.ts",
    "release:medium:dry": "bun run scripts/release-medium.ts --dry-run"
  }
}
```

When the release script updates `package.json`, it must preserve valid JSON and write back with `JSON.stringify(packageJson, null, 2) + '\n'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/package-json.test.ts`
Expected: PASS

- [ ] **Step 5: Run project verification**

Run: `bun run typecheck && bun test src/release/medium-version.test.ts src/package-json.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json src/package-json.test.ts
git commit -m "chore: wire medium release commands"
```

## Final Verification

- [ ] Run: `bun run typecheck`
- [ ] Run: `bun test src/release/medium-version.test.ts src/package-json.test.ts`
- [ ] Run: `bun run release:medium:dry`
- [ ] Confirm `package.json` is unchanged after dry-run
- [ ] Confirm no tag is created after dry-run
