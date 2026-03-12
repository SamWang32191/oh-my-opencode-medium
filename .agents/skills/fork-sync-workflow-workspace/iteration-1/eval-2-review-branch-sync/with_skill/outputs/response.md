# Eval 2 - With Skill

## 当前状态确认

- `origin` = 你的 fork
- `upstream` = 原始仓库
- `master` = 你的整合分支
- feature branch 已在 review 中

## 推荐做法

既然你的 feature branch 已經在 review，避免使用 rebase，改用 merge 保持 review 歷史穩定：

```bash
# 1. 同步 master
git fetch upstream
git switch master
git pull --ff-only origin master
git merge upstream/master

# 2. 推送到你的 fork
git push origin master

# 3. 更新 feature branch
git switch 你的 feature-branch
git merge master
```

## 為什麼用 merge

- **不破壞 review 歷史**：rebase 會改變 commit hash， reviewers 會看到整個 branch 被重寫，難以追蹤變化
- **不需要 force push**：rebase 後通常要 `git push --force`，容易出錯或覆蓋他人的工作
- **符合 squash merge 流程**：最終 merge 回 master 時本來就會 squash，中間用 merge 不會造成問題

## 警告

- **千萬不要**直接 `git rebase upstream/master` 在已發布的 branch 上
- 如果還沒推送到 remote，才可以用 rebase + force push，但你在 review 中，請用 merge
