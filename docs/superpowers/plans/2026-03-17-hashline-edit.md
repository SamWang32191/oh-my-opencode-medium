# Hash-Anchored Edit Tool Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a near-1:1 port of `oh-my-opencode`'s hashline editing workflow to `oh-my-opencode-medium`, including `read` hash anchors, a hash-validated `edit` tool, diff enhancement, and config gating.

**Architecture:** Port the hashline feature as a dedicated slice under `src/tools/hashline-edit/` plus two hook modules under `src/hooks/`. Keep medium's direct plugin wiring in `src/index.ts`, but preserve source behavior and module boundaries wherever practical. Use TDD for each unit: tests first, verify failure, then add the minimum code to pass.

**Tech Stack:** TypeScript, Bun test, Zod, `@opencode-ai/plugin`, Bun file APIs

---

## File Structure

### Source parity references

- Read for parity: `/Users/samwang/tmp/workspace/oh-my-opencode/src/tools/hashline-edit/tools.ts`
- Read for parity: `/Users/samwang/tmp/workspace/oh-my-opencode/src/tools/hashline-edit/hashline-edit-executor.ts`
- Read for parity: `/Users/samwang/tmp/workspace/oh-my-opencode/src/tools/hashline-edit/hash-computation.ts`
- Read for parity: `/Users/samwang/tmp/workspace/oh-my-opencode/src/tools/hashline-edit/validation.ts`
- Read for parity: `/Users/samwang/tmp/workspace/oh-my-opencode/src/hooks/hashline-read-enhancer/hook.ts`
- Read for parity: `/Users/samwang/tmp/workspace/oh-my-opencode/src/hooks/hashline-edit-diff-enhancer/hook.ts`

### Files to create

- `src/tools/hashline-edit/index.ts`
- `src/tools/hashline-edit/tools.ts`
- `src/tools/hashline-edit/tool-description.ts`
- `src/tools/hashline-edit/types.ts`
- `src/tools/hashline-edit/constants.ts`
- `src/tools/hashline-edit/hash-computation.ts`
- `src/tools/hashline-edit/normalize-edits.ts`
- `src/tools/hashline-edit/validation.ts`
- `src/tools/hashline-edit/edit-ordering.ts`
- `src/tools/hashline-edit/edit-deduplication.ts`
- `src/tools/hashline-edit/edit-text-normalization.ts`
- `src/tools/hashline-edit/autocorrect-replacement-lines.ts`
- `src/tools/hashline-edit/edit-operation-primitives.ts`
- `src/tools/hashline-edit/edit-operations.ts`
- `src/tools/hashline-edit/file-text-canonicalization.ts`
- `src/tools/hashline-edit/diff-utils.ts`
- `src/tools/hashline-edit/hashline-edit-executor.ts`
- `src/tools/hashline-edit/hash-computation.test.ts`
- `src/tools/hashline-edit/normalize-edits.test.ts`
- `src/tools/hashline-edit/validation.test.ts`
- `src/tools/hashline-edit/edit-ordering.test.ts`
- `src/tools/hashline-edit/edit-deduplication.test.ts`
- `src/tools/hashline-edit/edit-operation-primitives.test.ts`
- `src/tools/hashline-edit/edit-operations.test.ts`
- `src/tools/hashline-edit/file-text-canonicalization.test.ts`
- `src/tools/hashline-edit/hashline-edit-executor.test.ts`
- `src/tools/hashline-edit/tools.test.ts`
- `src/hooks/hashline-read-enhancer/index.ts`
- `src/hooks/hashline-read-enhancer/index.test.ts`
- `src/hooks/hashline-edit-diff-enhancer/index.ts`
- `src/hooks/hashline-edit-diff-enhancer/index.test.ts`

### Files to modify

- `src/tools/index.ts`
- `src/hooks/index.ts`
- `src/config/schema.ts`
- `src/index.ts`
- `README.md`
- `scripts/generate-schema.ts` if schema generation requires explicit field handling after the config change

### Existing tests to keep green

- `src/config/loader.test.ts`
- `src/hooks/json-error-recovery/index.test.ts`
- `src/hooks/phase-reminder/index.test.ts`
- `src/tools/grep/grep.test.ts`

### Verification commands

- `bun test src/tools/hashline-edit`
- `bun test src/hooks/hashline-read-enhancer/index.test.ts`
- `bun test src/hooks/hashline-edit-diff-enhancer/index.test.ts`
- `bun test src/config/loader.test.ts`
- `bun run typecheck`
- `bun run check:ci`
- `bun test`

### Error matrix to cover during TDD

