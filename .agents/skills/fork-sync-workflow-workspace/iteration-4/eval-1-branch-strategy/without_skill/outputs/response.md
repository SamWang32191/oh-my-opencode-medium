# Eval 1 - Without Skill (Iteration 4)

## Fork 維護分支策略

### 推薦結構

```
main          # 你的 default 分支，保持與 upstream/main 同步
├── feature/xxx   # 你的功能分支
└── upstream-sync # 專用於同步 upstream 的分支
```

### 操作流程

**1. 同步 upstream**
```bash
# 方法 A：用 upstream-sync 分支（推薦）
git fetch upstream
git checkout upstream-sync
git merge upstream/main --squash  # squash merge upstream 變更
git push origin upstream-sync

# 然後合併到 main
git checkout main
git merge upstream-sync --squash
git push origin main

# 方法 B：直接 rebase（如果你偏好 rebase）
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

**2. 開發新功能**
```bash
git checkout main
git checkout -b feature/your-feature
# 開發完成後 squash merge 到 main
```

### 為什麼用 upstream-sync 分支

1. **保持乾淨的 commit 歷史** — 所有 upstream 變更作為一個 squash commit 進來
2. **方便追蹤同步時間** — upstream-sync 的提交記錄一目了然
3. **避免直接動 main** — 萬一同步出問題，只影響 upstream-sync

### 簡化版（如果不想多分支）

```bash
git fetch upstream
git checkout main
git merge --squash upstream/main
git commit -m "sync: $(git rev-parse --short upstream/main)"
git push origin main
```

---

**關鍵原則**：永遠不要直接 push 到 upstream，永遠用 squash merge 保持歷史乾淨。
