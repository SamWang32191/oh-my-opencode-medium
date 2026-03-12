# Eval 1 - With Skill (Iteration 4)

# Fork 專案分支管理策略

## 推薦結構

```
master (你的長期維護分支)
├── feat/your-feature-1
├── feat/your-feature-2
└── fix/bug-fix
```

## 核心原則

1. **永遠從 master 開分支**
   ```bash
   git checkout master
   git fetch origin --prune && git fetch upstream --prune
   git pull --ff-only origin master
   git checkout -b feat/your-feature
   ```

2. **持續同步 upstream**
   ```bash
   # 定期同步，保持 master 與 upstream 同步
   git fetch upstream --prune
   git checkout master
   git merge upstream/master
   git push origin master
   ```

3. **使用 squash merge 合併到 master**
   - 在 GitHub/GitLab 上 PR 設定預設 squash merge
   - 這樣 master 保持線性歷史，每個 commit 代表一次功能或修復

## 日常開發流程

```
1. master 與 upstream 同步 → 2. 從 master 開分支 → 3. 開發 → 4. PR squash merge 回 master
```

## 為什麼這樣做

- **Master 與 upstream 同步無痛**：每次從乾淨的 master 開分支，conflict 最小
- **Squash merge 保持簡潔**：每個功能一個 commit，易於追蹤
- **短期分支**：完成後刪除，不累積雜亂分支

這樣你可以長期維護自己的功能，同時輕鬆跟隨 upstream 的更新。
