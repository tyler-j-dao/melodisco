---
name: papi-build
description: Invoke when executing a build via build_execute. Covers branching, gestalt pre-build check, and post-build audit.
---

# papi-build

## Post-Build Audit

After every `build_execute` (complete), audit the branch before presenting for human review. This catches bugs and convention violations early.

1. **Identify changed files:** Run `git diff origin/main --name-only` to find modified files. If no changes, report "No changes to audit" and skip.
2. **Review each changed file** for:
   - Logic errors, off-by-one mistakes, incorrect conditions
   - Unhandled edge cases (null, undefined, empty inputs)
   - Convention violations defined in this CLAUDE.md
   - Incorrect type narrowing or unsafe casts
3. **Documentation check:** If any `docs/` files describe behaviour that the change modified, flag as "Doc drift".
4. **Report:** For each issue: file path, severity (Bug/Convention/Doc drift), what's wrong, how to fix.
5. **If findings exist:** Run `review_submit` with `request-changes` and the findings. Fix before human review.
6. **If clean:** Present for human review — "Ready for your review — approve or request changes?"

## Housekeeping — Opt-In Deep Sweep

`orient` runs a fast cheap-checks-only path by default. The deep sweep — orphaned branches, In Review tasks with no PR, stale In Progress branches, unrecorded commits, unregistered docs — is opt-in via `deep_housekeeping: true`.

When to run with `deep_housekeeping: true`:
1. Before `release` — catch board/branch drift.
2. After a long break (>1 day since last session) — surface anything that fell off.
3. When you suspect drift — odd cycle counts, missing PRs.

**Don't run deep on every session start.** It pollutes early context with cross-reference output that's noise 80% of the time. The default fast path tells you what cycle you're on, what's in flight, and what to do next; that's the daily-driver shape.

If the deep sweep surfaces something fixable (orphaned branches, missing PRs), fix it silently and report after — same autonomous-plumbing rule as before.

## Context Compression Recovery

When the system compresses prior messages, immediately:
1. **Run `orient`** — single call for cycle state
2. Check your todo list for in-progress work
3. Run housekeeping checks
4. **NEVER re-build a task that is already In Review or Done.**
5. Continue where you left off — don't restart or re-plan

## Tool Use Discipline

Most tool errors are habit issues, not capability issues. Avoid them up front:

- **Ranged reads for large files.** Before `Read`-ing a file you haven't already touched this session, check its size. For files over ~1000 lines, or known-large surfaces (generated SQL, lockfiles, HTML reports, large templates), use `offset` + `limit` from the start instead of hitting the token ceiling.
- **Search-before-read for unverified paths.** If a path comes from memory or inference rather than a file you've read this session, run `Glob` or list the parent directory first. Don't `Read` paths you haven't confirmed exist.
- **Prefer Read/Glob/Grep over Bash for file operations.** Bash `cat`/`grep`/`find`/`ls` is the most common source of failed commands and produces unstructured output. Reserve Bash for genuinely shell-only operations (git, gh, package managers, SQL, real pipelines).
- **Verify-before-recommend.** Before suggesting a new task, hook, or skill, check whether it already exists: `board_view` for tasks, `doc_search` for docs, `ls .claude/hooks/` for hooks. Recommending duplicates of already-shipped work wastes a build slot.