- `src/tools/hashline-edit/normalize-edits.test.ts`
  - `replace` without any anchor fails
  - `edits=[]` in normal mode is rejected by the executor-facing path
- `src/tools/hashline-edit/validation.test.ts`
  - malformed `LINE#ID` fails
  - out-of-bounds refs fail
  - stale hash emits `>>>` recovery snippet
- `src/tools/hashline-edit/edit-operation-primitives.test.ts`
  - anchored append with empty payload fails
  - anchored prepend with empty payload fails
- `src/tools/hashline-edit/hashline-edit-executor.test.ts`
  - invalid `delete` + `rename` combination fails
  - `delete=true` with non-empty edits fails
  - `delete=true` with `edits=[]` deletes the file successfully
  - missing file + anchored edit fails
  - no-op edit fails with guidance

### Task 1: Add config gating for hashline edit

**Files:**
- Modify: `src/config/schema.ts`
- Test: `src/config/loader.test.ts`

- [ ] **Step 1: Write the failing config test**

Add a new test in `src/config/loader.test.ts` proving that project config can load:

```ts
test('loads hashline_edit flag when configured', () => {
  // write config with { hashline_edit: true }
  // expect loadPluginConfig(projectDir).hashline_edit toBe(true)
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test src/config/loader.test.ts -t "loads hashline_edit flag when configured"`
Expected: FAIL because `hashline_edit` is not part of the schema yet.

- [ ] **Step 3: Add the schema field**

Update `src/config/schema.ts` to include:

```ts
hashline_edit: z.boolean().optional(),
```

in `PluginConfigSchema`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test src/config/loader.test.ts -t "loads hashline_edit flag when configured"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/schema.ts src/config/loader.test.ts
git commit -m "feat: add hashline edit config flag"
```

### Task 2: Port hashline primitives and validation

**Files:**
- Create: `src/tools/hashline-edit/constants.ts`
- Create: `src/tools/hashline-edit/types.ts`
- Create: `src/tools/hashline-edit/hash-computation.ts`
- Create: `src/tools/hashline-edit/normalize-edits.ts`
- Create: `src/tools/hashline-edit/validation.ts`
- Create: `src/tools/hashline-edit/edit-ordering.ts`
- Create: `src/tools/hashline-edit/edit-deduplication.ts`
- Create: `src/tools/hashline-edit/hash-computation.test.ts`
- Create: `src/tools/hashline-edit/normalize-edits.test.ts`
- Create: `src/tools/hashline-edit/validation.test.ts`
- Create: `src/tools/hashline-edit/edit-ordering.test.ts`
- Create: `src/tools/hashline-edit/edit-deduplication.test.ts`

- [ ] **Step 1: Write failing tests for hash formatting and validation**

Cover at least:
- `computeLineHash()` parity shape and `formatHashLine()` output
- `normalizeHashlineEdits()` semantics for `replace`, `append`, `prepend`
- `parseLineRef()` success and invalid format errors
- `HashlineMismatchError` output includes updated `LINE#ID` snippets and `>>>`
- overlap detection and dedupe behavior

Example seed test:

