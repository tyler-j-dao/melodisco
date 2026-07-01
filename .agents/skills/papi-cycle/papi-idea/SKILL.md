---
name: papi-idea
description: Invoke when submitting backlog ideas, registering docs, or filing research. Covers idea pipeline and doc registry conventions.
---

# papi-idea

## Idea Pipeline (unlocked at cycle 21)

The `idea` tool is your backlog intake — not just for features, but bugs, research, and big ideas.

- When you discover something during a build, submit it via `idea` rather than stopping to fix it.
- Include a `Reference:` line pointing to relevant docs so the planner has context.
- Split large ideas into 2-3 focused submissions for better planner scoping.
- The backlog is the steering wheel — priority + notes shape what gets planned next.

## Doc Registry

Docs are first-class entities. When research or planning produces a stable document:
- Register it with `doc_register` after it's finalised.
- Doc summaries travel with tool context — the planner and strategy review can find relevant docs.
- Keep docs current — update the review header after any change.
- Docs are **private by default** (owner-only). Set `visibility` to `public` (anyone can read) or `team member` (shared with project contributors) only with explicit intent.
- Place the doc body in the matching folder so visibility and location agree: `docs/private/` (owner-only, gitignored — never committed), `docs/contributors/` (team), `docs/public/` (everyone). `doc_register` infers the tier from the folder when you don't pass `visibility`.

## Documentation Maintenance

Before creating a new doc, check `docs/INDEX.md` — it may already exist. When creating or archiving docs, update the index.

After implementing any code change, check if the change affects any documentation in `docs/`. If a doc describes behaviour, architecture, or file interactions that your change modified, update the doc to stay accurate.

When updating a doc, add or update a review header immediately below the title:

```
# Document Title
> Last reviewed: task-NNN — DD-MM-YYYY
```

Replace `task-NNN` with the task ID that triggered the update, and `DD-MM-YYYY` with today's date.
