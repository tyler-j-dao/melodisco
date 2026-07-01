---
name: papi-plan
description: Invoke when starting a new PAPI cycle. Covers plan generation, board management, and cycle scoping rules.
---

# papi-plan

## Workflow Sequences

PAPI tools follow structured flows. The agent manages the cycle workflow automatically — the user should never need to type tool names or remember the flow. Handle the plumbing, surface the summaries.

### Cycle Workflow (auto-managed)

- **Run tools automatically** — don't ask the user to invoke MCP tools manually
- Before implementing: silently run `build_execute <task_id>` (start phase)
- After implementing: run `build_execute <task_id>` (complete phase) with report fields
- After build_execute completes: audit the branch changes for bugs, convention violations, and doc drift (see Post-Build Audit below)
- After audit with findings: *MUST* automatically run `review_submit` with verdict `request-changes` and a concise summary of the audit findings as the changes requested — the builder fixes these before the task goes to human review
- After audit clean: present for human review — "Ready for your review — approve or request changes?"
- User approves/requests changes → run `review_submit` behind the scenes

### The Cycle (main flow)

```
plan → build_list → build_execute → audit → review_list → review_submit → build_list
```

1. **plan** — Run at the start of each cycle to generate the cycle plan and populate the board.
   Next: `build_list` to see prioritised tasks.
2. **build_list** — View tasks ready for execution, ordered by priority.
   Next: `build_execute <task_id>` to start a task.
3. **build_execute** (start) — Creates a feature branch and marks the task In Progress. Returns the build handoff.
   Next: Implement the task, then `build_execute <task_id>` again with report fields to complete.
4. **build_execute** (complete) — Submits the build report, commits, and marks the task In Review.
   Next: Run the post-build audit automatically.
5. **Post-build audit** — Review branch changes for bugs, convention violations, and doc drift (see Post-Build Audit section below).
   Next: If findings exist, run `review_submit` with `request-changes` and the audit findings. If clean, proceed to `review_list`.
6. **review_list** — Shows tasks pending human review (handoff-review or build-acceptance).
   Next: `review_submit` to approve, accept, or request changes.
7. **review_submit** — Records the review verdict and updates task status.
   Next: `build_list` to view next build

   **Quality Gate (standard for every build).** Before accepting a build, run a code review of the branch diff — either call `review_submit` with `dispatch:"subagent"` to auto-review, or attach `auto_review` findings yourself. `review_submit` surfaces the findings on every verdict. Accepting past a `fail`/`warn` gate is a deliberate **override** and is recorded on the review for the audit trail. Always run the gate on risk-tier work (auth, data, migrations, CI).

   **DO NOT** use `review_submit` as a substitute for `review_list`. If you need to see what is pending review, always call `review_list` first. If `review_list` is unavailable in your tool set (e.g. your MCP client filters parameterless tools), STOP and tell the human their MCP integration is incomplete — never guess at the next pending task. To submit an accept verdict on a build-acceptance review, either pass `reviewer_confirmed: true` or ensure `review_list` has run in the same session within the last 15 minutes. (SUP-2026-010.)

### Strategy Review

```
strategy_review → strategy_change
```

- **strategy_review** — Analyses project health, velocity, and estimation accuracy.
  Next: `strategy_change` if the review recommends adjustments.
- **strategy_change** — Updates active decisions, north star, or project direction based on review findings.

### Detect Strategic Decisions in Conversation

Watch for: direction changes, architecture shifts, deprioritisation with reasoning, new principles, competitive positioning decisions.

When detected:
1. Flag it: "That sounds like a strategic direction change — should I run `strategy_change`?"
2. If confirmed, run `strategy_change` immediately.
3. If mid-build, finish the current task first.

### Idea Capture

```
idea → (picked up by next plan)
```

- **idea** — Captures a new task idea and writes it to the backlog.
  Next: The next `plan` run will prioritise and schedule it.

### Friction Moment — Report PAPI Bugs & Ideas Upstream

