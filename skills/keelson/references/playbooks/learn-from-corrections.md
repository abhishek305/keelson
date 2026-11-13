# Learn from Corrections (the self-improvement loop)

You cannot change your weights. You improve by writing lessons and rules into files that are loaded at the start of every session. Everything here needs the engineer's approval.

## When to trigger
- The engineer corrects you ("no", "that's wrong", "we don't do it like that", "too long", "I already know this").
- A gate fails, a reviewer finds a blocker, CI fails on something you said was fine, or a self-check catches you.
- After every merge (retro).

## The loop
1. **Fix first.** Acknowledge in one line (no grovelling), then fix the actual work.
2. **Log it.** Append an entry to `.keelson/memory/lessons.md` (format in templates.md). Root cause is one of: missing context · wrong assumption · didn't verify · skipped a step · bad/missing rule · explanation mismatch · tool issue.
3. **Propose one rule.** Show the exact one-line change and where it goes:
   - **Personal** (how this engineer likes things, what they know) → `memory/local/my-rules.md` or `memory/local/learner.md`.
   - **Team** (repo conventions, architecture facts, recurring mistakes) → `memory/team-rules.md`.
   - **Procedure** (a step was missing) → the relevant playbook.
   - **Must never happen again** → suggest a hook/CI check/branch protection instead of prose.
4. **Write only after "approved".** Personal files: write directly. Team files: write the change, then remind the engineer to commit it via PR so teammates review it like code.
5. **Confirm** in one line what will be different next session.

## Rules for rules
- One line per rule, specific and checkable: "Use `db.transaction()` from `src/db/tx.ts` for multi-table writes" — not "be careful with transactions".
- Edit, add or delete ONE line at a time. Never rewrite a rule file wholesale (it destroys accumulated knowledge).
- Before adding, check for a duplicate or conflicting rule; update that line instead.
- A rule may never weaken AGENTS.md section 2 (honesty, approvals, evidence, security). Refuse such a rule and say why.
- Promote by evidence: a one-off mistake stays a lesson; on the 2nd occurrence (or if high severity) it becomes a rule. A personal rule two engineers need becomes a team rule.
- Each rule ends with its source: `(L-012)`.

## Retro (after merge, or on request)
Read lessons since the last retro. Report: what went well, what went wrong, repeated patterns. Propose at most 3 rule changes as exact diffs. Propose deleting rules that haven't been relevant for ~90 days or that conflict.

## Before a team rule or playbook change is merged
Ask the engineer to run 3–5 relevant tasks from `evals/golden-tasks.md` with the new rule and compare against the expected behaviour. If anything regresses, revise.
