# LSP Cache Bin Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 LSP binary 偵測只支援 OpenCode 1.3.0+ 的 cache bin 路徑，移除 `OPENCODE_CONFIG_DIR/bin`。

**Architecture:** 變更僅限 `src/tools/lsp/config.ts` 的 binary 搜尋邏輯。保留既有 path-like command、PATH、`node_modules/.bin` 偵測流程，僅替換 OpenCode 專用 bin 路徑來源，並以測試先鎖定 Unix、XDG、Windows 與舊路徑負向回歸行為。

**Tech Stack:** TypeScript、Bun test、which

---

## File map

- Modify: `src/tools/lsp/config.test.ts` — 以 TDD 先鎖住新版 cache bin 行為與舊路徑負向回歸
- Modify: `src/tools/lsp/config.ts` — 實作新版 OpenCode cache bin 路徑解析並更新 `isServerInstalled()`
- Reference: `docs/superpowers/specs/2026-03-25-lsp-cache-bin-design.md` — 已核准規格
- Reference: `src/hooks/auto-update-checker/constants.ts:9-14` — repo 既有 Windows cache 慣例

### Task 1: 先把新版 cache 路徑行為寫成 failing tests

**Files:**
- Modify: `src/tools/lsp/config.test.ts:32-118`
- Reference: `src/tools/lsp/config.ts:125-164`

- [ ] **Step 1: 寫新版 Unix/XDG/Windows 與負向回歸測試**

在 `describe('isServerInstalled', ...)` 中調整／新增測試，至少涵蓋：

```ts
test('should detect server in default opencode cache bin', () => {
  const cacheBin = join(
    '/home/user',
    '.cache',
    'opencode',
    'bin',
    'typescript-language-server',
  );

  whichSyncMock.mockReturnValue(cacheBin);

  expect(isServerInstalled(['typescript-language-server'])).toBe(true);
});

test('should detect server in XDG_CACHE_HOME opencode bin', () => {
  const original = process.env.XDG_CACHE_HOME;
  process.env.XDG_CACHE_HOME = '/tmp/xdg-cache';

  try {
    whichSyncMock.mockImplementation((_cmd, options) => {
      if (options?.path?.includes('/tmp/xdg-cache/opencode/bin')) {
        return '/tmp/xdg-cache/opencode/bin/typescript-language-server';
      }
      return null;
    });

    expect(isServerInstalled(['typescript-language-server'])).toBe(true);
  } finally {
    if (original === undefined) delete process.env.XDG_CACHE_HOME;
    else process.env.XDG_CACHE_HOME = original;
  }
});

test('should ignore OPENCODE_CONFIG_DIR bin', () => {
  const original = process.env.OPENCODE_CONFIG_DIR;
  process.env.OPENCODE_CONFIG_DIR = '/legacy/opencode-config';

  try {
    whichSyncMock.mockImplementation((_cmd, options) => {
      if (options?.path?.includes('/legacy/opencode-config/bin')) {
        return '/legacy/opencode-config/bin/typescript-language-server';
      }
      return null;
    });

    expect(isServerInstalled(['typescript-language-server'])).toBe(false);
  } finally {
    if (original === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = original;
  }
});
```

再補 Windows 分支測試，至少涵蓋兩種情境：

- `LOCALAPPDATA` 存在時，`which` 搜尋路徑包含 `LOCALAPPDATA/opencode/bin`
- `LOCALAPPDATA` 不存在時，fallback 到 `join(homedir(), 'opencode', 'bin')`

兩個 Windows 測試都要再驗證：
- 不包含任何 `XDG_CACHE_HOME` / `.cache/opencode/bin` 路徑
- `pathExt` 仍沿用 `process.env.PATHEXT`

建議測法：暫時用 `Object.defineProperty(process, 'platform', { value: 'win32' })`
建立測試情境，並在 `finally` 還原原值與相關 env；若實作時發現測試污染風險過高，先抽出可測的 cache bin helper，再改測 helper 回傳值與 `which` 參數。

