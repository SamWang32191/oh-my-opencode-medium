# Eval 3 - Without Skill

**結論：建議 rebase**

既然：
- 還沒 PR、沒分享給別人 → 沒人會讀你的 branch 歷史
- 最終會 squash merge → main 的歷史本來就不會留下你的 commit 記錄
- 想保持乾淨 → rebase 可以創造線性歷史

**做法：**
```bash
git fetch origin
git rebase origin/main
```

如果有 conflict，解決後 `git rebase --continue`。

**什麼情況該用 merge？**
- branch 已推出去給別人用
- 已經開了 PR 等人 review（這時 rebase 會 force push，造成其他人麻煩）
