# Eval 3 - With Skill

## 結論：使用 rebase

你的情況完全符合「私人分支」的定义：
- 还没开 PR
- 还没分享给别人
- 只在本地的分支

### 推荐命令

```bash
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master

git switch your-feature-branch
git rebase master
```

### 为什么选 rebase

1. **最终会 squash merge** → rebase 可以保持本地提交历史干净，squash 后结果一样
2. **分支尚未共享** → 没有其他人依赖这个分支，rebase 很安全
3. **想要干净历史** → rebase 能做出线性历史，merge 会多一个 merge commit

### 注意

如果之前已经 push 过，rebase 后需要：

```bash
git push --force-with-lease
```

**强烈建议**在开 PR 之前完成这次 rebase，开 PR 后就不要再 rebase 了，避免影响 review 过程。
