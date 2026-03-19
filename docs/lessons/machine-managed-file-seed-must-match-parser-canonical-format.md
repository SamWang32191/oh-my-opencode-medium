---
id: machine-managed-file-seed-must-match-parser-canonical-format
date: 2026-03-19
scope: project
tags:
  - release
  - parser
  - docs
  - automation
  - canonical-format
source: bug-fix
confidence: 0.5
related:
  - [[git-tags-only-capture-committed-version-bumps]]
---

# Machine-managed file seed must match parser canonical format

## Context
While redesigning the stable release workflow, the release script used
`docs/release-mapping.md` as the source of record and parsed it before appending
the next release entry.

## Mistake
The checked-in seed file contained extra explanatory prose that the parser did
not accept. The file looked reasonable to a human, but the first real release
would have failed with `Release mapping file is malformed.` before writing the
new entry.

## Lesson
- When a committed file is machine-managed, the checked-in seed content must be
  valid under the same canonical parser rules as later generated content.
- If operators need extra explanation, put it in surrounding docs, not inside
  the machine-managed file unless the parser explicitly supports it.
- Add at least one test that round-trips against the actual checked-in starter
  file shape, not only synthetic fixture strings.

## When to Apply
Apply this when adding release manifests, lockfiles, mapping files, generated
indexes, or any repo-tracked document that a script both reads and rewrites.
