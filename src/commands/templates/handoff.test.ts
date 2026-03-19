import { describe, expect, test } from 'bun:test';
import { HANDOFF_TEMPLATE } from './handoff';

const getPhaseContent = (phase: number, nextPhase: number): string => {
  const startMarker = `PHASE ${phase}:`;
  const endMarker = `PHASE ${nextPhase}:`;
  const start = HANDOFF_TEMPLATE.indexOf(startMarker);
  const end = HANDOFF_TEMPLATE.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    return '';
  }

  return HANDOFF_TEMPLATE.slice(start, end);
};

describe('HANDOFF_TEMPLATE', () => {
  test('includes required git commands', () => {
    expect(HANDOFF_TEMPLATE).toContain('git status --porcelain');
    expect(HANDOFF_TEMPLATE).toContain('git diff --stat');
    expect(HANDOFF_TEMPLATE).toContain('git log -5 --oneline');
  });

  test('includes exact phase headings from 0 through 4', () => {
    expect(HANDOFF_TEMPLATE).toContain('PHASE 0: VALIDATE REQUEST');
    expect(HANDOFF_TEMPLATE).toContain('PHASE 1: GATHER PROGRAMMATIC CONTEXT');
    expect(HANDOFF_TEMPLATE).toContain('PHASE 2: EXTRACT CONTEXT');
    expect(HANDOFF_TEMPLATE).toContain('PHASE 3: FORMAT OUTPUT');
    expect(HANDOFF_TEMPLATE).toContain('PHASE 4: PROVIDE INSTRUCTIONS');
  });

  test('includes full required handoff sections', () => {
    expect(HANDOFF_TEMPLATE).toContain('HANDOFF CONTEXT');
    expect(HANDOFF_TEMPLATE).toContain('USER REQUESTS (AS-IS)');
    expect(HANDOFF_TEMPLATE).toContain('GOAL');
    expect(HANDOFF_TEMPLATE).toContain('WORK COMPLETED');
    expect(HANDOFF_TEMPLATE).toContain('CURRENT STATE');
    expect(HANDOFF_TEMPLATE).toContain('PENDING TASKS');
    expect(HANDOFF_TEMPLATE).toContain('KEY FILES');
    expect(HANDOFF_TEMPLATE).toContain('IMPORTANT DECISIONS');
    expect(HANDOFF_TEMPLATE).toContain('EXPLICIT CONSTRAINTS');
    expect(HANDOFF_TEMPLATE).toContain('CONTEXT FOR CONTINUATION');
  });

  test('includes refusal behavior for no meaningful handoff context', () => {
    expect(HANDOFF_TEMPLATE).toMatch(/nothing meaningful to hand off/i);
  });

  test('phase 1 requires conversation-context extraction requirements', () => {
    const phase1 = getPhaseContent(1, 2);

    expect(phase1).toMatch(/current conversation context/i);
    expect(phase1).toMatch(/user requests/i);
    expect(phase1).toMatch(/completed work/i);
    expect(phase1).toMatch(/decisions/i);
    expect(phase1).toMatch(/pending work/i);
  });

  test('phase 1 explicitly excludes session and todo system sources', () => {
    const phase1 = getPhaseContent(1, 2);

    expect(phase1).toMatch(/no session-history/i);
    expect(phase1).toMatch(/todo-system data/i);
  });

  test('continuation instructions avoid overpromising guarantees', () => {
    expect(HANDOFF_TEMPLATE).not.toContain(
      'all context needed to continue seamlessly',
    );
    expect(HANDOFF_TEMPLATE).toMatch(
      /continue with the handoff context and available repository context/i,
    );
  });

  test('excludes forbidden placeholders and tools', () => {
    expect(HANDOFF_TEMPLATE).not.toContain('session_read');
    expect(HANDOFF_TEMPLATE).not.toContain('todoread');
    expect(HANDOFF_TEMPLATE).not.toContain('$SESSION_ID');
    expect(HANDOFF_TEMPLATE).not.toContain('$TIMESTAMP');
  });

  test('mentions fallback when git fails or is unavailable', () => {
    expect(HANDOFF_TEMPLATE).toMatch(/git (fails|failure|unavailable)/i);
    expect(HANDOFF_TEMPLATE).toMatch(/conversation-only/i);
  });

  test('mentions fallback when bash is unavailable or denied', () => {
    expect(HANDOFF_TEMPLATE).toMatch(/bash (is )?(unavailable|denied)/i);
  });

  test('mentions partial git context fallback', () => {
    expect(HANDOFF_TEMPLATE).toMatch(/partial git context/i);
  });
});
