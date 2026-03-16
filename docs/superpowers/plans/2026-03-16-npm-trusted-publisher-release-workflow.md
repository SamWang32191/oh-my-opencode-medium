# npm Trusted Publisher Release Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions release workflow that publishes `oh-my-opencode-medium` to npm via Trusted Publisher when a valid `medium` release tag is pushed.

**Architecture:** Keep branch CI in `.github/workflows/ci.yml` unchanged and add a separate tag-driven workflow in `.github/workflows/release.yml`. Put release safety in the workflow itself with explicit shell guards for tag format, `package.json` version match, and `medium` branch reachability, then document the Trusted Publisher flow in `docs/medium-release.md`.

**Tech Stack:** GitHub Actions, Bun, Node.js, npm Trusted Publisher (OIDC), shell validation, Markdown docs

---

## File Map

- Create: `.github/workflows/release.yml` - tag-triggered npm publish workflow using OIDC/Trusted Publisher
- Modify: `docs/medium-release.md` - release SOP updates for automatic npm publish and Trusted Publisher expectations
- Optional verify reference: `.github/workflows/ci.yml` - existing CI style to mirror, not expected to change

## Chunk 1: Release Workflow File

### Task 1: Add the workflow trigger and publish job skeleton

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Write the failing workflow file**

Create a minimal workflow that intentionally omits one required guard so validation will fail during review:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*-medium.*'

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
```

- [ ] **Step 2: Run workflow validation by inspection**

Check: `.github/workflows/release.yml`
Expected: incomplete workflow that still needs setup, validation, and publish steps before it can satisfy the spec.

- [ ] **Step 3: Write minimal implementation**

Expand the workflow to include:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun test
      - run: bun run build
      - run: npm publish --registry=https://registry.npmjs.org/
```

Keep `NODE_AUTH_TOKEN` out of the workflow.

- [ ] **Step 4: Review YAML for spec alignment**

Check that the workflow includes:
- tag trigger `v*-medium.*`
- `contents: read`
- `id-token: write`
- `timeout-minutes: 10`
- concurrency group
- Bun + Node setup
- install, typecheck, test, build, publish steps

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: add npm release workflow"
```

### Task 2: Add release guards before publish

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Write the failing guard block**

Add a validation step stub before publish that still lacks the full checks:

```yaml
      - name: Verify release tag
        run: |
          TAG_NAME="${GITHUB_REF_NAME}"
          echo "Tag: ${TAG_NAME}"
```

- [ ] **Step 2: Review the stub and confirm it is insufficient**

Expected missing behavior:
- exact `vX.Y.Z-medium.N` check
- `package.json.version` match
- tagged commit reachability from `origin/medium`

- [ ] **Step 3: Write minimal implementation**

Replace the stub with a shell step that does all required checks:

```yaml
      - name: Verify release tag and package version
        run: |
          set -euo pipefail

          TAG_NAME="${GITHUB_REF_NAME}"
          if ! printf '%s' "$TAG_NAME" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+-medium\.[0-9]+$'; then
            echo "Invalid release tag: ${TAG_NAME}"
            exit 1
          fi

          TAG_VERSION="${TAG_NAME#v}"
          PACKAGE_VERSION=$(node -p "require('./package.json').version")
          if [ "$TAG_VERSION" != "$PACKAGE_VERSION" ]; then
            echo "Tag version ${TAG_VERSION} does not match package.json version ${PACKAGE_VERSION}"
            exit 1
          fi

          git fetch origin medium --depth=1
          if ! git merge-base --is-ancestor HEAD origin/medium; then
            echo "Tagged commit is not reachable from origin/medium"
            exit 1
          fi
```

Place this before typecheck/test/build/publish.

- [ ] **Step 4: Review the final guard logic**

Check that it rejects:
- malformed tags
- tag/version mismatch
- tags created from a commit outside `medium`

- [ ] **Step 5: Validate the guard commands by inspection**

Confirm the shell block uses:
- exact tag regex validation
- `node -p` to read `package.json.version`
- `git merge-base --is-ancestor HEAD origin/medium`

This validation step exists because the workflow guard itself is the primary
test seam for this implementation.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: validate npm release workflow inputs"
```

## Chunk 2: Release Documentation

### Task 3: Update the release SOP for Trusted Publisher

**Files:**
- Modify: `docs/medium-release.md`

- [ ] **Step 1: Write the failing documentation update**

Add a placeholder section heading without the required operational details:

```md
## npm Publish

Release tags publish to npm automatically.
```

- [ ] **Step 2: Review and confirm what is missing**

Expected missing details:
- workflow file name is `.github/workflows/release.yml`
- publish happens when the new tag is pushed
- Trusted Publisher is already configured in npm
- duplicate version publishes will be rejected by npm

- [ ] **Step 3: Write minimal implementation**

Update `docs/medium-release.md` to include:
- after `git push origin vX.Y.Z-medium.N`, GitHub Actions workflow `release.yml` publishes automatically
- the publish workflow uses npm Trusted Publisher via GitHub OIDC, not `NPM_TOKEN`
- the manual npm setup path: npm package page -> Settings -> Publishing -> Trusted Publisher
- the npm Trusted Publisher configuration must point at `.github/workflows/release.yml`
- users should only push the tag when they are ready to publish
- npm rejects duplicate publishes for the same version

- [ ] **Step 4: Review docs for consistency**

Check that the SOP matches the actual workflow trigger and current release script behavior.

- [ ] **Step 5: Commit**

```bash
git add docs/medium-release.md
git commit -m "docs: describe npm trusted publisher release flow"
```

## Chunk 3: Final Verification

### Task 4: Verify the workflow and docs together

**Files:**
- Verify: `.github/workflows/release.yml`
- Verify: `docs/medium-release.md`

- [ ] **Step 1: Run repository checks**

Run: `bun run typecheck && bun test`
Expected: PASS

- [ ] **Step 2: Inspect the workflow file**

Review `.github/workflows/release.yml` and confirm it contains:
- tag trigger `v*-medium.*`
- `contents: read`
- `id-token: write`
- exact tag regex validation in shell
- package version guard
- `origin/medium` reachability check
- `npm publish --registry=https://registry.npmjs.org/`
- no `NODE_AUTH_TOKEN`

- [ ] **Step 3: Inspect the SOP update**

Review `docs/medium-release.md` and confirm it explains:
- tag push triggers npm publish
- workflow filename is `release.yml`
- Trusted Publisher is the authentication path
- duplicate versions are rejected by npm

- [ ] **Step 4: Commit any final adjustments**

```bash
git add .github/workflows/release.yml docs/medium-release.md
git commit -m "chore: finalize npm release automation docs"
```
