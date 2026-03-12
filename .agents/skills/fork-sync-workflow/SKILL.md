---
name: fork-sync-workflow
description: Use when working in a forked Git repository with `origin` pointing to a personal fork and `upstream` pointing to the source repository, especially when deciding how to sync upstream changes, keep a review branch current, or manage feature branches around a squash-merge workflow.
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
- feature work lands back into the fork with squash merge

## First Checks

Before recommending commands, inspect the current state:

```bash
git remote -v
git branch -vv
git status
```

If the user already mentioned remote names or branch names, verify them instead of assuming.

When answering, mirror the user's language. If the user writes in Traditional Chinese, answer fully in Traditional Chinese and avoid Simplified Chinese wording.

## Default Branch Model

- `master` is the fork's integration branch, not the place for day-to-day development
- every new change starts from the latest `master`
- feature work lives in short-lived branches like `feat/*`, `fix/*`, or `chore/*`
- `master` is updated from `upstream/master`
- finished feature branches return to `master` with squash merge

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

### 2. Upstream changed and the user wants to sync the fork

Update `master` first. The default is to merge `upstream/master` into the fork's `master`:

```bash
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
```

When showing a `master` sync block, prefer this full sequence over a shortened version unless the user explicitly asks for the shortest possible commands.

After the merge, recommend verification that matches the repo, then push:

```bash
git push origin master
```

Why this is the default:
- it preserves a clear record of upstream sync points
- it avoids rewriting the fork's shared base branch history
- it works well even when multiple local feature branches depend on `master`

### 3. A feature branch is already in review and needs upstream updates

Do **not** jump straight to `git rebase upstream/master` as the generic answer.

The safer default is:
1. sync `master` from `upstream/master`
2. update the feature branch from the latest `master`

If the branch is already pushed, already under review, or might be consumed by others, prefer merge:

```bash
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master

git switch feat/my-branch
git merge master
```

This keeps review history stable and avoids force-pushing rewritten commits during review.

### 4. A feature branch is private and not yet under review

If the branch is still private, not yet shared, and the user wants a linear local history, rebase is acceptable:

```bash
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master

git switch feat/my-branch
git rebase master
```

If the branch was already pushed, mention that `git push --force-with-lease` will be required after rebase and call out the risk explicitly.

### 5. User prefers squash merge

Treat squash merge as the final integration method from feature branch to `master`, not as a reason to rebase every branch by default.

Recommended rule:
- sync base branches with merge
- update shared review branches with merge by default
- reserve rebase for private branches or when the user explicitly asks to rewrite history
- use squash merge when closing the PR into `master`

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
If the answer includes a `master` sync example, use the full `git fetch origin upstream --prune` -> `git switch master` -> `git pull --ff-only origin master` -> `git merge upstream/master` sequence.

## Common Mistakes

- treating `master` as a development branch instead of an integration branch
- rebasing a review branch just because squash merge will be used later
- syncing a feature branch directly from `upstream/master` instead of from the fork's updated `master`
- force-pushing a rebased shared branch without warning about the consequences
- adding `develop` out of habit when `master + short-lived feature branches` is enough

## Quick Answers

**If the user asks "How should I manage my fork long term?"**
- recommend `master` plus short-lived feature branches
- keep `origin/master` in sync with `upstream/master`
- squash merge features back into `master`

**If the user asks "Upstream updated, what now?"**
- sync `master` first
- then decide whether the feature branch should merge `master` or rebase onto it

**If the user asks "Should I rebase?"**
- yes for private, unshared branches when they want linear history
- no by default for reviewed or shared branches

## When Not to Use

Do not use this skill as-is when:
- the repository is not a fork
- the long-lived branch is not `master`
- the team has an explicit rebase-only policy
- the user is asking about release trains, stacked diffs, or multi-environment deployment branches rather than a simple fork-sync workflow
