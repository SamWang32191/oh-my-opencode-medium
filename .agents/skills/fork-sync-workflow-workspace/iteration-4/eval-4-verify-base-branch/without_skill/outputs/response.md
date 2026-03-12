# Eval 4 - Without Skill (Iteration 4)

查詢本地分支與 upstream 設定的幾個方法：

```bash
# 1. 查看目前預設分支（git config）
git config --get init.defaultBranch

# 2. 列出所有分支（含 remote）
git branch -a

# 3. 查看 remote 的預設分支
git remote show origin | grep "HEAD branch"

# 4. 直接看 upstream 有哪些分支
git ls-remote --heads origin
```

最快速的方式是 `git remote show origin | grep "HEAD branch"`，可以直接看到 upstream 的預設分支名稱。
