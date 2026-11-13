# Templates

## Explain it simply (one per decision)
**Decision:** <one line>
**Why:** <the problem it solves, in plain words>
**Options considered:** <A vs B, one line each>
**Tradeoff we accepted:** <what we gave up>
**Say it to a teammate:** "<one sentence anyone on the team would understand>"

## Debug summary
**What was wrong:** <root cause in one or two lines>
**How we found it:** <the checks, in order, and what each showed>
**What ruled out the others:** <hypothesis → evidence>
**Fix:** <change + regression test>
**Spot it next time:** <the signal or habit that would catch this earlier>

## Epic
**EPIC:** <outcome in ≤10 words>
**Goal:** <1–2 sentences: user/business value + success metric>
**Scope:** <bullets> | **Out of scope:** <bullets>
**Stories:** <keys> | **Risks/Dependencies:** <bullets> | **Spec/Plan:** <links>

## Story
**Title:** <verb + outcome>
**Why:** As a <role>, I want <capability> so that <benefit>.
**Scope:** <≤5 bullets> | **Out of scope:** <≤3 bullets>
**Acceptance criteria:**
- AC1 Given <context> When <action> Then <observable result>
- AC2 (edge) …
- AC3 (error) …
- AC4 (permission/tenant) …
- AC5 (scale/perf, only if relevant, e.g. p95 < X ms at N rows)
**NFRs:** <only those that apply> | **Test notes:** <unit/integration/E2E> | **Dependencies:** <keys> | **Estimate:** <points>
INVEST check: Independent · Negotiable · Valuable · Estimable · Small (≤3 slices) · Testable.

## PR description
**Title:** <JIRA-KEY>: <outcome>
**What & why:** <2–3 lines> | **Jira:** <link> | **Slice:** n of m (previous PR: <link>)
**Changes:** <file → one-line purpose>
**AC coverage:** | AC | Test | Evidence |
**How verified:** <commands + results; E2E report link>
**Risk & rollback:** <flag / revert plan> | **Performance/scale notes** | **Security notes** | **Docs updated**
**Reviewer focus:** <the 1–3 places that deserve the closest look>

## Lessons entry (append-only, `memory/lessons.md`)
### L-<NNN> · <YYYY-MM-DD> · <short title>
- **What happened:** <fact>
- **Caught by:** engineer / gate / reviewer / CI / prod
- **Root cause:** <one category from the playbook>
- **Fix:** <what changed in the work>
- **Proposed rule:** <exact line + target file> · **Status:** proposed / approved / rejected
- **Seen before:** <L-IDs or "no">

