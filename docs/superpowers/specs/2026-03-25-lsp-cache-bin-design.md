# LSP binary detection should use OpenCode cache path

## Context

`src/tools/lsp/config.ts` 的 `isServerInstalled()` 目前會把
`OPENCODE_CONFIG_DIR/bin`（未設定時 `~/.config/opencode/bin`）加入搜尋路徑。

但在 OpenCode 1.3.0 之後，LSP binaries 的安裝位置已改為 cache 路徑：

- `$XDG_CACHE_HOME/opencode/bin`
- 未設定時 `~/.cache/opencode/bin`

目前行為會導致已安裝於新版 cache 位置的 LSP binary 被誤判成未安裝。

## Goal

讓 `src/tools/lsp/config.ts` 的 LSP binary 偵測邏輯只支援 OpenCode 1.3.0+
的新路徑模型，並移除對 `OPENCODE_CONFIG_DIR/bin` 的依賴。

## Non-goals

- 不調整 OpenCode 主設定檔位置解析邏輯
- 不保留舊版 `OPENCODE_CONFIG_DIR/bin` 的向後相容
- 不更動 LSP server 選擇、root 偵測、或工具輸出格式

## Chosen approach

在 `src/tools/lsp/config.ts` 內新增一個小型 helper，專責計算 OpenCode
LSP binary cache 目錄：

- 若有 `XDG_CACHE_HOME`，使用 `$XDG_CACHE_HOME/opencode/bin`
- 否則使用 `~/.cache/opencode/bin`

`isServerInstalled()` 的搜尋順序維持簡單明確：

1. 保留現有 path-like command 檢查語意（command 含 `/` 或 `\\` 時直接做存在檢查）
2. `PATH` + OpenCode cache bin 路徑的 `which` 搜尋
3. 專案 `node_modules/.bin`

不再檢查 `OPENCODE_CONFIG_DIR/bin`。

### Platform behavior

- 在非 Windows 平台：
  - 若有 `XDG_CACHE_HOME`，使用 `$XDG_CACHE_HOME/opencode/bin`
  - 否則使用 `~/.cache/opencode/bin`
- 在 Windows 平台：
  - 不使用 XDG 規則
  - 與 repo 既有 cache 慣例對齊，使用 `LOCALAPPDATA/opencode/bin`
  - 若 `LOCALAPPDATA` 不存在，fallback 為 `homedir()/opencode/bin`
  - 既有 `which` 的 `;` 分隔與 `PATHEXT` 行為維持不變

此變更只替換 OpenCode 專用 bin 目錄來源，不改動既有 Windows 查找流程的其他部分。

## Alternatives considered

### 1. 同時支援新版 cache 與舊版 config 路徑

優點：向後相容。

缺點：需求已明確指定只支援新版，且雙軌行為會讓維護者誤以為兩種安裝模型都仍受支持。

### 2. 只替換路徑字串，不抽 helper

優點：改動最少。

缺點：可讀性較差，之後若其他地方也要跟新版 cache 路徑對齊，不易重用與驗證。

## Testing strategy

依 TDD 先更新 `src/tools/lsp/config.test.ts`：

- 移除 `OPENCODE_CONFIG_DIR/bin` 測試
- 新增預設 `~/.cache/opencode/bin` 測試
- 新增 `XDG_CACHE_HOME/opencode/bin` 測試
- 新增 Windows cache bin 路徑測試，確認使用 `LOCALAPPDATA/opencode/bin`，並保留 `PATHEXT` / `;` 分隔行為
- 新增負向回歸測試：若 binary 只存在 `OPENCODE_CONFIG_DIR/bin`，應視為未安裝
- 新增 path-like command 回歸測試，確認含路徑字元的 command 仍沿用現有存在檢查語意

再修改實作讓測試通過。

另外保留既有測試，確保：

- 空 command 仍回傳 false
- 絕對路徑檢查不受影響
- PATH 偵測不受影響
- `node_modules/.bin` 偵測不受影響

## Risks and mitigations

- **風險：** 把 config 目錄與 cache 目錄概念混在一起，導致其他邏輯被誤改。
  - **緩解：** 僅修改 `src/tools/lsp/config.ts` 的 LSP binary 搜尋邏輯，不碰 CLI 設定檔路徑工具。
- **風險：** 測試描述仍保留舊版路徑語意。
  - **緩解：** 一併更新測試名稱與註解，讓意圖與 OpenCode 1.3.0+ 行為一致。

## Files expected to change

- `src/tools/lsp/config.ts`
- `src/tools/lsp/config.test.ts`
