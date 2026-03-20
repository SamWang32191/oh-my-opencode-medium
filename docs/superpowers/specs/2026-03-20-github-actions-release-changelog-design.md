# GitHub Actions Release Changelog Automation

## Summary

Move the release entrypoint from the local terminal to a manually triggered GitHub
Actions workflow while keeping version selection explicit. The new workflow should
accept a release version, generate a categorized changelog from merged pull
requests since the previous stable release tag, update release metadata, create
the release commit and tag, publish to npm, and create the GitHub Release
without requiring a local `bun run release` invocation.

This change is driven by two gaps in the current flow: release operators still
need a fully prepared local environment, and release notes only support a
single manually entered line instead of a useful changelog.

## Current State

Today the repository has:

1. a local release entry script at `scripts/release.ts`
2. a tag-driven publish workflow at `.github/workflows/release.yml`
3. provenance helpers in `src/release/medium-version.ts` and
   `src/release/release-mapping.ts`

The current operator flow is:

1. switch to `medium`
2. run `bun run release -- --version X.Y.Z [--notes "..."]`
3. let the script update `package.json` and `docs/release-mapping.md`
4. let the script create and push the release tag
5. let GitHub Actions publish to npm after the tag push

This flow already automates provenance tracking and GitHub Release creation, but
it still depends on a local git and GitHub CLI environment and does not produce
a structured changelog. The `--notes` field is intentionally limited to a single
line so it can be stored in `docs/release-mapping.md`, which makes it unsuitable
as the main release summary.

The current repository history also includes some direct commits on release
branches in addition to merged pull requests. Any changelog design that relies
primarily on PR metadata must account for non-PR commits so release notes do not
quietly omit shipped changes.

## Goals

- Remove the requirement to perform releases from a local machine.
- Keep version selection manual and explicit per release.
- Generate a categorized changelog automatically for each release.
- Prefer pull request labels for changelog grouping.
- Fall back to pull request title prefixes when labels are missing.
- Preserve the existing upstream provenance rules and mapping document.
- Keep npm publishing on GitHub Actions with Trusted Publisher and provenance.

## Non-Goals

- Automatic semantic version calculation.
- Automatic release creation on every merge to `medium`.
- Replacing the provenance mapping document with a generated changelog file.
- Building a generalized release platform for unrelated repositories.
- Rewriting historical release notes beyond what is already committed.

## Options Considered

### Option 1: Manual GitHub Actions release workflow with generated changelog

Add a new `workflow_dispatch` release workflow that takes an explicit version
input, computes provenance, generates changelog content from merged PRs, updates
release files, creates the release commit and tag, and publishes from GitHub.

Pros:

- Removes the local release requirement.
- Preserves human control over release timing and version numbers.
- Fits the current stable-version and provenance rules.
- Centralizes release permissions and audit trail in GitHub Actions.

Cons:

- Requires workflow write access and bot-safe git push behavior.
- Needs GitHub API integration for PR discovery and categorization.

### Option 2: Keep local release script and generate changelog in CI only

Keep `scripts/release.ts` as the main release entrypoint and only add changelog
generation during the publish workflow.

Pros:

- Smallest code change to the existing flow.
- Reuses most of the current release script unchanged.

Cons:

- Does not solve the main operator pain point.
- Keeps release correctness dependent on the local machine state.
- Splits release orchestration awkwardly between local and CI contexts.

### Option 3: Fully automatic release on merge to `medium`

Trigger releases automatically after merges and infer the next version from PR
metadata.

Pros:

- Lowest manual release effort after setup.

Cons:

- Changes release semantics significantly.
- Increases the chance of accidental or poorly timed releases.
- Adds version-policy complexity that is outside this request.

## Decision

Adopt **Option 1**.

The release process should become GitHub-first but remain human-directed.
Operators will manually trigger a release workflow and provide the target stable
version. GitHub Actions will then perform the release in a reproducible
environment, generate a structured changelog from merged pull requests, and
complete publishing without requiring local release tooling.

To avoid overlapping responsibilities with the existing tag-triggered publish
workflow, the release architecture must be split explicitly rather than letting
two workflows publish the same tag.

## Workflow Design

### Entry Point

Add a new manually triggered workflow dedicated to release orchestration.

Required inputs:

- `version`: exact stable semver `X.Y.Z`

Optional inputs:

- `notes`: a short operator note that can still be stored in
  `docs/release-mapping.md`

The workflow must run against the `medium` branch head, not an arbitrary commit
or detached tag input. This keeps the release branch policy aligned with the
existing SOP.

### Workflow Split

The repository must not end up with two independent workflows both trying to
publish the same release.

The recommended split is:

- the new manual workflow owns release preparation, verification, changelog
  generation, release commit creation, tag creation, tag push, npm publish, and
  GitHub Release creation
- the existing `.github/workflows/release.yml` tag workflow is either retired or
  reduced to a narrow verification-only role that does not publish

The implementation must make this ownership explicit. Pushing `vX.Y.Z` from the
manual workflow must not trigger a second publish attempt for the same version.

### Release Steps

The workflow should execute these stages in order:

1. check out the repository with full history
2. configure git remotes needed for provenance resolution
3. validate the target branch and requested version
4. resolve the latest reachable upstream stable tag and commit
5. determine the previous stable fork release tag
6. collect merged pull requests and direct commits in the release range
7. generate categorized changelog markdown
8. run release gates: lint, typecheck, test, and build
9. update `package.json`
10. update `docs/release-mapping.md`
11. create the release commit
12. create and push `vX.Y.Z`
13. publish to npm with Trusted Publisher
14. create the GitHub Release using generated release body content

The workflow should fail before mutating git state if version validation,
provenance resolution, changelog generation, or release verification cannot
complete safely.

## Architecture

