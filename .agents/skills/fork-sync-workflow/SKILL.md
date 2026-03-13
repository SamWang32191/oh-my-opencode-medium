---
name: fork-sync-workflow
description: Use when a user asks about a fork or forked Git repository, fork workflow, origin and upstream remotes, sync upstream, sync a fork, fork sync, 分叉倉庫, 同步 upstream, 同步 fork, 分支策略, review branch, private branch, merge vs rebase, master or main, 預設分支, squash merge, or how to keep a fork aligned with upstream after a PR merge. Use this whenever fork sync or branch strategy is part of the request, even if the user asks about only one step.
---

# Fork Sync Workflow

Use this skill to keep forked repositories predictable.

The goal is to separate three concerns that are often mixed together:
- syncing the fork's integration branch with `upstream`
- doing day-to-day feature work in short-lived branches
- deciding whether an in-flight branch should use `merge` or `rebase`

This workflow assumes:
- `origin` is the user's fork
- `upstream` is the source repository
- the fork's long-lived integration branch is `master`
- the fork may keep a separate long-lived product branch such as `medium`
- the fork's GitHub default branch may be `medium` even when the integration branch is still `master`
- feature work lands back into the fork with squash merge

If the repository actually uses `main` or another long-lived branch, verify that first and adapt the branch name consistently instead of blindly applying `master` commands.

## First Checks

Before recommending commands, inspect the current state:

```bash
git remote -v
git branch -vv
git status
```

If the user already mentioned remote names or branch names, verify them instead of assuming.

When answering, mirror the user's language. If the user writes in Traditional Chinese, answer fully in Traditional Chinese for headings, connective phrases, and explanations, and avoid Simplified Chinese wording.

Then verify both the fork's default branch and the upstream integration branch before assuming `master` means the same thing everywhere:

```bash
git remote show origin
git remote show upstream
gh repo view --json defaultBranchRef 2>/dev/null
```

Interpret those checks carefully:
- `origin` may report `medium` as the default branch if that is the fork's product branch
- `upstream` is the source of truth for the integration branch that receives upstream syncs
- do not assume the fork's default branch and the integration branch are the same branch

If `upstream` shows `main` or another branch instead of `master`, update all sync commands to match the real upstream integration branch.
If only `origin` shows another default branch such as `medium`, keep the upstream sync flow on `master` unless the upstream integration branch also changed.

If the user only asked how to verify the real long-lived branch, stop after the verification commands and a short note on how later commands should adapt. Do not add unrelated setup steps like `git remote add upstream`, and do not continue into sync commands unless the user asked for them.

When both `origin` and `upstream` exist, fetch them with separate commands:

```bash
git fetch origin --prune
git fetch upstream --prune
```

Do not use `git fetch origin upstream --prune`; that does not fetch two remotes the way people expect.

## Default Branch Model

- `master` is the fork's integration branch, not the place for day-to-day fork-specific product development
- every upstream-contributable change starts from the latest `master`
- feature work lives in short-lived branches like `feat/*`, `fix/*`, or `chore/*`
- `master` is updated from `upstream/master`
- forks with a renamed package or separate release line can keep a long-lived product branch such as `medium`
- in that model, fork-only feature work starts from `medium`, not `master`
- the fork's GitHub default branch can point at `medium` without changing the upstream sync path
- finished feature branches return to their correct base branch with squash merge

This keeps the fork easy to sync with upstream while keeping fork-specific work isolated and readable.

## Core Decisions

### 1. User asks how to structure branches in a fork

Recommend this default:

```text
upstream/master
      |
      v
origin/master
   |      \
   |       --> feat/one
   |       --> fix/two
   |
   +--> more short-lived branches
```

Explain that `master` is the convergence point for two kinds of changes only:
- upstream syncs
- completed feature work merged back from the fork

Do not recommend a `develop` branch unless the user has a concrete release-management need.

If the user is maintaining a fork-only package rename or release line, recommend this variant instead:

```text
upstream/master
      |
      v
origin/master
      |
      +--> medium
             |    \
             |     --> feat/package-work
             |
             +--> fix/release-issue
```

Explain the branch roles explicitly:
- `master` stays as close to `upstream/master` as practical
- `medium` (or another long-lived product branch) carries fork-only packaging, branding, and release changes
- `medium` may also be the fork's GitHub default branch
- work that might be contributed upstream should still branch from `master`
- work that is intentionally fork-only should branch from `medium`
- day-to-day fork development should merge back into `medium`

### 2. Upstream changed and the user wants to sync the fork

Update `master` first. The default is to merge `upstream/master` into the fork's `master`:

```bash
git fetch origin --prune
git fetch upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
```

When showing a `master` sync block, use this full sequence verbatim in copy-pastable command examples unless the user explicitly asks for a shorter conceptual answer.

Before recommending the merge, check whether sync is actually needed:

```bash
git rev-list --left-right --count origin/master...upstream/master
```

Interpret the result before giving the next step:
- `0 0` means the fork's `master` is already aligned with `upstream/master`
- non-zero on the right means upstream is ahead of the fork, so a merge is needed if the user wants to sync now
- non-zero on the left means the fork has fork-only commits on `master`, so call that out explicitly before merging

If the user only said the branches "look the same" and did not provide an actual count, do not invent one. Never fabricate a specific output such as `4 0` or `0 3`. Show the comparison command, explain how to read it, and state that `0 0` means no merge is needed.

After the merge, recommend verification that matches the repo, then push:

```bash
git push origin master
```

