# Eval 3 - With Skill (Iteration 4)

# 結論：使用 rebase

## 原因

1. **私人分支** — 沒有其他人依賴你的分支歷史，rebase 不會造成別人的困擾
2. **會 squash merge** — 最終結果本來就會把所有 commit 壓成一個，中間的 commit 歷史其實沒那麼重要
3. **保持乾淨** — rebase 可以讓你的 feature branch 基於最新的 master，避免 merge commit 混雜在歷史中

## 做法

按照你說的 workflow：

```bash
git fetch origin
git fetch upstream
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master

git switch feat/your-branch
git rebase master

# 如果已經推過
git push --force-with-lease origin feat/your-branch
```

## 注意

一旦 branch 開了 PR 或分享給別人，就**不要 rebase**了。那時候就改用 `git merge master` 來同步上游，保留真實的合併歷史。