### 1. Provenance and Versioning Layer

Keep the existing pure rules in `src/release/medium-version.ts` and
`src/release/release-mapping.ts` as the source of truth for:

- stable version validation
- monotonic version checks against `docs/release-mapping.md`
- reachable upstream tag resolution
- GitHub Release metadata formatting
- mapping document parsing and update rules

This avoids re-implementing release rules in shell scripts and keeps the risky
logic testable.

### 2. Changelog Builder Layer

Add a new small module for changelog generation. It should accept normalized PR
metadata and return deterministic grouped markdown.

Responsibilities:

- map labels to release sections
- fall back to title prefix classification
- preserve PR order deterministically
- format empty and non-empty sections predictably

This module should not call GitHub directly. It should only format and classify
data so it can be unit-tested without network coupling.

### 3. GitHub Integration Layer

Add a thin workflow-facing script or module that:

- creates or validates the `upstream` remote in the CI runner
- fetches upstream tags needed by the provenance helpers
- queries GitHub for merged PRs in the selected release range
- normalizes PR number, title, labels, url, and merge commit data
- passes normalized data into the changelog builder
- combines changelog output with provenance metadata for the final release body

This layer owns API usage and workflow plumbing, while the lower layers stay
deterministic.

### 4. Workflow Orchestration Layer

The GitHub Actions workflow should orchestrate:

- dependency setup
- execution order
- git author setup for the release commit
- permissions for pushing and creating releases
- npm publish invocation

This layer should stay thin and delegate logic to repository scripts wherever
possible.

## Changelog Rules

### Data Source

The changelog range is the set of merged pull requests and direct commits between
the previous stable release tag and the current `medium` head included in the
workflow run.

The preferred source of truth is GitHub pull request metadata rather than raw
git commit messages.

If a commit in the release range is not associated with a merged pull request,
the workflow must not silently drop it. It should either:

- place the commit in a fallback `Other` section using the commit subject, or
- fail with an explicit message if the repository chooses to enforce PR-only
  release history

For this repository, the safer default is to include unmatched direct commits in
`Other` so the changelog stays complete while the team gradually improves PR
discipline.

### Classification Priority

For each PR:

1. use the first recognized changelog label category
2. otherwise inspect the PR title prefix
3. otherwise place the PR into `Other`

Recommended label mapping:

- `feat` or `feature` -> `Features`
- `fix` or `bug` -> `Fixes`
- `docs` -> `Docs`
- `refactor` -> `Refactors`
- `chore`, `build`, or `ci` -> `Chores`

Recommended title-prefix fallback mapping:

- `feat:` -> `Features`
- `fix:` -> `Fixes`
- `docs:` -> `Docs`
- `refactor:` -> `Refactors`
- `chore:`, `build:`, `ci:` -> `Chores`

### Output Format

The generated changelog should be markdown and grouped into sections. Each item
should at minimum include:

- PR title
- PR number

Recommended bullet format:

`- <title> (#123)`

The release body should also keep the provenance block, including the upstream
tag and upstream commit, ahead of the categorized changelog.

### Empty Results

If no merged pull requests or direct commits are found in the release range, the
workflow should still allow the release but insert a clear placeholder line such
as:

`No categorized pull requests found.`

If the range contains only unmatched direct commits, the changelog should still
contain those entries under `Other` rather than using the empty placeholder.

## Error Handling

The workflow must fail with actionable errors when:

- the requested version is not stable semver
- the requested version is not greater than the highest mapped release version
- the `medium` branch state cannot be checked reliably
- the upstream stable provenance tag cannot be resolved from reachable history
- the CI runner cannot create or validate the `upstream` remote needed for
  provenance resolution
- the previous release range cannot be computed safely
- GitHub API access fails while collecting release PRs
- `package.json` or `docs/release-mapping.md` cannot be updated deterministically
- lint, typecheck, test, or build fails before release mutation

The workflow must not fail only because:

- a PR has no recognized label
- a PR title has no recognized prefix
- the final changelog contains an `Other` section

Those cases should degrade gracefully into fallback categorization.

## Testing Strategy

### Unit Tests

Add tests for the changelog builder covering:

- label-based categorization
- title-prefix fallback categorization
- unmatched direct commits going to `Other`
- unknown PRs going to `Other`
- deterministic section ordering
- empty changelog output

Keep and extend the current unit coverage for:

- version validation in `src/release/medium-version.ts`
- mapping updates in `src/release/release-mapping.ts`

### Workflow Verification

The workflow should verify:

- full-history checkout for ancestry-sensitive git operations
- release runs only from `medium`
- the CI runner configures `upstream` before provenance resolution
- npm publish still uses `--provenance --access public`
- lint, typecheck, tests, and build run before commit/tag mutation
- release creation uses the generated release body rather than manual text entry

### Documentation Verification

Update `docs/medium-release.md` so the documented SOP matches the new GitHub
Actions entrypoint. If the local script remains temporarily as a fallback, the
doc should mark it as secondary rather than primary.

## Migration Plan

1. add the changelog builder module and tests
2. add a workflow-facing release script that reuses existing provenance helpers
3. create the manual GitHub Actions release workflow
4. update or retire `.github/workflows/release.yml` so publish ownership is
   unambiguous and non-duplicated
5. update `docs/medium-release.md` to describe the new operator flow
6. keep the local release script temporarily as fallback until the workflow is
   proven stable
7. decide in a later cleanup whether to retire `scripts/release.ts`

## Open Questions Resolved

- **Who chooses the release version?** The operator does, explicitly, through a
  manual workflow input.
- **What is the changelog source?** Merged PR metadata from GitHub.
- **How are sections chosen?** Labels first, then title prefixes, then `Other`.
- **Is automatic release-on-merge in scope?** No.
