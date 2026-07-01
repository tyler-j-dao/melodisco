---
name: papi-strategy
description: Invoke when running strategy_review or making Active Decision changes. Covers strategy review cadence and AD lifecycle.
---

# papi-strategy

## Strategy Reviews

Every 5 cycles, PAPI offers a strategy review — a deep analysis of velocity, estimation accuracy, active decisions, and project direction.

- **Don't skip them.** They're where compounding value comes from.
- If your session is already heavy with build context, run the review fresh for cleaner output — a genuinely fresh session needs no restart.
- Reviews produce recommendations that feed into the next plan.
- If the review recommends AD changes, use `strategy_change` to apply them.

## Active Decision Lifecycle

Active Decisions (ADs) track architectural and product choices with confidence levels (LOW → MEDIUM → HIGH).

- Check ADs before making architectural choices — run `health` for the AD summary.
- ADs are for product/architecture choices only, not process preferences.
- When new evidence appears, update AD confidence via `strategy_change`.
- Supersede rather than overwrite — old decisions stay as history.
- New ADs should include a `### Reversal Trigger` section: specify the signal that would invalidate the stance, the action to take (modify/supersede/abandon), and why writing it now prevents sunk-cost drift later.


<!-- PAPI_ENRICHMENT_TIER_2 -->
