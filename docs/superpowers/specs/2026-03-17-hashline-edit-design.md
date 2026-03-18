# Hash-Anchored Edit Tool Design

## Goal

Add a Hash-Anchored Edit workflow to `oh-my-opencode-medium` that behaves as
close as practical to `oh-my-opencode`, including `read` output enhancement,
hash-validated `edit`, diff metadata enrichment, and opt-in config gating.

## Context

- `oh-my-opencode-medium` currently has no `edit` tool and registers tools
  directly in `src/index.ts`.
- `oh-my-opencode` implements hashline editing as a coordinated workflow:
  enhanced `read` output, a hash-aware `edit` tool, validation/recovery logic,
  and diff metadata hooks.
- Source parity should be measured against the local source checkout at
  `/Users/samwang/tmp/workspace/oh-my-opencode` as inspected during this design
  session, using the current working tree on its checked-out branch.
- The user wants the near-1:1 behavior of the source implementation, not just a
  lightweight approximation.
- The target repo should preserve its smaller architecture where possible, so
  parity should focus on external behavior and module boundaries rather than
  copying the entire source plugin framework.

## Recommended Approach

Port the hashline feature set into `oh-my-opencode-medium` as a dedicated
feature slice:

- add a new `src/tools/hashline-edit/` module family modeled after the source
  repo
- add `hashline_edit` to plugin config
- register `edit` conditionally when the flag is enabled
- add `hashline-read-enhancer` and `hashline-edit-diff-enhancer` hooks with
  source-compatible behavior, adapted to medium's direct hook wiring in
  `src/index.ts`

This keeps the implementation close to the source behavior while staying native
to the medium repo's simpler plugin bootstrap.

## Alternatives Considered

### 1. Near-1:1 feature port (recommended)

Pros:
- Preserves the full agent workflow: `read -> LINE#ID -> edit -> mismatch
  recovery -> diff`.
- Keeps future behavior comparisons with `oh-my-opencode` straightforward.
- Reduces prompt drift because the tool description and error model stay close
  to the source implementation.

Cons:
- More files and tests than a lightweight reimplementation.
- Requires adapting some source internals that do not exist in medium.

### 2. Minimal edit-only tool

Pros:
- Smallest change set.
- Fastest initial implementation.

Cons:
- Poor UX for agents because `read` would not emit reusable anchors.
- Not aligned with the user's requested near-1:1 behavior.

### 3. Full framework-level port

Pros:
- Highest structural parity with the source repository.

Cons:
- Pulls medium toward the source repo's heavier architecture.
- Adds complexity unrelated to the requested feature.

## Behavior

### Configuration

- Add `hashline_edit?: boolean` to `PluginConfigSchema` in
  `src/config/schema.ts`.
- Default behavior remains disabled when the field is omitted.
- When disabled:
  - no `edit` tool is registered
  - `read` output remains unchanged
  - diff enhancement hooks remain inert

### Read Enhancement

When `hashline_edit` is enabled, post-processing of `read` output should:

- transform numbered text output from `N: text` or `N| text` into
  `N#ID|text`
- support plain file output and `<content>` / `<file>` wrapped output
- skip non-text outputs
- skip truncated lines that already include OpenCode's truncation suffix,
  currently `... (line truncated to 2000 chars)`
- preserve all non-line-prefixed content outside transformed blocks

The hash format should match the source implementation:

- line references use `{line_number}#{hash_id}`
- `hash_id` is a two-character token derived from normalized line content
- formatted read lines use `{line_number}#{hash_id}|{content}`

### Edit Tool Interface

Register an `edit` tool when `hashline_edit` is enabled with source-aligned
arguments:

- `filePath: string`
- `edits: RawHashlineEdit[]`
- `delete?: boolean`
- `rename?: string`

`edits` support exactly three operations:

- `replace`
- `append`
- `prepend`

Operation semantics should match the source implementation:

- `replace` with `pos` only replaces one line
- `replace` with `pos` and `end` replaces an inclusive range
- `append` inserts after the anchor, or at EOF without an anchor
- `prepend` inserts before the anchor, or at BOF without an anchor
- `lines: null` or `lines: []` with `replace` deletes content
- `delete=true` deletes the file and requires `edits=[]`
- `rename` writes the final result to a new path and removes the original file

### Edit Execution Pipeline

The executor should follow the same high-level stages as the source repo:

1. validate top-level arguments
2. normalize raw edits into typed operations
3. read and canonicalize current file content
4. validate all line references against the current file snapshot
5. deduplicate identical edits
6. detect overlapping replace ranges
7. apply edits bottom-up
8. reject no-op results when content is unchanged and no rename occurred
9. write the updated content
10. emit success metadata including diff information

### Validation and Recovery

Line reference validation should remain strict and source-compatible:

- anchors must use `LINE#ID` format
- guessed or malformed anchors should return actionable errors
- stale anchors should throw a hash mismatch error

Hash mismatch errors should include:

- a clear explanation that lines changed since the last read
- nearby updated `LINE#ID` snippets
- `>>>` markers on changed lines
- a recovery hint telling the agent to reuse the updated tags directly

### Edit Ordering and Safety

