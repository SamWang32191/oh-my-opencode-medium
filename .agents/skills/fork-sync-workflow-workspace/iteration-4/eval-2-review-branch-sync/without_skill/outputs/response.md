# Eval 2 - Without Skill (Iteration 4)

## 穩定的同步方式

既然最後會 squash merge 回你自己的 master，推薦這樣做：

### 1. 先同步你的 master
```bash
git fetch upstream
git checkout master
git merge upstream/master
git push origin master
```

### 2. 將 feature branch rebase 到新的 master
```bash
git checkout your-feature-branch
git rebase master
```

### 3. 如有衝突，解決後繼續
```bash
# 解決衝突後
git add .
git rebase --continue
git push --force-with-lease  # 強推 rebase 後的 branch
```

---

**為什麼用 rebase 而非 merge？**
- squash merge 後的歷史會是線性的，比較乾淨
- 避免 merge commit 造成多餘的歷史節點

**注意：** 
- 因為 rebase 會改寫歷史，feature branch 如果有其他人協作要溝通
- `--force-with-lease` 比 `--force` 安全，避免覆蓋別人的更新
