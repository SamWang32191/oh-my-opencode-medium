# Eval 1 - With Skill

根據您的需求，這裡是建議的分支管理策略：

## 分支策略

```
upstream/master
      │
      v
 origin/master   <-- 只用來同步上游 + 接收功能
      │
      ├──> feat/your-feature
      ├──> fix/your-fix
      └──> chore/xxx
```

**核心概念**：
- `master` 是整合分支，不是開發分支
- 所有功能在 short-lived branches（如 `feat/*`、`fix/*`）開發
- 從 `origin/master` 開分支，開發完後 squash merge 回 `master`

## 同步上游的指令

```bash
# 1. 抓取上游更新
git fetch upstream --prune

# 2. 切到 master 並同步
git switch master
git merge upstream/master

# 3. 推送到你的 fork
git push origin master
```

## Feature Branch 更新（已在 review 中）

```bash
# 先同步 master
git switch master
git merge upstream/master
git push origin master

# 用 merge 把 master 合併進來（保留 review 歷史）
git switch feat/your-branch
git merge master
git push origin feat/your-branch
```

## Feature Branch 更新（私人分支，還沒推）

```bash
# 用 rebase 獲得線性歷史
git switch feat/your-branch
git rebase master
# 如果已經推過，需要 force push
git push --force-with-lease origin feat/your-branch
```

## 為什麼用 merge 而非 rebase？

- **review 中的分支**：rebase 會改寫歷史，review 會看到 commit SHA 變掉，協作者會困惑
- **squash merge 是最後一步**：PR merge 時自然會 squash，不需要事先 rebase
- **merge 保留 sync point**：日後要看「哪個 commit 來自上游」很清楚

## 警告

- **千萬不要在 `master` 上直接開發** — 會讓同步變複雜
- **不要在 shared/review 分支上 rebase** — 別人已經在用了
- **squash merge 是 merge 時選擇**，不是平時 rebase 的理由

這樣您的 fork 會保持乾淨，上游更新也能輕鬆同步。
