#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  buildMediumReleasePlan,
  getReleaseCommitMessage,
} from '../src/release/medium-version';

type PackageJson = {
  version?: string;
  [key: string]: unknown;
};

function runGitCommand(args: string[], errorMessage: string) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim();
    throw new Error(details ? `${errorMessage}\n${details}` : errorMessage);
  }

  return result.stdout.trim();
}

function ensureUpstreamRemoteExists() {
  runGitCommand(
    ['remote', 'get-url', 'upstream'],
    "Remote 'upstream' is not configured.",
  );
}

function ensureOnMediumBranch() {
  const branchName = runGitCommand(
    ['symbolic-ref', '--short', 'HEAD'],
    'Release script must run from the medium branch.',
  );

  if (branchName !== 'medium') {
    throw new Error(
      `Release script must run from the medium branch. Current branch: ${branchName}`,
    );
  }
}

function ensureCleanWorkingTree() {
  const statusOutput = runGitCommand(
    ['status', '--porcelain'],
    'Failed to read working tree status.',
  );

  if (statusOutput !== '') {
    throw new Error('Working tree must be clean before releasing medium.');
  }
}

function ensureTagDoesNotExist(tagName: string) {
  const existingTag = runGitCommand(
    ['tag', '--list', tagName],
    `Failed to check whether tag ${tagName} exists.`,
  );

  if (existingTag !== '') {
    throw new Error(`Tag already exists: ${tagName}`);
  }
}

function fetchUpstreamTags() {
  runGitCommand(
    ['fetch', 'upstream', '--prune', '--tags'],
    'Failed to fetch upstream tags.',
  );
}

function getAllTags() {
  const output = runGitCommand(['tag', '--list'], 'Failed to list git tags.');
  return output === '' ? [] : output.split('\n');
}

function readPackageJson() {
  try {
    return JSON.parse(readFileSync('package.json', 'utf8')) as PackageJson;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse package.json\n${message}`);
  }
}

function writePackageVersion(packageVersion: string) {
  try {
    const packageJson = readPackageJson();
    packageJson.version = packageVersion;
    writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write package.json\n${message}`);
  }
}

function createAnnotatedTag(tagName: string) {
  runGitCommand(
    ['tag', '-a', tagName, '-m', `medium release ${tagName}`],
    `Failed to create annotated tag ${tagName}.`,
  );
}

function commitPackageVersion(packageVersion: string) {
  runGitCommand(['add', 'package.json'], 'Failed to stage package.json.');
  runGitCommand(
    ['commit', '-m', getReleaseCommitMessage(packageVersion)],
    `Failed to commit package.json for ${packageVersion}.`,
  );
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  ensureUpstreamRemoteExists();
  ensureOnMediumBranch();
  ensureCleanWorkingTree();
  fetchUpstreamTags();

  const tags = getAllTags();
  const releasePlan = buildMediumReleasePlan({
    upstreamTags: tags,
    existingTags: tags,
  });

  if (dryRun) {
    console.log(`Upstream tag: ${releasePlan.upstreamTag}`);
    console.log(`Package version: ${releasePlan.packageVersion}`);
    console.log(`Git tag: ${releasePlan.gitTag}`);
    return;
  }

  ensureTagDoesNotExist(releasePlan.gitTag);
  writePackageVersion(releasePlan.packageVersion);
  commitPackageVersion(releasePlan.packageVersion);
  ensureTagDoesNotExist(releasePlan.gitTag);
  createAnnotatedTag(releasePlan.gitTag);

  console.log(`Updated package.json to ${releasePlan.packageVersion}`);
  console.log(`Created tag ${releasePlan.gitTag}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
