# AGENTS.md

Project: melodisco

This file is loaded at the start of every agent session. Mechanics for specific phases (planning, building, strategy review, ideas) live in lazy-loaded skills under `.agents/skills/`. Invoke a skill when its description matches the work at hand.

## Skills available

- `papi-plan` — Invoke when starting a new PAPI cycle. Covers plan generation, board management, and cycle scoping rules.
- `papi-build` — Invoke when executing a build via build_execute. Covers branching, gestalt pre-build check, and post-build audit.
- `papi-strategy` — Invoke when running strategy_review or making Active Decision changes. Covers strategy review cadence and AD lifecycle.
- `papi-idea` — Invoke when submitting backlog ideas, registering docs, or filing research. Covers idea pipeline and doc registry conventions.
- `papi-advanced` — Invoke for cross-project patterns, dogfood-derived workflows, or advanced cycle management.

## Project Identity — Verify Before Editing

On the first `orient` of any session, surface the connected project name to the user (e.g. "Connected to: <project_name>") and confirm it matches what they expect before making any code changes. PAPI projects are scoped by ID; if the wrong PAPI_PROJECT_ID is configured, edits land in the wrong project's history — a hard-to-undo class of mistake.

If the user doesn't recognise the project, stop. To fix it from this chat — no file editing — use the project tools: `project_list` to see their projects, `project_create` to make an empty one for this folder, or `project_switch` to point at the right one. Or pass `project=<id>` on a single call to override for that call only.

## Session Start

When a conversation starts — fresh window, new session, or after context compression — orient before doing anything else:

1. **Run `orient`** — single call that returns cycle number, task counts, in-progress/in-review tasks, strategy review cadence, trends, and recommended next action.
2. **Fix orphaned tasks silently** — check for feat/task-XXX branches that don't match board status. Fix and report after.
3. **Summarise:** "You're on Cycle N. X tasks to build, Y builds pending review." or "Cycle N is complete — ready for the next plan."
4. **Run `build_list` when picking a task** — `orient` shows counts only. `build_list` shows the full task list with handoffs.

**CRITICAL: Check task statuses before acting.**
- **In Review** = already built. Suggest `review_list` → `review_submit`. **NEVER re-build an In Review task.**
- **In Progress** = build started but not completed. Check the branch and existing changes before writing new code.
- **Backlog** = not started. But first check if a `feat/task-XXX` branch already exists with commits — fix it, don't rebuild.
- If all cycle tasks are Done, suggest `release` or next `plan`.

## Branching & PR Convention

- **All in-cycle, in-module tasks share `feat/cycle-N-<module>`** regardless of complexity. One branch per module per cycle, merged together. Module-less tasks fall back to a per-task branch.
- **Dependent tasks (any size):** When a task's BUILD HANDOFF lists a `DEPENDS ON` task from the same cycle, `build_execute` automatically reuses the upstream task's branch so commits stack for a single PR. Do not create a separate branch manually.
- **Commit per task within grouped branches** — traceable git history.
- **Never use `build_execute` with `light=true` on shared branches.** Light mode commits directly to the current branch without creating a PR. When a shared branch is squash-merged, those commits are collapsed — any CLAUDE.md or documentation changes are stripped. Use light mode only on isolated single-task branches where no squash-merge will occur.

## Plumbing Is Autonomous

Board status updates, branch cleanup, orphaned task fixes, commit/PR/merge for housekeeping — these are mechanical plumbing. **Do them end-to-end without stopping to ask.** Report after the fact.

## Code Before Claims — No Assumptions

**Before making any claim about how the codebase works, read the relevant file first.**

This includes:
- How a feature is implemented ("it works like X") → read the source
- Whether something exists ("there's no baseline migration") → check the directory
- Whether a flow is broken or working → trace it in code
- What a user would experience → check the actual page/component

Do NOT rely on memory, prior conversation, or inference. Read first, then answer.
If the answer requires checking 2-3 files, check them all before responding.

## User-Facing Replies — Default Brief

When drafting any external user-facing copy (Discord post, support reply, email, release note, marketing blurb): default to ≤4 sentences, friendly tone, no hidden questions buried in prose. Offer to expand if the user wants more depth. Verbose drafts that need trimming are a recurring friction.

This applies to *output for users*, not internal commit messages, build reports, or technical explanations — those follow normal conventions.

## Quick Work vs PAPI Work

PAPI is for planned work. Quick fixes — just do them. No need for plan or build_execute.

**After completing quick/ad-hoc work** (bug fixes, config changes, small improvements done outside the cycle), call `ad_hoc` to record it. This creates a Done task + build report so the work appears in cycle history and metrics. Don't skip this — unrecorded work is invisible work.

## Data Integrity

- **Use MCP tools for all project data operations.** DB is the source of truth when using the pg adapter.
- Do NOT read `.papi/` files for context — use MCP tools.
- `.papi/` files may be stale when using pg adapter. This is expected.
- **`board_edit` handles cycle membership automatically.** Pass `cycle: <n>` to assign, `cycle: null` to clear (also flips status to Backlog), or `status: "In Cycle"` to auto-assign the active cycle. No manual SQL needed.

## Sub-Agents

Project sub-agents live as markdown files in `.claude/agents/*.md`, each with `name` + `description` frontmatter. Run `agent_list` to see what's available (or read the **Sub-agents** line in `orient`). PAPI discovers them and surfaces them — dispatch one via your harness's Task/Agent tool. Discovery only; PAPI does not manage or invoke agents.
