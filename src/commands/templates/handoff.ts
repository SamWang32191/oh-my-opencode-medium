export const HANDOFF_TEMPLATE = `# Handoff Command

## Purpose

Use /handoff when:
- The current session context is getting too long and quality is degrading
- You want to start fresh while preserving essential context from this session
- The context window is approaching capacity

This creates a detailed context summary that can be used to continue work in a new session.

---

# PHASE 0: VALIDATE REQUEST

Before proceeding, confirm:
- [ ] There is meaningful work or context in this session to preserve
- [ ] The user wants to create a handoff summary (not just asking about it)

If there is nothing meaningful to hand off, explicitly refuse and tell the user there is nothing meaningful to hand off.

---

# PHASE 1: GATHER PROGRAMMATIC CONTEXT

Use the current conversation context to recover:
- User requests (as-is)
- Completed work
- Important decisions
- Pending work

Then run these commands via Bash when available:

1. Bash({ command: "git status --porcelain" })
2. Bash({ command: "git diff --stat" })
3. Bash({ command: "git log -5 --oneline" })

Phase 1 limitation:
- No session-history or todo-system data is available in phase 1.

Suggested execution order:

\`\`\`
Bash({ command: "git status --porcelain" })
Bash({ command: "git diff --stat" })
Bash({ command: "git log -5 --oneline" })
\`\`\`

Git and tool degradation rules:
- If all git commands fail, git fails at runtime, git is unavailable, or bash is unavailable or denied, continue with a conversation-only handoff.
- If some git commands fail but others succeed, continue with a partial-git handoff and clearly state partial git context was available.
- Missing git output is non-fatal and must never block handoff generation.

Use available git output to improve CURRENT STATE, KEY FILES, WORK COMPLETED, and CONTEXT FOR CONTINUATION.

---

# PHASE 2: EXTRACT CONTEXT

Write the context summary from first person perspective ("I did...", "I told you...").

Focus on:
- Capabilities and behavior, not file-by-file implementation details
- What matters for continuing the work
- Avoiding excessive implementation details (variable names, storage keys, constants) unless critical
- USER REQUESTS (AS-IS) must be verbatim (do not paraphrase)
- EXPLICIT CONSTRAINTS must be verbatim only (do not invent)

Questions to consider when extracting:
- What did I just do or implement?
- What instructions did I already give which are still relevant?
- What files did I tell you are important or that I am working on?
- Did I provide a plan or spec that should be included?
- What did I already tell you that is important (libraries, patterns, constraints, preferences)?
- What important technical details did I discover (APIs, methods, patterns)?
- What caveats, limitations, or open questions did I find?

---

# PHASE 3: FORMAT OUTPUT

Generate a handoff summary using this exact format:

\`\`\`
HANDOFF CONTEXT
===============

USER REQUESTS (AS-IS)
---------------------
- [Exact verbatim user requests - NOT paraphrased]

GOAL
----
[One sentence describing what should be done next]

WORK COMPLETED
--------------
- [First person bullet points of what was done]
- [Include specific file paths when relevant]
- [Note key implementation decisions]

CURRENT STATE
-------------
- [Current state of the codebase or task]
- [Build/test status if applicable]
- [Any environment or configuration state]

PENDING TASKS
-------------
- [Tasks that were planned but not completed]
- [Next logical steps to take]
- [Any blockers or issues encountered]

KEY FILES
---------
- [path/to/file1] - [brief role description]
- [path/to/file2] - [brief role description]
(Maximum 10 files, prioritized by importance)

IMPORTANT DECISIONS
-------------------
- [Technical decisions that were made and why]
- [Trade-offs that were considered]
- [Patterns or conventions established]

EXPLICIT CONSTRAINTS
--------------------
- [Verbatim constraints only - from user or existing AGENTS.md]
- If none, write: None

CONTEXT FOR CONTINUATION
------------------------
- [What the next session needs to know to continue]
- [Warnings or gotchas to be aware of]
- [References to documentation if relevant]
\`\`\`

Rules for the summary:
- Plain text with bullets
- No markdown headers with # (use the format above with dashes)
- No bold, italic, or code fences within content
- Use workspace-relative paths for files
- Keep it focused - only include what matters for continuation
- Pick an appropriate length based on complexity
- USER REQUESTS (AS-IS) and EXPLICIT CONSTRAINTS must be verbatim only

---

# PHASE 4: PROVIDE INSTRUCTIONS

After generating the summary, instruct the user:

\`\`\`
---

TO CONTINUE IN A NEW SESSION:

1. Press 'n' in OpenCode TUI to open a new session, or run 'opencode' in a new terminal
2. Paste the HANDOFF CONTEXT above as your first message
3. Add your request: "Continue from the handoff context above. [Your next task]"

The new session can continue with the handoff context and available repository context, but it will not include hidden session-history or todo-system state from phase 1.
\`\`\`

---

# IMPORTANT CONSTRAINTS

- DO NOT attempt to programmatically create new sessions (no API available to agents)
- DO provide a self-contained summary that works without access to this session
- DO include workspace-relative file paths
- DO NOT include sensitive information (API keys, credentials, secrets)
- DO NOT exceed 10 files in the KEY FILES section
- DO keep the GOAL section to a single sentence or short paragraph

---

# EXECUTE NOW

Begin with conversation-context extraction, gather git context when available, then synthesize the handoff summary.
`;
