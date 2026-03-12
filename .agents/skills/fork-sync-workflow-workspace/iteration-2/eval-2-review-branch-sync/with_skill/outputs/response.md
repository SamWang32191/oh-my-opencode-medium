# Eval 2 - With Skill (Iteration 2)

根據你的情況，feature branch 已經在 review 中，而且是共享的分支，最穩定的做法是：

## 同步步驟

1. **先同步本地的 master：**

```bash
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master
```

2. **再把 feature branch 從最新的 master 更新：**

```bash
git switch feat/your-branch
git merge master
git push origin feat/your-branch
```

## 為什麼用 merge 不用 rebase？

- 你的 branch 已經在 review 中，rebase 會改變 commit 歷史，force push 會導致 reviewer 看到整個 branch 被重寫
- merge 保留了原本的 commit，只多一個 merge commit，reviewer 的畫面不會爆衝
- squash merge 是最後 merge 回 master 時才做的事，不需要提前折騰

## 警示

千萬不要直接 `git rebase upstream/master`，那會跳過你 fork 的 master，養成壞習慣。一定要先 sync 自己的 master，再用 merge 更新 feature branch。

如果確定 branch 完全是私有的、沒推過、沒在 review，才考慮用 rebase 來保持線性歷史。
