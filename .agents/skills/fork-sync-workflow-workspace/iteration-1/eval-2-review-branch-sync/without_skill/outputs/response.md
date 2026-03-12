# Eval 2 - Without Skill

## 同步策略

最穩的方式是 **rebase**，這樣 maintainer 看的就是乾淨的一條線：

```bash
# 1. 確保 local master 同步到最新
git checkout master
git fetch upstream
git merge upstream/master

# 2. 回到你的 feature branch，用 rebase 把 commit 重新接上
git checkout your-feature-branch
git rebase master

# 3. 如果有 conflict，解決後繼續
git add .
git rebase --continue

# 4. force push（因為 commit history 變了）
git push --force-with-lease
```

## 為什麼不用 merge？

- merge 會產生 merge commit，squash merge 後歷史會有點乱
- rebase 保持線性乾淨，review 時看的是乾淨的 commit 堆疊

## 注意事項

- **先用 `--force-with-lease`**：比 `--force` 安全，有人搶 push 會警告
- **rebase 過程中不要做危險操作**：如果搞亂了，可以用 `git reflog` 救回
- **如果 feature branch 已經 push 給別人 review**：rebase 後要通知他們重新 fetch

這樣最後 squash merge 回你的 master 時，歷史會是最乾淨的。
