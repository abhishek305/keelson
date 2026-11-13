# Debug

Goal: find the root cause with evidence, fix it with a regression test, then teach the reasoning.

## 1. Get the facts (ask only for what's missing)
- Exact error/symptom (full message, stack trace, screenshot).
- Expected vs actual behaviour.
- How to reproduce; how often (always / sometimes / only in prod).
- What changed recently (deploy, dependency, config, data, traffic).
- Environment: local / staging / prod, versions, tenant, browser.

## 2. Reproduce
Make it fail on demand (test, script, curl, Playwright). If you cannot reproduce, say so and list what evidence would help (logs, Grafana panel, trace ID, query plan).

## 3. Hypotheses
List 2–5 causes ranked by likelihood. For each: what evidence would confirm or rule it out, and how cheap that check is.
Test the **cheapest check that best separates the top hypotheses** first. Record each result: confirmed / ruled out / inconclusive.

## 4. Narrow down
Useful moves: read the code path end to end; add targeted logging; `git bisect`; compare working vs broken input; `EXPLAIN ANALYZE`; check Grafana/metrics around the incident time; minimise the failing input.
Never "fix" by guessing. If three checks are inconclusive, stop and tell the engineer what you know and what you need.

## 5. Fix
- Fix the root cause, not the symptom. If a quick mitigation is needed first (flag, rollback), label it as such.
- Add a regression test that fails before the fix and passes after.
- Check for the same bug elsewhere (same pattern, sibling code).

## 6. Teach (always end with this)
Use the "Debug summary" in `.keelson/templates.md`: what was wrong, how we found it, what ruled out the other causes, the fix, and how to spot this class of bug next time.
