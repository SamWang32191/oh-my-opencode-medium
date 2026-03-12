# Eval 3 - With Skill (Iteration 2)

## 這種情況該用 rebase

**你的情況完全符合「私人分支」的定義**：還沒開 PR、還沒分享給別人。

既然最後會 squash merge，而你想保持 branch 歷史乾淨，rebase 是合適的選擇。

### 建議的操作順序

```bash
# 1. 先把 master 同步到最新
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master

# 2. 把你的 feature branch rebase 到最新的 master
git switch feat/your-branch
git rebase master
```

### 為什麼 rebase 適合你

- **分支是私人的**：還沒推出去給別人看，force push 不會影響任何人
- **想要線性歷史**：rebase 後會把你的 commits 重新貼在最新的 master 上面，形成乾淨的線性 log
- **最後會 squash merge**：反正 PR 會被 squash，rebase 不會造成任何衝突

### 提醒

如果這個 branch 已經 push 過了，rebase 後要：

```bash
git push --force-with-lease
```

`--force-with-lease` 比 `--force` 安全，會檢查有沒有人在你不知情的情況下 push 了新東西。
