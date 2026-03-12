# Eval 4 - With Skill (Iteration 4)

## 查詢預設分支

在同步 upstream 之前，先確認本地和遠端的分支名稱：

```bash
# 查詢遠端預設分支
git remote show origin | grep "HEAD branch"

# 或用 GitHub CLI 查詢
gh repo view --json defaultBranchRef
```

## 同步 upstream 的標準流程

確認分支名稱後，統一使用以下步驟（把 `main` 替換成實際的分支名稱）：

```bash
# 1. 新增 upstream 遠端（如果還沒有的話）
git remote add upstream https://github.com/原始作者/專案.git

# 2. 抓取 upstream 最新變更
git fetch upstream

# 3. 合併到本地分支
git checkout main
git merge upstream/main
```

**注意：** 如果你的 fork 實際上是 `master` 分支，上述指令中的 `main` 都要改成 `master`。先查詢再執行，才不會把變更合併到錯誤的分支。
