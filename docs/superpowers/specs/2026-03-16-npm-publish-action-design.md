# npm Publish Action Design

## Goal

Add a GitHub Actions workflow that publishes the package to npm automatically
when a release tag matching the fork's `medium` release format is pushed,
using npm Trusted Publisher instead of an npm token.

## Context

- The repository already has a CI workflow at `.github/workflows/ci.yml` for the
  `medium` branch.
- Fork releases are created from the `medium` branch.
- The release flow produces:
  - `package.json.version`: `X.Y.Z-medium.N`
  - git tag: `vX.Y.Z-medium.N`
- The user chose a tag-driven publish model instead of branch-driven or manual
  publishing.

## Recommended Approach

Add a dedicated workflow file at `.github/workflows/release.yml` that runs
only on pushed tags matching `v*-medium.*`.

The workflow should:

1. check out the tagged revision
2. install Bun and Node.js
3. install dependencies with Bun
4. verify the git tag matches `package.json.version`
5. run typecheck, tests, and build
6. publish to npm through GitHub OIDC with npm Trusted Publisher

This keeps normal CI separate from release publishing, aligns publish events
with the existing release/tag flow, and avoids long-lived npm credentials.

## Alternatives Considered

### 1. Dedicated tag-triggered workflow (recommended)

Pros:
- matches the existing `release:medium` flow
- avoids publishing on ordinary branch pushes
- keeps release logic isolated from normal CI

Cons:
- a pushed release tag immediately attempts a publish

### 2. Reuse existing CI workflow with extra tag-only job

Pros:
- fewer workflow files

Cons:
- mixes branch CI and release publishing concerns
- makes workflow logic harder to read and maintain

### 3. Manual `workflow_dispatch` publish

Pros:
- lowest risk of accidental publish

Cons:
- does not match the current tag-based release process
- adds an extra manual step after creating a release tag

## Workflow Trigger

The workflow should trigger on:

```yaml
on:
  push:
    tags:
      - 'v*-medium.*'
```

This provides a coarse tag filter. The workflow must still validate the exact
tag format in a shell step before publishing.

## Job Design

Use a single `publish` job with:

- `runs-on: ubuntu-latest`
- `timeout-minutes: 10`
- concurrency:
  - `group: ${{ github.workflow }}-${{ github.ref }}`
  - `cancel-in-progress: false`
- minimal permissions:
  - `contents: read`
  - `id-token: write`

### Steps

1. **Checkout tagged revision**
   - use `actions/checkout@v4`
2. **Setup Bun**
   - use `oven-sh/setup-bun@v2`
3. **Setup Node.js for npm Trusted Publisher**
   - use `actions/setup-node@v4`
   - set `node-version` to a current version that supports modern npm Trusted
     Publisher flows
   - set `registry-url` to `https://registry.npmjs.org`
4. **Install dependencies**
   - run `bun install --frozen-lockfile`
5. **Verify tag/version match**
   - read `${GITHUB_REF_NAME}`
   - validate that the tag matches exact `vX.Y.Z-medium.N` format
   - read `package.json.version`
   - require `package.json.version === GITHUB_REF_NAME` without the leading `v`
   - implement the check with a small shell step that exits non-zero on mismatch
   - verify the tagged commit is reachable from `origin/medium`
6. **Run release checks**
   - `bun run typecheck`
   - `bun test`
   - `bun run build`
7. **Publish to npm**
   - run `npm publish --registry=https://registry.npmjs.org/`
   - do not provide `NODE_AUTH_TOKEN`
   - rely on npm Trusted Publisher OIDC authentication from GitHub Actions

## Validation Rules

The workflow must fail before publish when:

- the tag does not match the `v*-medium.*` pattern
- `package.json.version` does not equal the tag without the leading `v`
- the tagged commit is not on `medium`
- dependency install fails
- typecheck fails
- tests fail
- build fails
- npm Trusted Publisher is not configured correctly on the npm package side
- GitHub Actions OIDC permission is missing

## npm Trusted Publisher Requirements

The npm package must be configured to trust this repository's workflow:

- configure Trusted Publisher in npm package settings for this GitHub
  repository and workflow file
- manually add the Trusted Publisher entry on npmjs.com before the first publish
- ensure the workflow file path matches the npm Trusted Publisher configuration;
  for this repository it is fixed to `.github/workflows/release.yml`
- ensure the package already exists on npm under the intended owner
- ensure the publishing npm account/package setup satisfies npm's publish
  prerequisites

## Non-Goals

- no automatic version bumping in GitHub Actions
- no automatic tag creation in GitHub Actions
- no npm dist-tag branching such as `next` vs `latest` in this iteration
- no GitHub Release creation in this iteration

## Documentation Updates

Update `docs/medium-release.md` so the SOP includes:

- pushing a release tag triggers npm publish automatically
- npm Trusted Publisher must be configured for this repository/workflow
- manual setup steps on npmjs.com for Trusted Publisher
- users should only push tags after they are ready to publish
- npm will reject attempts to publish the same version twice

## Expected User Workflow

1. run `bun run release:medium`
2. review the generated commit and tag locally
3. push `medium`
4. push the new release tag
5. GitHub Actions publishes the matching package version to npm

## Testing Strategy

Implementation should include:

- workflow YAML validation by keeping syntax simple and aligned with current CI
  style
- documentation updates that explain the trigger and Trusted Publisher setup
- an explicit version/tag guard in the workflow shell step so release mistakes
  fail before `npm publish`