最後補一個 path-like command 測試，確認 `['./bin/custom-lsp']` 仍以 `existsSync()` 判斷，而不是走 cache bin 搜尋。

- [ ] **Step 2: 跑測試確認是紅燈**

Run:

```bash
bun test src/tools/lsp/config.test.ts
```

Expected:
- 新增的新版 cache bin / Windows / ignore OPENCODE_CONFIG_DIR / path-like command 測試先失敗
- 失敗原因是實作仍在找舊路徑，不是測試語法錯誤

### Task 2: 實作新版 cache bin 路徑並讓測試轉綠

**Files:**
- Modify: `src/tools/lsp/config.ts:125-164`
- Test: `src/tools/lsp/config.test.ts`
- Reference: `src/hooks/auto-update-checker/constants.ts:9-14`

- [ ] **Step 1: 在 `config.ts` 寫最小 helper 計算 OpenCode cache bin 路徑**

新增小型 helper，僅供本檔使用：

```ts
function getOpenCodeCacheBinDir(): string {
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA ?? homedir(), 'opencode', 'bin');
  }

  const cacheHome = process.env.XDG_CACHE_HOME?.trim();
  return join(cacheHome || join(homedir(), '.cache'), 'opencode', 'bin');
}
```

要求：
- 不再讀取 `OPENCODE_CONFIG_DIR`
- 不外露新 helper
- 不改動 `findServerForExtension()` 等其他邏輯

- [ ] **Step 2: 用 helper 替換 `isServerInstalled()` 內的舊搜尋路徑**

將這段：

```ts
const opencodeConfigDir =
  process.env.OPENCODE_CONFIG_DIR ?? join(homedir(), '.config', 'opencode');
const opencodeBin = join(opencodeConfigDir, 'bin');
```

替換為：

```ts
const opencodeBin = getOpenCodeCacheBinDir();
```

保留以下既有行為：
- `command.length === 0` 直接回傳 `false`
- command 含 `/` 或 `\\` 時直接 `existsSync()`
- Windows 仍使用 `;` 與 `PATHEXT`
- `node_modules/.bin` fallback 不變

- [ ] **Step 3: 跑針對性測試確認轉綠**

Run:

```bash
bun test src/tools/lsp/config.test.ts
```

Expected:
- `config.test.ts` 全綠

- [ ] **Step 4: 跑型別與 repo 相關檢查**

Run:

```bash
bun run typecheck
bun run check:ci
```

Expected:
- typecheck 通過
- lint / format / import order 檢查通過

- [ ] **Step 5: Commit**

```bash
git add src/tools/lsp/config.ts src/tools/lsp/config.test.ts
git commit -m "fix: use opencode cache bin for lsp detection"
```

### Task 3: 最後核對行為與文件一致性

**Files:**
- Modify if needed: `src/tools/lsp/config.ts`
- Modify if needed: `src/tools/lsp/config.test.ts`
- Reference: `docs/superpowers/specs/2026-03-25-lsp-cache-bin-design.md`

- [ ] **Step 1: 對照 spec 檢查是否有殘留舊路徑語意**

確認：
- 測試名稱、註解、錯誤描述都不再提 `OPENCODE_CONFIG_DIR/bin` 為支援路徑
- 僅保留負向回歸測試用於鎖住「不支援舊路徑」

- [ ] **Step 2: 如有微小不一致，做最小修正並重跑 `config.test.ts`**

Run:

```bash
bun test src/tools/lsp/config.test.ts
```

Expected:
- 測試仍全綠

- [ ] **Step 3: 準備交付摘要**

摘要應包含：
- `isServerInstalled()` 現在改查哪些路徑
- 明確不再支援 `OPENCODE_CONFIG_DIR/bin`
- 執行了哪些測試與結果
