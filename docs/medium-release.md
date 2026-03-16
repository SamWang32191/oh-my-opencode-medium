# Medium Release SOP

This repository uses two long-lived branches for releases:

- `master` syncs `upstream/master`
- `medium` carries fork-specific changes and is the release branch

The fork release format is:

- `package.json.version`: `<upstream-version>-medium.<fork-patch>`
- git tag: `v<upstream-version>-medium.<fork-patch>`

Example:

- package version: `0.8.3-medium.1`
- git tag: `v0.8.3-medium.1`

## Normal Flow

### 1. Sync upstream into `master`

```bash
git fetch origin --prune
git fetch upstream --prune --tags
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master
```

### 2. Merge `master` into `medium`

```bash
git switch medium
git pull --ff-only origin medium
git merge master
git push origin medium
```

### 3. Make sure `medium` is ready to release

Before running the release script:

- stay on `medium`
- commit or stash all local changes
- make sure the working tree is clean

Quick check:

```bash
git status
```

### 4. Preview the next release

```bash
bun run release:medium:dry
```

Expected output:

- `Upstream tag: vX.Y.Z`
- `Package version: X.Y.Z-medium.N`
- `Git tag: vX.Y.Z-medium.N`

The dry run does not modify files, create commits, or create tags.

### 5. Create the release commit and tag

```bash
bun run release:medium
```

This command will:

1. verify `upstream` exists
2. verify the current branch is `medium`
3. verify the working tree is clean
4. fetch upstream tags
5. compute the next `medium` version from tags
6. update `package.json`
7. create a release commit with message `chore: release <version>`
8. create an annotated tag `v<version>`

Example result:

- commit: `chore: release 0.8.3-medium.1`
- tag: `v0.8.3-medium.1`

### 6. Push the branch and tag

```bash
git push origin medium
git push origin vX.Y.Z-medium.N
```

> **Important:** Only push the tag when you are ready to publish. As soon as the tag
> reaches GitHub, the `release.yml` workflow will automatically run and publish to npm.
> npm rejects duplicate publishes for the same version—if the workflow fails and you
> retry, you must use a new version number.

#### What happens after you push the tag

1. GitHub Actions triggers the `release.yml` workflow
2. The workflow validates:
   - Tag format matches `vX.Y.Z-medium.N`
   - Package version matches the tag
   - Tagged commit is reachable from `origin/medium`
3. It runs lint, typecheck, tests, and build
4. It publishes to npm using **Trusted Publisher** (GitHub OIDC)—no `NPM_TOKEN` required

#### Setting up npm Trusted Publisher (first-time only)

If this is the first release for your fork, configure Trusted Publisher in npm:

1. Go to your npm package page → **Settings** → **Publishing**
2. Click **Add a Trusted Publisher**
3. Select your GitHub repository and branch (`medium`)
4. Set the workflow filename to `.github/workflows/release.yml`

Once configured, future releases publish automatically when you push a `v*-medium.*` tag.

## Version Rules

- if upstream moves from `v0.8.3` to `v0.8.4`, the fork patch resets to `.1`
- if the latest fork tag is `v0.8.3-medium.2`, the next release becomes `v0.8.3-medium.3`
- only stable upstream tags in exact `vX.Y.Z` form are considered
- prerelease upstream tags such as `v0.8.4-rc.1` are ignored

## Troubleshooting

### `Working tree must be clean before releasing medium.`

Commit or stash your local changes first, then rerun:

```bash
git status
```

### `Release script must run from the medium branch.`

Switch back to `medium`:

```bash
git switch medium
```

### `Remote 'upstream' is not configured.`

Add the upstream remote first:

```bash
git remote add upstream <upstream-url>
```

### `Tag already exists: vX.Y.Z-medium.N`

Another release already used that tag. Fetch tags and rerun the dry run to see
the next available version:

```bash
git fetch upstream --prune --tags
bun run release:medium:dry
```
