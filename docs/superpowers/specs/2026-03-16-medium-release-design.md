# Medium Release Automation Design

## Goal

Add a repo-local release helper for the `medium` branch that computes the next
fork release version from upstream tags, updates `package.json`, and creates an
annotated git tag.

## Context

- `upstream/master` is the source repository's integration branch.
- `origin/master` is used only to sync upstream changes.
- `medium` is the fork's product branch and release branch.
- The fork release format is:
  - `package.json.version`: `<upstream-version>-medium.<fork-patch>`
  - git tag: `v<upstream-version>-medium.<fork-patch>`
- The user wants a safe local workflow that does not push or publish.

## Recommended Approach

Implement a single Bun script at `scripts/release-medium.ts` and expose it via
`package.json` scripts:

- `bun run release:medium`
- `bun run release:medium:dry`

This keeps the release logic maintainable, testable, and easy to extend with
flags later.

## Alternatives Considered

### 1. Bun script (recommended)

Pros:
- Clear logic and readable parsing for tags and versions.
- Easy to add `--dry-run`, extra validation, or future options.
- Good fit for the existing repo, which already uses Bun scripts.

Cons:
- Adds one script file.

### 2. Shell-only `package.json` script

Pros:
- Fewer files.

Cons:
- Hard to maintain.
- Brittle string parsing for semver and tags.
- Poor error handling.

### 3. `npm version prerelease --preid=medium`

Pros:
- Minimal custom logic.

Cons:
- Increments from the current package version instead of the latest upstream
  tag.
- Does not model the fork's upstream-sync workflow.

## Behavior

### Inputs

- Current git repository state.
- Tags fetched from `upstream`.
- Existing fork tags in the local repo.
- `package.json`.

### Preconditions

The script should fail with a clear message when:

- the `upstream` remote is not configured
- the current branch is not `medium`
- the working tree is not clean
- no upstream semver tag is found
- the computed target tag already exists

### Precondition Validation Details

1. **Remote existence**: verify `git remote get-url upstream` succeeds before
   any fetch or tag discovery.
2. **Branch check**: use `git symbolic-ref --short HEAD` so detached HEAD is
   handled explicitly.
3. **Working tree**: use `git status --porcelain` and require no output.
4. **Tag format**: only consider stable upstream tags in exact `vX.Y.Z` form;
   ignore prerelease tags such as `v1.2.3-beta.1`.

### Main Flow

1. Verify the current branch is `medium`.
2. Verify the working tree is clean.
3. Run `git fetch upstream --prune --tags`.
4. Discover the latest upstream tag matching exact `vX.Y.Z` using proper
   semver comparison rather than string comparison.
5. Discover existing fork tags matching `vX.Y.Z-medium.N` for that upstream
   version.
6. Compute the next package version and git tag.
7. In normal mode:
   - update `package.json.version`
   - re-check that the target tag still does not exist immediately before
     creation
   - create an annotated git tag
8. In dry-run mode:
   - print the upstream base tag
   - print the next package version
   - print the next git tag
   - make no file or git changes

## Version Rules

- If the latest upstream tag is `v0.8.3` and no fork tag exists yet, the next
  version is:
  - package version: `0.8.3-medium.1`
  - git tag: `v0.8.3-medium.1`
- If fork tags already exist up to `v0.8.3-medium.2`, the next version is:
  - package version: `0.8.3-medium.3`
  - git tag: `v0.8.3-medium.3`
- When upstream advances to `v0.8.4`, the fork patch counter resets and the
  next fork release becomes `0.8.4-medium.1`.

### Additional Rules

- Only stable upstream tags in exact `vX.Y.Z` form are candidates.
- Use semver-aware comparison to determine the latest upstream base tag.
- Malformed or unrelated tags must be ignored.

## Implementation Notes

- Use Bun/TypeScript, matching the repo's existing script style.
- Update `package.json` via JSON parse/stringify with 2-space indentation.
- Create annotated tags with a stable message:
  - `medium release vX.Y.Z-medium.N`
- Prefer direct `git` commands from the script rather than chaining multiple
  shell commands in `package.json`.
- Parse `package.json` with clear error handling so invalid JSON reports an
  actionable failure.

## Testing Strategy

Add focused tests for pure version-selection logic rather than trying to mock a
full git repository.

Suggested extraction:
- a helper that parses a tag like `v0.8.3-medium.2`
- a helper that computes the next fork patch from a latest upstream version and
  existing fork tags

Suggested tests:
- no existing fork tags -> returns `.1`
- existing matching fork tags -> increments highest patch
- unrelated upstream versions do not affect the result
- malformed tags are ignored

The script entrypoint can stay thin and call the tested helpers.

## Error Handling

- Surface actionable messages for git state problems.
- Abort before modifying `package.json` if validation fails.
- Check for duplicate target tags before writing files.
- Validate `upstream` exists before git fetches.
- Fail clearly when running from detached HEAD.

## Non-Goals

- No automatic push.
- No automatic publish.
- No automatic merge from `master` into `medium`.
- No changelog generation in this iteration.

## Expected User Workflow

After syncing `master` and merging it into `medium`, the user runs:

```bash
bun run release:medium
```

Then manually reviews and performs any follow-up commands such as:

```bash
git push origin medium
git push origin v0.8.3-medium.1
```
