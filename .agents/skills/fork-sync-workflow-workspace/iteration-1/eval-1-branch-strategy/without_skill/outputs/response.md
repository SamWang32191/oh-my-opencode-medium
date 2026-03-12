# Eval 1 - Without Skill

# Fork 專案分支管理策略（偏好 Squash Merge）

## 推薦的分支結構

```
origin/main           # 你的 fork 主分支（對應 upstream/main）
origin/feature/xxx    # 你的功能分支
upstream/main         # 上游原作者的主分支
upstream/dev          # 上游開發分支（如果有）
```

## 日常工作流程

### 1. 同步上游
```bash
# 從 upstream fetch 最新碼
git fetch upstream

# 將 upstream/main 合併到你的分支（用 rebase 保持線性歷史）
git checkout main
git rebase upstream/main

# 推送到自己的 fork
git push origin main --force-with-lease
```

### 2. 開發新功能
```bash
# 從最新的 main 建立功能分支
git checkout -b feature/your-feature

# 開發完成後，rebase 到最新的 main
git fetch origin
git rebase origin/main

# 用 squash merge 合併到 main
git checkout main
git merge --squash feature/your-feature
git commit -m "feat: your feature description"
git push origin main
```

### 3. 長期維護多個功能
```
main (squash merge 後的乾淨歷史)
├── feature/auth
├── feature/ui
└── feature/api
```

每個功能獨立分支，開發完成後再 squash 進 main。

## 核心原則

| 原則 | 做法 |
|------|------|
| **保持 main 乾淨** | 只接受 squash merge，不直接 commit |
| **永遠從 main rebase** | 合併前先 rebase，避免 merge commit |
| **用 --force-with-lease** | 推送時避免覆蓋別人的貢獻 |
| **定期 sync upstream** | 每週或每次開發前同步，避免衝突累積 |

## 簡化版指令別名

在 `.gitconfig` 加入：
```ini
[alias]
  sync = "!git fetch upstream && git rebase upstream/main"
  sq = merge --squash
```

這樣只需 `git sync` 就能同步上游，`git sq feature/xxx` 就能 squash 合併。
