# Iteration 4 Notes

- `eval-1` with skill is much closer to the intended fork workflow than baseline, but it still compresses the two fetch commands onto one line and omits explicit base-branch verification.
- `eval-2` with skill correctly keeps reviewed branches on `merge master` instead of rebasing.
- `eval-3` with skill correctly preserves the "private branch can rebase" rule and includes `--force-with-lease`.
- `eval-4` with skill improves branch verification, but it still adds an unnecessary `git remote add upstream` step for a user who only asked how to check the default branch.
- `eval-5` with skill uses the right comparison command, but its explanation of `0 X` is still too soft and should more clearly say upstream is ahead and a merge is needed if the user wants to sync.

# Description Optimization Notes

- Auto-optimization via `python3 -m scripts.run_loop` started but failed at the `claude -p` improvement step.
- Manual optimization was applied to the description in `SKILL.md`.
- Trigger evals for both the previous and optimized descriptions scored `10/20`, with all negative cases passing and all positive cases not triggering.
- This suggests the current trigger-eval harness is not yet sensitive enough for this project-local skill, so description wording improved semantically, but the automated trigger score did not move.