## Delegation brief (for any subagent / fresh session)
**Role:** <roles/*.md> | **Objective:** <one line>
**Inputs:** <exact files/links — nothing else>
**Boundaries:** <what not to touch or do>
**Output contract:** <from the role file> | **Done when:** <checkable criteria>
**Context budget:** <max tool calls, e.g. 40> · relay at ~85% · **Relay hop:** <1 = first agent; n = successor> · **Ledger:** `docs/agent/<task>/agents/<task-id>-<hop>.md`
**For successors:** <relay handoff link + parent feedback to apply first>

## Project context (`memory/project/context.md`)
**Summary:** <5 lines> | **Sources:** | Title | Link | Owner | Last modified | Read on |
**Goals / Non-goals:** <bullets>
**Users & tenants:** <bullets>
**Glossary:** | Term | Plain meaning | Source |
**Architecture:** | Component | What it does | Repo path | Owner | Source | + Mermaid diagram
**Data:** stores, key tables/collections, pipelines, Cube models, dashboards (each sourced)
**Integrations & constraints:** <compliance, SLOs, cost, dependencies>
**Decisions:** <ADR links>
**Doc vs code conflicts:** | Doc says | Code shows (file:line) | Status |
**Open questions:** | ID | Question | Owner | Status |

## Idea entry (`memory/project/ideas.md`)
### I-<NNN> · <short title>
- **Source:** <link + quote> · **Raised by:** <name>
- **In plain words:** <what it means + user problem>
- **Impact / Effort / Risk:** <H/M/L each> (Inferred until reviewed)
- **Options & recommendation:** <link to review notes>
- **Decision:** <approved / deferred / rejected> · **By / date:** · **Why:**
- **Next:** <story key or "none">

## Research brief
**Question:** <precise, with versions> | **Answer:** <1–3 lines> | **Confidence:** high / med / low
**Evidence:** <bullets: link or file:line + key quote>
**Disagreements:** <if any> | **Still unknown:** <and how to settle it>

## Tool proposal
**Tool:** <name> · **For:** <job> · **Publisher:** <org/account> · **Source & license:** <link>
**Maintenance:** <last release/commit; open security issues> · **Install:** <exact pinned version/URL>
**Access:** <reads / writes / scopes; auth method> · **Runs:** local / remote (host)
**Tool descriptions reviewed:** yes — <any concerns> · **Risk:** low / med / high — <why>
**Simpler alternative:** <CLI/script, if any> · **Recommendation:** <use / don't>

## Rejection (parent → sub-agent)
**Verdict:** REJECT (attempt n of 2)
**Failed checks:** <M#/criterion → evidence>
**Fix exactly:** <numbered list> | **Keep:** <what was good> | **Don't:** <go beyond brief>

## Run log (`docs/agent/<task>/run-log.md`)
| Task | Role | Hop | Attempt | Verdict | Validated items | Reason | Time |

## Handoff (`docs/agent/<task>/handoff.md`)
# Handoff · <task> · <YYYY-MM-DD HH:MM> · session <n>
## ▶ RESUME POINT (read this first)
- **Last completed:** <exact step, e.g. "slice 2: tests for AC3 written and passing">
- **Next action:** <one concrete action, e.g. "implement AC4 in src/api/export.ts → handleExport()">
- **Start with:** <first command to run, e.g. `pnpm vitest run src/api/export.test.ts`>
- **Files in play:** <paths (+ functions/lines)>
- **Expected state:** branch `<name>` · HEAD `<short sha>` · uncommitted: <files or "none"> · tests: <passing / which failing>
- **Next step approved?** yes (covered by <gate/approval>) / no — needs <gate> first
- **Then:** <next 2–3 steps, briefly>
**Why handing off:** <context ~X% / drift sign / checkpoint>
**Goal (3 lines):** <who it's for, what changes, how we know it worked>
**Mode & gate:** <e.g. Build · G4, slice 2 of 5> · **Branch:** <name> · **Last commit:** <sha + message>
**Sources of truth:** <links to spec.md, plan.md, stories, ideas.md, context.md, run-log.md, research briefs, PRs>
**Decisions made (with who/when):** <bullets; link to where each is recorded>
**Done:** <bullets with evidence: commits, files, test results>
**In progress (exact state):** <file, function, what's half-done, what's uncommitted>
**Next steps (numbered, specific):** 1. <action + file + done-criteria> 2. … 3. …
**Open questions:** | ID | Question | Who decides | Blocking? |
**Tried and didn't work:** <approach → why it failed>
**Gotchas / session insights:** <things that would cost time to rediscover>
**Approved tools in use:** <names> · **Sub-agent runs:** <run-log link + any pending task>
**Lessons logged this session:** <L-IDs>
**From session memory — verify:** <anything not backed by a file or command output>
**Verify on resume:** <exact commands: git status, test command, etc. + expected result>
**Session log:** | Session | Date | Gates covered | Ended because |


## Agent ledger (`docs/agent/<task>/agents/<task-id>-<hop>.md`)
**Task:** <id + objective> · **Role:** <role> · **Hop:** <n> · **Budget used:** ~<tool calls>/<budget>
**Done (with evidence):** <bullets: item → file:line / URL / command output>
**Remaining:** <numbered>
**Notes & findings:** <short; summaries of big outputs, not the outputs>
**Dead ends:** <tried → why it failed>
**▶ Resume point:** last completed <item> · next <item> · start with <file/command>

## Relay handoff (sub-agent → parent → successor)
**Status:** PARTIAL · **Task:** <id> · **Hop:** <n> · **Why relaying:** <budget ~X% / drift sign>
**▶ Resume point:** last completed <item> · next action <item #, exact> · start with <file/command/query>
**Done (validated by me):** <items + evidence>  ·  **Ledger:** <path>
**Remaining (specific, ordered):** 1. … 2. …
**Dead ends:** <don't retry these>
**Best next move:** <one line>
**Do better next hop:** <what I'd change: narrower search, different source, smaller chunks>


## Active work registry row (`docs/agent/ACTIVE.md`)
| <task> | <branch> | active / handed-off / resumed (session n) / done | `docs/agent/<task>/handoff.md` | <next action, one line> | yes / no (<gate>) | <YYYY-MM-DD HH:MM> |
