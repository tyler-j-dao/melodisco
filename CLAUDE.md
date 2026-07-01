# melodisco

This project is managed with **PAPI**. The agent harness — session workflow, the plan → build → review cycle, branching, and conventions — lives in **`AGENTS.md`** (always loaded) plus lazy-loaded phase skills under `.agents/skills/papi-cycle/`.

**At session start: read `AGENTS.md`, then run `orient`.** Phase mechanics (planning, building, strategy, ideas) load on demand from the skills bundle. Add project-specific notes below this line — they will not be overwritten.

<!-- PAPI_ENRICHMENT_TIER_1 -->
<!-- PAPI_ENRICHMENT_TIER_2 -->

<!-- PAPI_CONVENTIONS -->
## Code Style Conventions

- This is a Next.js 14 App Router project (TypeScript) — new routes go under `app/[locale]/(default)/` for user-facing pages or `app/api/<name>/route.ts` for API handlers, not the old `pages/` structure.
- Follow the existing three-layer split: `app/api/*/route.ts` (HTTP boundary) → `services/*.ts` (business logic) → `models/*.ts` (data access via `getDb()` from `models/db.ts`). Don't call `pg` directly from routes or services — go through `models/`.
- All SQL queries must be parameterized (`$1, $2, ...` placeholders with a values array), matching the existing pattern in `models/song.ts`, `models/order.ts`, etc. Never interpolate request input into a query string.
- Use the existing `respData` / `respErr` / `respOk` helpers from `utils/resp.ts` for all API route responses — don't hand-roll `NextResponse.json` shapes.
- Reuse `types/*.ts` interfaces (e.g. `Song`, `Order`, `User`) for data shapes instead of inlining ad-hoc object types.
- Prefer the existing Radix + shadcn/ui + Tailwind + `daisyui` component patterns already in `app/[locale]/(default)/_components/` over introducing a new UI library.

## Data Layer Conventions

- `data/install.sql` is the source of truth for schema — when adding a column/table, update it and keep it valid, runnable SQL (verify statements are separated by semicolons and have no trailing commas before a closing paren).
- Join/log tables (`favorite_songs`, `play_songs`, `upvote_songs`, `song_tasks`) currently rely on `user_uuid`/`song_uuid` string columns with no foreign keys — any new relational data should follow this same uuid-string-reference pattern for consistency, or add proper constraints if changing it, but do it explicitly rather than mixing styles.
- Timestamps use `timestamptz` and are generated in application code (`new Date().toISOString()`), not DB defaults — keep new tables consistent with this.

## Payments Conventions (Stripe)

- Order state changes (pending → paid) should ultimately be driven by a verified source (Stripe webhook with signature verification), not solely by the client hitting a success-redirect URL — treat client-supplied amounts/credits as untrusted and validate against server-known plan pricing before creating an order.
- Keep credits-granting logic in `services/order.ts` / `models/order.ts`, not duplicated in route handlers.

## i18n Conventions

- All new user-facing strings go through `next-intl` message files under `messages/*.json` for every supported locale — don't hardcode English strings in components under `app/[locale]/`.
- Respect the existing `configs/locale.ts` locale list and `localePrefix` behavior when adding new routes.

## Testing Conventions

- No automated test suite exists yet (no `*.test.*`/`*.spec.*` files, no test runner configured). When adding tests, add a test script to `package.json` and colocate tests near the code they cover (e.g. `services/__tests__/` or `*.test.ts` alongside the module).
- Until a test suite exists, verify API routes manually via the existing `debug/*.http` files as a starting point, and prefer testing the full write→read roundtrip (e.g. insert a song, then confirm the discovery query returns it) over unit-testing isolated functions.

## Error Handling

- Wrap route handler bodies in try/catch and return `respErr(message)` on failure, matching the existing pattern across `app/api/*/route.ts` — don't let unhandled exceptions bubble into a raw 500.
- Log unexpected errors with enough context to debug (e.g. `console.log("checkout failed:", e)`) before returning the error response, matching existing call sites.

## Dogfood Logging

After each `release`, append a dogfood entry capturing observations from the cycle.
Call the adapter method with structured entries for each observation:

- **friction** — workflow pain points, confusing flows, things that broke or slowed you down
- **methodology** — what worked or didn't in the plan/build/review cycle
- **signal** — indicators of product-market fit, user value, or growth potential
- **commercial** — cost, pricing, or business model observations

This is autonomous plumbing — log observations after release without asking.
