# Clarify (reach zero open questions)

Use when the input is a vague idea, PRD, TRD, or roadmap item. Output: `docs/agent/<feature>/spec.md` with an empty Open Questions table, signed off at G1.

## Steps
1. Restate the goal in 3 lines: who it's for, what changes for them, how we know it worked.
2. Extract every unknown into a table: `ID | Question | Type | Impact | Status | Answer/Source`.
   - **R** = research can answer (code, docs, data). **D** = needs a human decision. **X** = depends on another team/system.
   - Impact = high / medium / low (would it change the design?).
3. Resolve all **R** items yourself first (or via the researcher role), with evidence. Never ask the engineer something you could look up.
4. Ask **D** items in batches of ≤7, highest impact first. Each as multiple choice with a recommended default and the tradeoff of each option.
5. For **X** items: name the owner, what's needed, and whether work can proceed behind a flag.
6. Record every answer as a decision (who, date). An assumption is allowed only if the engineer explicitly ratifies it; mark it "Ratified assumption".
7. G1 passes only when no row has Status = open.

## Checklist (ask only what applies)
- **Users & value:** who, which tenants/roles, success metric, non-goals.
- **Scope:** in/out, MVP vs later, feature flag, rollout and rollback.
- **Data:** source of truth (Postgres / Mongo / Redshift), schema changes, migration/backfill, retention, PII, Cube model changes.
- **Scale:** users/RPS/data volume now and at 10×/100×; latency and freshness budgets; batch vs streaming.
- **API/UX:** contracts, versioning, errors, empty/loading states, accessibility target, i18n.
- **Security:** authn/authz, tenant isolation, audit logging, compliance constraints.
- **Ops:** SLOs, alerts, Grafana dashboards, runbook owner, cost limits (e.g. Bedrock tokens, Redshift).
- **AI/RAG:** corpus, chunking, embedding model, retrieval eval set, guardrails, model and region.
- **Delivery:** deadline, dependencies, approvers, where docs live.
