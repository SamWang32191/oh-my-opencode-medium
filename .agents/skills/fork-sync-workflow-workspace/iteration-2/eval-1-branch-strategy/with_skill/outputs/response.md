# Eval 1 - With Skill (Iteration 2)

## 目前狀態假設

- 長期維護功能分支，需與上游持續同步
- 偏好 squash merge 作為最終整合方式
- `master` 為整合分支，`origin` 為個人 fork，`upstream` 為原作者 repo

## 推薦分支策略

| 分支 | 用途 | 生命週期 |
|------|------|----------|
| `master` | 整合分支，連接 upstream/master | 長期 |
| `feat/*` / `fix/*` | 功能開發或修補 | 短期，完成後刪除 |

## 同步上游指令

```bash
git fetch origin upstream --prune
git switch master
git pull --ff-only origin master
git merge upstream/master
git push origin master
```

## 為何適合 fork + squash merge

1. **master 保持乾淨**：僅存放已整合的 commit，不會有多餘的中間 commit
2. **功能分支獨立開發**：每個 `feat/*` 可自由 rebase、互不干擾
3. **squash merge 簡化歷史**：feature 分支的所有 commit 會合併成單一 commit 進入 master，日後追蹤更直觀
4. **長期維護彈性**：feature 分支可保留多年，隨時 rebase 到最新的 master

## 注意事項

- **千萬不要在 master 上執行 rebase**：master 是共享的歷史，rebase 會改寫已推送到 origin 的 commit，造成協作混亂
- **先測試再 merge**：每次 `git merge upstream/master` 後建議跑測試，確認整合沒問題再 push
- **feature 分支完成後立即 squash merge**：避免分支長期懸浮，減少日後 merge conflict 的風險
- **保持 upstream 追蹤**：若有新的上游變更，定期執行上述同步指令，避免落後太多導致大規模 conflict
