---
id: user-facing-config-changes-must-update-readme-reference-and-release-notes
date: 2026-03-20
scope: project
tags: [docs, config, readme, release, schema]
source: user-correction
confidence: 0.7
related: ["[[package-rename-must-cover-shipped-docs-tests-and-migration-paths]]"]
---

# User-facing config changes must update README, reference docs, and release notes together

## Context
I added a new root-level plugin config toggle for skill slash command conversion, but the user had to point out that the corresponding public documentation and release-note guidance were still missing.

## Mistake
I treated the code and tests as the complete change even though the new config option is part of the user-facing contract and is surfaced through shipped docs and generated schema.

## Lesson
- When adding or changing a user-facing config option, update the implementation and the docs in the same pass.
- For this repo, check at least `README.md`, `docs/quick-reference.md`, and the release-note guidance in `docs/medium-release.md` for any new config toggle or behavior switch.
- If the schema is generated from config metadata, rebuild it after config changes so editor autocomplete and published artifacts stay aligned with the docs.

## When to Apply
Apply this when adding, renaming, removing, or changing semantics/defaults of any plugin config field that users may discover through README examples, quick-reference tables, release notes, or generated JSON schema.