Why this is the default:
- it preserves a clear record of upstream sync points
- it avoids rewriting the fork's shared base branch history
- it works well even when multiple local feature branches depend on `master`

### 3. A fork-only product branch needs upstream updates

Do not merge `upstream/master` directly into `medium`. Sync the integration branch first, then flow that change into the product branch.

The safer default is:
1. sync `master` from `upstream/master`
2. update `medium` from the latest `master`
3. update any fork-only feature branch from the latest `medium`

If the product branch and feature branch are already pushed, already under review, or might be consumed by others, prefer merge. Do not collapse the sync block into only `git fetch upstream` or omit `git pull --ff-only origin master` in a command-focused answer:

```bash
git fetch origin --prune
git fetch upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master

git switch medium
git pull --ff-only origin medium
git merge master
git push origin medium

git switch feat/my-branch
git merge medium
git push origin feat/my-branch
```

This keeps `master` as the upstream-aligned integration branch while letting `medium` absorb upstream changes in a predictable way.

### 4. A feature branch is already in review and needs upstream updates

Do **not** jump straight to `git rebase upstream/master` as the generic answer.

The safer default is:
1. sync `master` from `upstream/master`
2. if this is fork-only work, update `medium` from `master`
3. update the feature branch from its true base branch

If the branch is already pushed, already under review, or might be consumed by others, prefer merge:

```bash
git fetch origin --prune
git fetch upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master

git switch medium
git pull --ff-only origin medium
git merge master
git push origin medium

git switch feat/my-branch
git merge medium
git push origin feat/my-branch
```

If the branch is upstream-contributable rather than fork-only, branch from `master` and merge `master` instead.

### 5. A feature branch is private and not yet under review

If the branch is still private, not yet shared, and the user wants a linear local history, rebase is acceptable:

```bash
git fetch origin --prune
git fetch upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master

git switch medium
git pull --ff-only origin medium
git merge master
git push origin medium

git switch feat/my-branch
git rebase medium
```

If the branch was already pushed, mention that `git push --force-with-lease` will be required after rebase and call out the risk explicitly:

```bash
git push --force-with-lease origin feat/my-branch
```

### 6. User prefers squash merge

Treat squash merge as the final integration method from feature branch to its owning long-lived branch, not as a reason to rebase every branch by default.

Recommended rule:
- sync base branches with merge
- update shared review branches with merge by default
- reserve rebase for private branches or when the user explicitly asks to rewrite history
- use squash merge when closing the PR into `medium` for fork-only work, or into `master` for upstream-contributable work

This preserves clean final history without making collaboration fragile.

## Output Format

When advising the user, structure the answer in this order:

1. current-state assumption summary
2. recommended branch strategy or next action
3. exact commands
4. why this choice fits a fork + squash-merge workflow
5. cautions about rebasing, force-pushes, or shared branches

Keep the commands copy-pastable. Avoid long Git theory unless the user asks for it.
Keep branch names, remote names, and command blocks in monospace.
If the answer includes a `master` sync example, use the full `git fetch origin --prune` -> `git fetch upstream --prune` -> `git switch master` -> `git pull --ff-only origin master` -> `git merge upstream/master` sequence.
If the repo's branch roles are uncertain, say so and show the verification commands before giving branch-specific advice.
If `origin` default branch and upstream integration branch differ, call that out explicitly instead of collapsing them into one "main branch".
If the user asks to sync upstream, mention whether the sync is actually needed after comparing `origin/master` and `upstream/master`.
If the user only asked whether a sync is needed, answer that question directly before showing any follow-up merge commands. If the answer is "no" for `0 0`, stop there unless the user asks what to do next.

## Common Mistakes

- treating `master` as a development branch instead of an integration branch
- treating the fork's GitHub default branch as if it must also be the upstream sync branch
- keeping fork-only package or release work on `master` when a separate long-lived product branch would keep upstream sync cleaner
- merging `upstream/master` straight into `medium` instead of syncing `master` first
- rebasing a review branch just because squash merge will be used later
- syncing a feature branch directly from `upstream/master` instead of from the fork's updated `master`
- force-pushing a rebased shared branch without warning about the consequences
- adding `develop` out of habit when `master + short-lived feature branches` is enough
- using one `git fetch` command as if it can fetch both `origin` and `upstream`
- merging upstream even when `origin/master` and `upstream/master` are already aligned

## Quick Answers

**If the user asks "How should I manage my fork long term?"**
- recommend `master` plus short-lived feature branches by default
- recommend `master` plus a long-lived product branch such as `medium` when the fork has a renamed package or separate release line
- note that `medium` can be the fork's GitHub default branch while `master` remains the upstream integration branch
- keep `origin/master` in sync with `upstream/master`
- merge `master` into `medium` after each upstream sync when `medium` is the fork's product branch
- squash merge features back into the branch that owns that work

**If the user asks "Upstream updated, what now?"**
- compare `origin/master` and `upstream/master` first, then sync `master` if needed
- then merge `master` into `medium` if `medium` is the fork's product branch
- then decide whether the feature branch should merge or rebase onto its true base branch

**If the user asks "Should I rebase?"**
- yes for private, unshared branches when they want linear history
- no by default for reviewed or shared branches

## When Not to Use

Do not use this skill as-is when:
- the repository is not a fork
- the long-lived branch is not `master`
- the team has an explicit rebase-only policy
- the user is asking about release trains, stacked diffs, or multi-environment deployment branches rather than a simple fork-sync workflow
