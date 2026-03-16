import { describe, expect, test } from 'bun:test';
import {
  buildMediumReleasePlan,
  getLatestStableUpstreamVersion,
  getNextMediumRelease,
  getReleaseCommitMessage,
  parseMediumTag,
} from './medium-version';

describe('parseMediumTag', () => {
  test('parses a matching medium release tag', () => {
    expect(parseMediumTag('v0.8.3-medium.2')).toEqual({
      upstreamVersion: '0.8.3',
      forkPatch: 2,
    });
  });
});

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

test('increments the highest matching medium release', () => {
  expect(
    getNextMediumRelease('0.8.3', ['v0.8.2-medium.7', 'v0.8.3-medium.2']),
  ).toEqual({
    packageVersion: '0.8.3-medium.3',
    gitTag: 'v0.8.3-medium.3',
  });
});

test('starts at medium.1 when no matching fork tag exists', () => {
  expect(getNextMediumRelease('0.8.4', ['v0.8.3-medium.2'])).toEqual({
    packageVersion: '0.8.4-medium.1',
    gitTag: 'v0.8.4-medium.1',
  });
});

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

test('throws when no stable upstream tag exists', () => {
  expect(() =>
    buildMediumReleasePlan({
      upstreamTags: ['v0.8.3-rc.1', 'not-a-tag'],
      existingTags: [],
    }),
  ).toThrow('No stable upstream tag found.');
});

test('formats the release commit message', () => {
  expect(getReleaseCommitMessage('0.8.3-medium.3')).toBe(
    'chore: release 0.8.3-medium.3',
  );
});