- All edits in one call are interpreted against the original file snapshot.
- Application order should be bottom-up so earlier edits do not invalidate later
  line numbers.
- Replace ranges must not overlap.
- Duplicate identical edits should be deduplicated before application.
- No-op edits should be counted and surfaced in diagnostics.

### Text Normalization and Autocorrection

Near-1:1 parity should preserve the source tool's user-facing tolerance:

- split newline-delimited strings into line arrays
- preserve BOM and CRLF when rewriting files
- restore leading indentation when replacing lines
- strip accidental hashline prefixes or diff markers from replacement text
- strip echoed boundary lines when the model repeats surviving context around an
  insertion or replacement

### Missing File Behavior

- Missing files may be created only when every edit is unanchored `append` or
  `prepend`.
- Anchored edits against a missing file should fail clearly.

### Metadata and Diff Behavior

Successful `edit` calls should emit source-aligned metadata including:

- `filePath` / `path` / `file`
- unified `diff`
- `filediff.before`
- `filediff.after`
- `filediff.additions`
- `filediff.deletions`
- `firstChangedLine`
- `noopEdits`
- `deduplicatedEdits`

In addition, a diff enhancer hook should augment normal `write` operations when
the feature is enabled by:

- capturing prior file contents in `tool.execute.before`
- reading updated file contents in `tool.execute.after`
- attaching unified diff and filediff metadata
- updating the tool output title to the file path

## Module Plan

### Tool Modules

Create `src/tools/hashline-edit/` with source-aligned responsibilities:

- `index.ts`
- `tools.ts`
- `tool-description.ts`
- `types.ts`
- `normalize-edits.ts`
- `hashline-edit-executor.ts`
- `hash-computation.ts`
- `constants.ts`
- `validation.ts`
- `edit-ordering.ts`
- `edit-deduplication.ts`
- `edit-operations.ts`
- `edit-operation-primitives.ts`
- `edit-text-normalization.ts`
- `autocorrect-replacement-lines.ts`
- `file-text-canonicalization.ts`
- `diff-utils.ts`

Additional helper files may be included if the source implementation needs them
for parity, but the port should stay focused on the hashline feature slice.

### Hook Modules

Create:

- `src/hooks/hashline-read-enhancer/`
- `src/hooks/hashline-edit-diff-enhancer/`

and export them from `src/hooks/index.ts`.

### Plugin Wiring

Update `src/index.ts` so that:

- `edit` is registered only when `config.hashline_edit` is true
- the new hooks are initialized once near the existing hook setup
- `tool.execute.before` invokes the diff enhancer before write execution only
  when `config.hashline_edit` is true
- `tool.execute.after` invokes the read enhancer and diff enhancer alongside the
  existing after hooks only when `config.hashline_edit` is true

This should be done without moving medium to a separate registry/composer
framework.

## Testing Strategy

Use TDD and add focused Bun tests for both low-level logic and integration
behavior.

### Core Tool Tests

- line hash computation and formatting
- line reference normalization and validation
- mismatch error rendering with updated snippets
- edit normalization rules
- ordering and overlap detection
- deduplication behavior
- replace / append / prepend operations
- missing-file creation rules
- no-op detection
- rename and delete modes
- BOM / CRLF / indentation preservation

### Hook Tests

- `hashline-read-enhancer` transforms plain numbered output
- `hashline-read-enhancer` transforms `<content>` / `<file>` blocks
- `hashline-read-enhancer` skips non-text or truncated output
- `hashline-edit-diff-enhancer` attaches diff metadata for `write`

### Plugin Wiring Tests

- `hashline_edit=false` leaves `edit` unregistered and hooks inert
- `hashline_edit=true` registers `edit`
- after-hook chaining still preserves existing medium behaviors

## Error Handling

- Return actionable errors for invalid `delete` / `rename` combinations.
- Fail clearly when `edits` is empty in normal edit mode.
- Reject malformed or out-of-bounds line references.
- Reject stale hashes with recovery snippets.
- Reject overlapping replace ranges.
- Reject anchored insertions with empty payloads.
- Reject no-op edits with guidance to re-read and provide changed content.

## Non-Goals

- No attempt to port the full `oh-my-opencode` tool registry.
- No attempt to port unrelated source hooks or task-system infrastructure.
- No attempt to make medium structurally identical to the source repo outside
  this feature slice.

## Expected User Workflow

With `hashline_edit` enabled, the intended workflow is:

1. Run `read` on a target file.
2. Copy exact `LINE#ID` anchors from the read output.
3. Submit a single `edit` call per file with all related edits.
4. If the tool reports a hash mismatch, reuse the updated anchors from the
   error output.
5. Re-read the file before issuing another edit call on the same file.

## Implementation Notes

- Prefer copying source behavior and test cases over re-inventing semantics.
- Adapt only the integration layer needed for medium's simpler plugin entry.
- Keep file/module names close to the source repo where practical to simplify
  future comparison and patch porting.
- Do not create a design dependency on source-only metadata stores if the same
  behavior can be expressed directly through returned metadata in medium.
- Because commits require explicit user request in this environment, writing the
  design doc does not imply creating a git commit.
