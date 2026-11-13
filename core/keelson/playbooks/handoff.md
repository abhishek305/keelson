# Context budget and handoff (prevent long-session drift)

As a session's context fills up, models get worse at recalling earlier details and start to drift: re-asking settled questions, contradicting decisions, inventing details. Don't push through. Hand off to a fresh session with a document that carries everything needed.

## 1. Keep the handoff doc current (always, not just at the end)
File: `docs/agent/<task>/handoff.md` (template: "Handoff" in `templates.md`).
Update it at every gate (G1–G8), after every orchestration run, after any important decision, and at the 60% checkpoint. Then reaching 85% only means finalising it, not writing it from scratch with a degraded context.
Prefer **pointers to files** (spec.md, plan.md, ideas.md, run-log.md, research briefs, commits) over repeating their content. Put in the handoff only what exists nowhere else: in-progress state, things tried, session-only insights.

## 2. Know when to stop — any ONE of these triggers a handoff
**Measured (most reliable):**
- A system/hook message says context is **≥ 85%** (Claude Code: `.claude/hooks/context-guard.sh`).
- The engineer says the tool's context meter is ≥ 85% (Cursor / OpenCode / other tools show it in their UI).
**Self-detected (watch for these in every tool):**
- The conversation was auto-compacted or summarised, or you notice you can't recall exact earlier details.
- You're about to re-read a file you already read, re-ask an answered question, or re-run research already done.
- Your answer contradicts a recorded decision or a rule in memory.
- The engineer says you're drifting, forgetting, or repeating yourself.
**Checkpoints (heuristic):**
- At ~60%, or after ~40 tool calls / several large files or logs: update the handoff doc and tell the engineer the session is getting long.
- At ~75%: finish only the current small step, update the handoff, no new tasks.

## 3. At the trigger: stop and hand off
1. **Stop new work.** Don't start the next step, slice or sub-agent. Leave the code in a clean state (tests passing or clearly marked "in progress" in the handoff); never commit without approval.
2. **Write the final handoff from sources of truth**, not from memory: `git status`, `git log`, `git diff --stat`, the task's files under `docs/agent/<task>/`, memory files. Anything you know only from the conversation goes under "From session memory — verify".
3. **Log lessons** from this session in `memory/lessons.md` (proposed rules still need approval).
4. **Cold-read test:** run the validator role in a fresh context with only `AGENTS.md` and the handoff doc. It must answer correctly: goal? current gate? what's done? exact next step? open questions? how to verify the current state? If any answer is wrong or missing, fix the doc and retest (max 2).
5. **Register it:** update the task's row in `docs/agent/ACTIVE.md` (status `handed-off`, next action, whether the next step is already approved). The next session finds it there by itself.
6. **Tell the engineer**, in this form:
   > Context is at ~X%. To avoid mistakes, let's continue in a fresh session. Handoff: `docs/agent/<task>/handoff.md` (passed the cold-read test). In a new session, paste:
   > `Resume from docs/agent/<task>/handoff.md. Follow AGENTS.md → Resume.`
7. Don't continue the task in this session unless the engineer explicitly asks you to; answer only short questions about the handoff.

## 4. Resume (automatic, in the new session)
The new session picks up by itself; the engineer doesn't need to explain anything.
1. **Find it:** at session start, read `docs/agent/ACTIVE.md`. (Claude Code's SessionStart hook also injects the resume point.) Pick the row for the current git branch with status `handed-off` or `active`. If there are several and the branch doesn't decide it, ask which one (one question). If the engineer named a handoff, use that.
2. **Load:** read the handoff's ▶ RESUME POINT, then the rest of the handoff, then only the files it points to that the next action needs.
3. **Verify the expected state:** branch, HEAD, uncommitted files, and the "Start with" command. Match → continue. Mismatch (someone committed, files changed, tests differ) → say exactly what differs and ask before continuing.
4. **Announce in ≤3 lines and continue in the same reply:**
   > Resuming <task> from session <n>. Done: <last completed>. Now: <next action>.
   If **Next step approved? = yes**, start the next action immediately. If **no**, present what's needed for that gate and wait.
5. **Update the registry:** status `resumed (session n+1)`; add a Session log row in the handoff. Keep the RESUME POINT updated as you go (at every gate and step), so the next handoff is always ready.
6. **When the task is done** (merged and retro done): status `done` in ACTIVE.md.
Non-negotiables still apply: resuming never skips an approval the handoff doesn't record.

## 5. Sub-agents
Every sub-agent manages its own context with `roles/_context-protocol.md` (budget, ledger, relay). The parent validates each relay and briefs a fresh successor with feedback — see `playbooks/orchestrate.md` section 6.
