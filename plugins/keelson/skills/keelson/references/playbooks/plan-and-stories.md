# Plan and Stories (G2–G3)

## Plan (G2) — `docs/agent/<feature>/plan.md`
1. **Context:** link spec.md; restate the 3-line goal.
2. **Options:** at least 2 real options. For each: how it works (3–5 lines), pros, cons, risk, rough effort, how it behaves at 100× scale.
3. **Decision:** chosen option + "Explain it simply" note. Write an ADR in `docs/adr/` if the decision is hard to reverse.
4. **Design:** components, data model and migrations, API contracts, sequence diagram (Mermaid) for the main flow.
5. **NFRs:** performance budgets, security, observability (logs, metrics, traces, dashboards, alerts), accessibility, cost.
6. **Rollout:** feature flag, migration order, backfill, rollback plan.
7. **Test strategy:** unit / integration / E2E mapping; what needs Playwright.
8. **Docs plan:** audience → doc type → location → owner.
9. **Slices:** ordered list of small changes (≤3–4 files, ~300 lines each), each independently reviewable and safe to merge behind the flag. Write each one as an executable spec (below).
10. **Risks & open items:** must be empty of design-changing items.

11. **Execution waves:** which slices run in parallel and which wait (table in `spec-driven.md` §3). Slices in one wave never touch the same file.

Plan on the **planner** model at default reasoning effort. Use high effort for risky plans: migrations, row-level security / tenant isolation, auth, or changes across several packages; the strongest model you have for the hardest epics (`spec-driven.md` §2).

## Executable spec (one block per slice)
The `implementer` sub-agent runs on the **builder** model and follows the slice literally. Faster models do best when the task has a clear spec and a way to check the result, so every slice must leave it nothing to decide. If writing a field needs a design decision, the plan isn't done.

```
### Slice S<n>: <title>   (story <KEY>, ACs <IDs>, depends on S<m>)
Goal: <one sentence>
Files:
  - modify `<path>`: <what changes>
  - create `<path>`: <what it holds>
  - do NOT touch: <paths that look related but are out of scope>
Pattern to copy: `<file>:<line>` — <what to mirror: structure, naming, error handling>
Contracts (exact):
  - `<function / schema / endpoint signature>`  (types, error types, return shape)
  - Full code only for non-obvious logic (SQL, RLS, regex, algorithm); otherwise signatures + pattern.
Steps: numbered, one edit each, in order.
Tests: `<test file>` → `<test name>`: Given / When / Then  (one per AC + edge + error case)
Checks (run all, all must pass):
  - `<exact command>` → <what passing looks like>
Stop and report BLOCKED if: <conditions the plan couldn't rule out>
```

**Grounding rule (before G2 approval):** every path, `file:line`, symbol, signature, package version and command in a slice is verified against the repo and labelled Verified. A wrong fact here becomes a wrong change, because the implementer follows the slice exactly. Re-check slices before G4 if `main` moved since approval.

## Stories (G3)
Draft with the story template in `references/templates.md` (or the story-writer role). Rules:
- One epic per feature; stories sized to 1–3 slices.
- Every spec requirement maps to ≥1 acceptance criterion; show the coverage table.
- Acceptance criteria are Given/When/Then and testable: happy path, edge, error, permission/tenant, scale (if relevant).
- ≤ ~200 words per story; detail lives in the linked spec/plan, not the ticket.
- INVEST check before presenting.
Create issues in Jira (via MCP/CLI) only after the engineer approves the text. Show what will be created first.
