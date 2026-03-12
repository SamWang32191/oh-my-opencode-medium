# Eval 2 - With Skill (Iteration 4)

# Feature Branch 同步流程

## 步驟一：同步本地的 master

```bash
git fetch origin --prune
git fetch upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master
```

## 步驟二：更新 feature branch

```bash
git switch feat/your-branch
git merge master
git push origin feat/your-branch
```

---

## 為什麼 merge 比 rebase 更安全？

| 情境 | rebase | merge |
|------|--------|-------|
| **已推送到遠端的分支** | 會**改寫歷史**，需要 force push，可能覆蓋他人協作 | 保持原有歷史，安全 |
| **正在 review 的分支** | rebase 後會產生**全新的 commit hash**，review 工具會視為不同 Diff， reviewer 之前寫的評論會全部消失 | 保留原來的 commit，評論仍在 |
| **多人協作** | 可能造成衝突覆蓋 | 明確的 merge commit，衝突一次解決 |

**結論**：已經推出去讓人 review 的分支，千萬不要 rebase。否則會造成歷史混亂、force push 風險、評論消失等問題。Merge 雖然會多一個 merge commit，但對於最終會 squash merge 的流程來說，這個 commit 最後會被消掉，完全沒影響。
