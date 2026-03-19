---
id: prompt-command-tests-should-lock-required-structure
date: 2026-03-19
scope: project
tags:
  - prompts
  - commands
  - tests
  - templates
  - review
source: retrospective
confidence: 0.3
related: []
---

# Prompt command tests should lock required structure

## Context
While implementing the built-in `/handoff` command, the first version of the template tests only checked for a few tokens, phase numbers, and fallback phrases.

## Mistake
Those shallow assertions let an under-specified prompt pass even though it dropped most of the approved phase headings, omitted required output sections, and failed to instruct the agent to extract the full conversation-derived context.

## Lesson
When a feature is delivered through a prompt or template, tests must assert the exact required structure and critical wording, not just a handful of keywords. If the spec depends on named phases, required sections, or explicit refusal/limitation language, the tests should lock those requirements directly so reviewers do not become the first line of detection.

## When to Apply
Apply this when adding or modifying prompt-backed commands, skills, templates, or workflow documents where correctness depends on preserved structure as much as on individual tokens.