When a PAPI tool returns a **workflow-blocking error** (it crashed, won't advance the cycle, or repeats after a retry), don't just stop — offer the user a zero-friction escape hatch to send it upstream to the PAPI team, then keep them moving:

1. Offer to submit it: run `bug` with `report=true`. Set `type='bug'` for a defect or `type='idea'` for a feature request / suggestion (the same tool handles both).
2. Ask two quick questions and pass the answers through:
   - **Notify when fixed?** → `notify_when_fixed=true` (the resolution surfaces back in a later `orient` and on their dashboard).
   - **OK for the PAPI team to reach out?** → `contact_ok=true`.
3. Confirm the submission ID back to the user, then suggest the workaround / next step so they're unblocked.

The same path works any time a user *wants* to send feedback — not only on errors. Diagnostics (Node version, platform, adapter) are attached automatically; the submission is project-scoped and only visible to the user and PAPI maintainers.

### Project Bootstrap

```
setup → plan
```

- **setup** — {{setup_description}}
  Next: `plan` to run the first cycle planning session.

### Board Management

- **board_view** — Read-only view of all tasks on the board.
- **board_archive** — Removes completed/cancelled tasks from the board to an archive.
- **board_deprioritise** — Moves a task to a later phase.

### Quick Reference: Tool → Next Step

| Tool | Next Step |
|------|-----------|
| `setup` | `plan` |
| `plan` | `build_list` |
| `build_list` | `build_execute <task_id>` |
| `build_execute` (start) | Implement, then `build_execute` (complete) |
| `build_execute` (complete) | Post-build audit (automatic) |
| Audit (findings) | `review_submit` with `request-changes` |
| Audit (clean) | `review_list` |
| `review_list` | `review_submit` |
| `review_submit` (approve/accept) | `build_list` |
| `review_submit` (request-changes) | `build_execute` (redo) or `build_list` |
| `strategy_review` | `strategy_change` (if needed) |
| `idea` | Next `plan` picks it up |

## Process Rules

These rules come from 80+ cycles of dogfooding. They prevent the most common sources of wasted time and rework.

### Building
- **Verify before claiming done.** Hit the endpoint, check the rendered output, confirm the data round-trips. Never say "should work" — prove it works.
- **Preview frontend changes.** After any UI/styling build, provide the localhost URL so the user can visually review. Don't make them ask for it.
- **Debug one change at a time.** When fixing issues, make one change, verify it, then move on. Don't stack multiple untested fixes.
- **Test the write-read roundtrip.** Every data write path must have a verified read path. If you write to DB, confirm the read query returns what was written. This is the #1 source of silent failures.
- **Test after every build.** Run the project's test suite after implementing. Suggest follow-up tasks from learnings when meaningful.
- **Build patiently.** Validate each phase against the last. Don't rush through implementation — test through the UI, not just the API.

### Security
- **Audit before widening access.** Before any build that adds endpoints, modifies auth/RLS, introduces new user types, or changes access controls — review the security implications first. Fix findings before shipping.
- **Flag access-widening changes.** If a build touches auth, RLS policies, API keys, or user-facing access, note "Security surface reviewed" in the build report's `discovered_issues` or `architecture_notes`.
- **Never ship secrets.** Do not commit .env files, API keys, or credentials. Check `.gitignore` covers sensitive files before pushing.
- **Telemetry opt-out.** PAPI collects anonymous usage data (tool name, duration, project ID). To disable, add `"PAPI_TELEMETRY": "off"` to the `env` block in your `.mcp.json`.

### Planning & Scope
- **NEVER run `plan` more than once per cycle.** Adjust the cycle with `board_deprioritise` or `idea` instead.
- **NEVER skip cycles.** Complete and release the current cycle before running the next `plan`.
- **Large plan/handoff outputs:** If the prepare-phase output is too large to pass inline (>50 KB), write it to a file and pass the absolute path via `llm_response_file` instead of `llm_response`. The `plan`, `strategy_review`, and `handoff_generate` apply modes all accept `llm_response_file`. The two parameters are mutually exclusive.
- **Only build tasks assigned to the current cycle.** Use `build_list` — it filters to current-cycle tasks with handoffs.
- **Don't ask premature questions.** If the project is in early cycles, don't ask about deployment accounts, hosting providers, OAuth setup, or commercial features. Focus on building core functionality first.
- **Split large ideas.** If an idea has 3+ concerns, submit it as 2-3 separate ideas so the planner creates properly scoped tasks — not kitchen-sink handoffs.
- **Auto-release completed cycles.** When all cycle tasks are Done and reviews accepted, run `release` immediately. Forgetting causes cycle number drift and merge conflicts in the next session.
- **Verify cycle readiness before releasing.** Before calling `release`, run `board_view` to confirm every task in the current cycle has status Done or Cancelled. The review queue is NOT sufficient evidence — `review_list` only shows built-and-pending-review tasks; it does not show Backlog or In Progress tasks. If any task is Backlog or In Progress: (a) build it, (b) move it to the next cycle via `board_edit({ task_id, cycle: N+1 })`, or (c) cancel it via `board_edit`. Do not call `release` until the cycle has no pending work. The `release` tool enforces this server-side and will block with a task list if the check fails.

### Communication
- **Show task names, not just IDs.** When summarising board state or reconciliation, include task names — e.g. "task-42: Add supplier form" not just "task-42".
- **Surface the next command.** After each step, tell the user what comes next. Commands should be surfaced, not memorised.

### Stage Readiness
- **Access-widening stages require auth/security phases.** Before declaring a stage complete, check if it widens who can access the product (e.g. Alpha Distribution, Alpha Cohort). If so, auth hardening and security review must be completed first — not discovered after the fact.
- **Pattern:** Audit access surface → fix vulnerabilities → then widen access. Never ship access-widening without a security phase.


<!-- PAPI_ENRICHMENT_TIER_1 -->

## Batch Building (unlocked at cycle 6)

For cycles with multiple tasks, batch build them without stopping between each:
- Build XS/S tasks first, then M/L — same-module tasks land on the cycle branch automatically regardless of size
- One commit per task for traceable history on the shared cycle branch
- After all tasks built, batch review them together

### Gestalt Pre-Build Check (multi-task cycles)

**Before `build_execute` on the first task of any multi-task cycle, read the cycle as a whole:**

1. Run `build_list` to see every task assigned to the current cycle.
2. Read the BUILD HANDOFFs together — not one at a time. Look for:
   - **Shared files** across handoffs — the same path in two FILES LIKELY TOUCHED lists usually means a refactor opportunity, a shared helper to extract first, or a sequencing constraint.
   - **Shared modules** — multiple tasks in the same module should land on a shared cycle branch (`feat/cycle-N-<module>`) so they merge together.
   - **Design decisions implicit across tasks** — e.g. one task introduces a new field, a later task consumes it. Build the producer first.
   - **Module split** — tasks in different modules will land on different cycle branches (`feat/cycle-N-<module>`) and merge separately. Flag any cross-module coordination required before kicking off.
3. Only then run `build_execute` on the first task.

This is a one-time check at the start of the cycle, not per-task. It catches scope conflicts, redundant work, and ordering hazards that an isolated handoff read can't see. Skip it for single-task cycles.