```ts
test('formats a hashline as LINE#ID|content', () => {
  expect(formatHashLine(2, 'const x = 1;')).toMatch(/^2#[A-Z]{2}\|const x = 1;$/);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `bun test src/tools/hashline-edit`
Expected: FAIL because the module files do not exist yet.

- [ ] **Step 3: Port the minimal source-compatible implementations**

Implement the modules with the same exported responsibilities as the source repo:
- `constants.ts` defines hash dictionary and ref regex
- `hash-computation.ts` exports `computeLineHash`, `computeLegacyLineHash`, `formatHashLine`, `formatHashLines`
- `normalize-edits.ts` exports `RawHashlineEdit` and `normalizeHashlineEdits`
- `validation.ts` exports `normalizeLineRef`, `parseLineRef`, `validateLineRef`, `validateLineRefs`, `HashlineMismatchError`
- `edit-ordering.ts` exports `getEditLineNumber`, `collectLineRefs`, `detectOverlappingRanges`
- `edit-deduplication.ts` exports `dedupeEdits`

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `bun test src/tools/hashline-edit`
Expected: PASS for the new primitive tests.

- [ ] **Step 5: Commit**

```bash
git add src/tools/hashline-edit
git commit -m "feat: port hashline validation primitives"
```

### Task 3: Port text normalization and edit application

**Files:**
- Create: `src/tools/hashline-edit/edit-text-normalization.ts`
- Create: `src/tools/hashline-edit/autocorrect-replacement-lines.ts`
- Create: `src/tools/hashline-edit/edit-operation-primitives.ts`
- Create: `src/tools/hashline-edit/edit-operations.ts`
- Create: `src/tools/hashline-edit/edit-operation-primitives.test.ts`
- Create: `src/tools/hashline-edit/edit-operations.test.ts`

- [ ] **Step 1: Write failing tests for replace/append/prepend behavior**

Cover at least:
- single-line replace by anchor
- range replace by `pos` and `end`
- anchored append and prepend
- unanchored append and prepend on empty and non-empty files
- `lines: null` deletion through replace
- dedupe and no-op counts
- stripping echoed boundary lines and preserving indentation where the source does

Example seed test:

```ts
test('applies multiple edits bottom-up against the original snapshot', () => {
  const content = ['a', 'b', 'c'].join('\n');
  const result = applyHashlineEditsWithReport(content, edits);
  expect(result.content).toBe(expected);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `bun test src/tools/hashline-edit -t "applies|replace|append|prepend|noop"`
Expected: FAIL because the edit application modules are missing.

- [ ] **Step 3: Port the edit application modules**

Implement source-aligned logic for:
- newline normalization
- diff-marker/hashline-prefix stripping
- indentation restoration
- boundary echo stripping
- primitive insertion/replacement helpers
- `applyHashlineEditsWithReport()` and `applyHashlineEdits()`

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `bun test src/tools/hashline-edit -t "applies|replace|append|prepend|noop"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/hashline-edit
git commit -m "feat: port hashline edit application logic"
```

### Task 4: Port file canonicalization, diff utilities, executor, and tool definition

**Files:**
- Create: `src/tools/hashline-edit/file-text-canonicalization.ts`
- Create: `src/tools/hashline-edit/diff-utils.ts`
- Create: `src/tools/hashline-edit/tool-description.ts`
- Create: `src/tools/hashline-edit/hashline-edit-executor.ts`
- Create: `src/tools/hashline-edit/tools.ts`
- Create: `src/tools/hashline-edit/index.ts`
- Create: `src/tools/hashline-edit/file-text-canonicalization.test.ts`
- Create: `src/tools/hashline-edit/hashline-edit-executor.test.ts`
- Create: `src/tools/hashline-edit/tools.test.ts`
- Modify: `src/tools/index.ts`

- [ ] **Step 1: Write failing executor and tool tests**

Cover at least:
- rejecting bad `delete` / `rename` combinations
- rejecting `edits=[]` in normal mode
- successful `delete=true` with `edits=[]` deletes the file and returns the expected success string
- missing file failure for anchored edits
- missing file creation for unanchored append/prepend
- successful update returns `Updated <path>`
- successful rename returns `Moved <old> to <new>`
- no-op edit returns an error string
- successful update emits metadata containing `filePath`, `path`, `file`,
  `diff`, `filediff.before`, `filediff.after`, `filediff.additions`,
  `filediff.deletions`, `firstChangedLine`, `noopEdits`, and
  `deduplicatedEdits`
- tool export registration via `src/tools/index.ts`
- tool description contains the key workflow rules from the source prompt

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `bun test src/tools/hashline-edit`
Expected: FAIL because executor/tool modules are not implemented yet.

- [ ] **Step 3: Implement the executor and tool wiring**

Port:
- file canonicalization helpers to preserve BOM and CRLF
- unified diff helpers and change counts
- the source-oriented tool description
- `executeHashlineEditTool()`
- `createHashlineEditTool()`
- `src/tools/index.ts` exports for the new module

If medium lacks a source-only metadata store helper, return metadata directly from the tool context path used by `@opencode-ai/plugin` instead of porting unrelated infrastructure.

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `bun test src/tools/hashline-edit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/hashline-edit src/tools/index.ts
git commit -m "feat: add hashline edit tool"
```

### Task 5: Add read enhancer hook

**Files:**
- Create: `src/hooks/hashline-read-enhancer/index.ts`
- Create: `src/hooks/hashline-read-enhancer/index.test.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: Write failing hook tests**

Cover at least:
- transforming plain numbered output like `1: foo`
- transforming pipe-numbered output like `1| foo`
- transforming `<content>` wrapped output
- transforming `<file>` wrapped output
- skipping non-text output
- skipping lines ending with `... (line truncated to 2000 chars)`
- remaining inert when feature config is disabled

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `bun test src/hooks/hashline-read-enhancer/index.test.ts`
Expected: FAIL because the hook does not exist yet.

- [ ] **Step 3: Implement the hook and export it**

Port the source logic into `src/hooks/hashline-read-enhancer/index.ts` and export it from `src/hooks/index.ts`.

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `bun test src/hooks/hashline-read-enhancer/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/hashline-read-enhancer src/hooks/index.ts
git commit -m "feat: add hashline read enhancer"
```

### Task 6: Add write diff enhancer hook

**Files:**
- Create: `src/hooks/hashline-edit-diff-enhancer/index.ts`
- Create: `src/hooks/hashline-edit-diff-enhancer/index.test.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: Write failing hook tests**

Cover at least:
- capture old content in `tool.execute.before` for `write`
- attach `metadata.diff` and `metadata.filediff` in `tool.execute.after`
- set `output.title` to the file path
- skip processing when disabled
- skip non-`write` tools

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `bun test src/hooks/hashline-edit-diff-enhancer/index.test.ts`
Expected: FAIL because the hook does not exist yet.

- [ ] **Step 3: Implement the diff enhancer and export it**

Port the source behavior into `src/hooks/hashline-edit-diff-enhancer/index.ts` and export it from `src/hooks/index.ts`.

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `bun test src/hooks/hashline-edit-diff-enhancer/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/hashline-edit-diff-enhancer src/hooks/index.ts
git commit -m "feat: add hashline diff enhancer"
```

### Task 7: Wire the feature into the plugin entrypoint

**Files:**
- Modify: `src/index.ts`
- Test: `src/index.ts` via a new focused test file if needed, e.g. `src/index.hashline.test.ts`

- [ ] **Step 1: Write the failing wiring tests**

Add focused tests proving that:
- `edit` is registered only when `hashline_edit` is enabled
- `tool.execute.before` calls the diff enhancer before write execution when enabled
- `tool.execute.after` runs the diff enhancer and read enhancer only when enabled
- existing after hooks still run in the expected order

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `bun test -t "hashline wiring|registers edit when hashline_edit is enabled"`
Expected: FAIL because `src/index.ts` is not wired yet.

- [ ] **Step 3: Implement plugin wiring**

Update `src/index.ts` to:
- initialize both new hooks
- conditionally register `edit: createHashlineEditTool()` in the tool map
- call the diff enhancer in `tool.execute.before`
- call the diff enhancer before the read enhancer in `tool.execute.after`
- preserve existing hook behavior after the new calls

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `bun test -t "hashline wiring|registers edit when hashline_edit is enabled"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/index.hashline.test.ts
git commit -m "feat: wire hashline editing into plugin"
```

### Task 8: Document and verify the feature end-to-end

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-03-17-hashline-edit-design.md` only if implementation reveals a true spec mismatch

- [ ] **Step 1: Write the failing docs test or checklist item**

Add or update documentation to cover:
- the `hashline_edit` config flag
- the `read -> edit -> re-read` workflow
- mismatch recovery using updated `LINE#ID` snippets

If the repo has no docs tests, treat this as a documented manual verification step instead of inventing a docs test framework.

- [ ] **Step 2: Update the README minimally**

Add a focused section showing example config and one example `LINE#ID` edit flow.

- [ ] **Step 3: Run full verification**

Run:

```bash
bun test src/tools/hashline-edit
bun test src/hooks/hashline-read-enhancer/index.test.ts
bun test src/hooks/hashline-edit-diff-enhancer/index.test.ts
bun test src/config/loader.test.ts
bun run typecheck
bun run check:ci
bun test
```

Expected:
- all targeted tests PASS
- typecheck PASS
- Biome check PASS
- full test suite PASS

- [ ] **Step 4: Run one manual workflow check**

Use a temporary file and verify the real operator flow:
- run `read` and confirm output contains `LINE#ID|content`
- run `edit` using those anchors and confirm success metadata/diff exists
- mutate the file or reuse stale anchors and confirm mismatch recovery shows
  updated `>>>` lines
- re-read and confirm the new anchors reflect the updated file

- [ ] **Step 5: Review changed files for duplication and parity drift**

Check that the port stayed close to the source behavior and that no source-only infrastructure was copied unnecessarily.

- [ ] **Step 6: Commit**

```bash
git add README.md src/config/schema.ts src/hooks src/index.ts src/tools/hashline-edit src/tools/index.ts
git commit -m "feat: port hashline editing workflow"
```

## Notes for the Implementer

- Follow the source hash algorithm exactly via `computeLineHash()` and `computeLegacyLineHash()` semantics from `/Users/samwang/tmp/workspace/oh-my-opencode/src/tools/hashline-edit/hash-computation.ts`.
- Preserve the read-enhancer truncation skip for the exact marker `... (line truncated to 2000 chars)`.
- Maintain after-hook ordering in `src/index.ts` so existing medium hooks still run; add hashline diff enhancement before hashline read enhancement, then keep the current after-hook sequence intact.
- Keep the implementation focused on this feature slice. Do not port the full source tool registry, hook composer, or metadata store system.
