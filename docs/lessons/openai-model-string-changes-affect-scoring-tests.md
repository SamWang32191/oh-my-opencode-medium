---
id: openai-model-string-changes-affect-scoring-tests
date: 2026-03-20
scope: project
tags: [tests, scoring, model-selection, openai, heuristics]
source: bug-fix
confidence: 0.5
related: []
---

# OpenAI model string changes can change scoring test outcomes

## Context

We updated test fixtures from older OpenAI IDs like `openai/gpt-5.3-codex` and
`openai/gpt-5.1-codex-mini` to newer defaults like `openai/gpt-5.4` and
`openai/gpt-5.4-mini`.

## Mistake

Treating the change as a pure string refresh caused model-selection tests to
fail, because the scoring code gives weight to tokens like `codex` and `mini`.
Changing the fixture names changed actual ranking behavior.

## Lesson

When refreshing model IDs in tests, verify whether scoring or ranking logic uses
name tokens as heuristics. Update expectations from fresh runtime output instead
of assuming the same providers or roles will still win.

## When to Apply

Apply this when updating model fixtures, default provider IDs, or any tests that
exercise dynamic model ranking, scoring, or provider selection.
