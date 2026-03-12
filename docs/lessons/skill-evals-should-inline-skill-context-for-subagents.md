---
id: skill-evals-should-inline-skill-context-for-subagents
date: 2026-03-12
scope: project
tags:
  - skills
  - evals
  - subagents
  - prompts
source: retrospective
confidence: 0.3
related: []
---

# Skill evals should inline skill context for subagents

## Context
When iterating on a local skill, I used subagents to evaluate the skill's responses against test prompts.

## Mistake
One eval prompt told the subagent to read the local `SKILL.md` path directly. That was less reliable than expected and produced an answer that ignored the intended workflow.

## Lesson
When running lightweight subagent evals for a local skill, include the critical skill rules inline in the prompt if the evaluation depends on exact behavior. File-path references alone are not always a reliable harness.

## When to Apply
Apply this when using subagents to benchmark or compare local skills, prompt files, or process documents where missing one instruction materially changes the output.
