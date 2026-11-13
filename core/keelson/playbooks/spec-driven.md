# Spec-Driven Development (SDD): the planner plans, builders build

Goal: spend expensive reasoning once, on the plan, and run the many build steps on a cheaper, faster model.
The **planner** model turns a feature, epic or non-trivial bug into an **executable spec**. A human approves it. Then `implementer` sub-agents on the **builder** model build it slice by slice, in parallel where slices don't touch the same files, and the planner checks every result.

Model roles (which real model fills each role per tool) live in `.keelson/models.yaml`:
- **planner**: your strongest reasoning model. Writes specs, orchestrates, validates.
- **builder**: a fast, cheaper model that follows a precise spec well. Runs `implementer` slices.
- **reviewer**: a strong model in a fresh context. Runs `validator` and `security-reviewer`.
Say which model you're running on when it matters, and name the configured model for each role when you offer SDD.

## 1. When to offer SDD (size check)
At the engineer's first substantive request in a session (and whenever a new big task arrives), size it:

| Signal | Use |
|---|---|
| Epic, feature, PRD/TRD, or a change you'd split into ≥2 slices | **SDD**: offer it |
| Bug whose fix spans ≥2 slices, ≥4 files, a migration, or several packages | **SDD** after Debug finds the root cause |
| One-slice change, small bug with an obvious fix, question, review | Do it directly. Hand-off overhead (each sub-agent re-reads its slice and files) costs more than it saves |

Offer it in one short question, once per task, with the reason and the model plan, e.g.:
> "This looks like a 3–4 slice feature. Plan it as a spec first (planner: <model>), you approve it, then builder sub-agents (<model>) build the slices? Or just start coding?"

If the engineer declines, carry on normally and don't ask again for that task.

## 2. Pick the planning depth
You can't switch the main session's model yourself; tell the engineer if a switch would help (`/model` in Claude Code, the model picker in Cursor/OpenCode/Codex).

| Work | Planner | Reasoning effort |
|---|---|---|
| Normal feature or bug fix | planner | default |
| Risky: migrations, row-level security / tenant isolation, auth, cross-package, perf-critical | planner | high |
| Whole epic with big unknowns, new architecture, or a plan that keeps failing grounding | the strongest model you have access to (`models.yaml` → `planner_max`) | high |

Use the most expensive model where plan quality pays for itself, not by default. Switch back to the planner for build orchestration.

## 3. Write the spec (`docs/agent/<task>/plan.md`)
Follow `clarify.md` (G1), then `plan-and-stories.md` (G2–G3). SDD adds three things:
1. **Breakdown:** epic → stories → slices. Every slice uses the "Executable spec" block in `plan-and-stories.md` and is grounded (every path, `file:line`, symbol, version and command Verified).
2. **Bug variant:** run `debug.md` first. The spec opens with the reproduction, the root cause with evidence (`file:line`, logs, query plan), and the failing test that proves it. The fix slices follow.
3. **Waves:** a dependency table that says what can run in parallel.

```
## Execution waves
| Wave | Slices | Files touched (must not overlap within a wave) | Depends on |
|---|---|---|---|
| 1 | S1, S2 | S1: packages/domain/..., S2: apps/web/... | — |
| 2 | S3 | apps/api/... | S1 |
```
Rules: slices in one wave never touch the same file (lockfiles, barrel `index.ts`, migration journals and shared test fixtures count). A slice that changes a contract (schema, protocol, migration) goes in an earlier wave than its consumers.

**G2 approval covers the whole spec, including waves.** Show it to the engineer and stop.

## 4. Build: fan out to builders
After approval, follow `build-and-ship.md` → "Hand-off to builders":
- Leave any read-only/plan mode, then for each wave start one `implementer` sub-agent per slice, **in parallel** where your tool supports it. Brief = story key + plan path + slice ID + AC IDs. Don't paste the plan into the brief; the sub-agent reads only its slice.
- When the wave finishes: validate each result (re-run the slice's checks, read the diff against the slice), then run the combined checks for the wave (typecheck, lint, tests of touched packages) because parallel slices can each pass and still clash.
- `BLOCKED` → fix the spec, show the engineer the change, re-run that slice. Don't patch the code yourself, or the spec stops matching what was built.
- Present each slice (or the wave, if the engineer prefers) at G4, then continue to G5–G8 as usual.

No sub-agents (plain chat, or a tool without them): run each slice in a fresh chat on the builder model with only the plan file and the slice ID; one chat per slice, waves in order.

## 5. Spend tokens well
- **Plan once, precisely.** Every slice names its files, the pattern to copy and the exact checks, so the builder doesn't explore the repo again.
- **Small briefs, small reports.** Plan path + slice ID in; status + diff summary + check output out.
- **Validate cheaply.** Re-run checks and read the diff; don't re-read whole files the slice didn't change.
- **Don't over-split.** A slice is ≤3–4 files and ~300 lines. Many tiny slices cost more in sub-agent startup than they save.
- **Measure.** After each SDD task, note in `docs/agent/<task>/run-log.md`: planner model and effort, slices, blocked count, retries. If builder slices keep coming back `BLOCKED`, the spec isn't detailed enough; fix the template, not the model choice.
