# Context protocol (every agent follows this: parent and every sub-agent)

Your context is a budget. Quality drops as it fills, so manage it actively and hand off before you degrade — never push through.

## 1. Know your budget
- Your brief states a **context budget**: max tool calls and an approximate token limit (defaults: 40 tool calls, 85% of your context window).
- Measured signals win when you have them (a hook or system message reporting your usage). Otherwise use the ledger below.

## 2. Spend it wisely
- Search before reading: `grep`/`glob` to find the lines, then read only the relevant ranges, not whole files.
- Summarise large tool outputs into your notes immediately; don't keep re-reading them.
- Never paste full logs, docs or transcripts into your output; cite paths and lines.

## 3. Keep a progress ledger (so nothing is lost)
Write `docs/agent/<task>/agents/<task-id>-<hop>.md` as you go (template: "Agent ledger" in `templates.md`):
update it every ~10 tool calls and after every finding — done items with evidence, remaining items, notes, rough budget used.
The ledger is your memory. If you're relayed, your successor starts from it.

## 4. Thresholds
- **~70% of budget** (or a "budget warning" message): stop exploring; finish the current item; update the ledger.
- **~85% of budget**, or any drift sign (fuzzy recall of earlier details, re-reading a file you already read, contradicting your own notes, re-running the same search): **stop and relay**.

## 5. Relay (hand over to a fresh agent)
1. Stop new work. Leave files in a clean state; never commit.
2. Finish the ledger from your notes and files (not from memory alone).
3. Return status **PARTIAL** with a **Relay handoff** (template in `templates.md`): what's done with evidence, what remains (numbered, specific), dead ends, best next move, and what you'd do better.
4. The parent validates your partial work and starts a successor with the relay handoff plus its feedback.

## 6. If you are a successor (start immediately)
- Read the original brief, then the relay handoff's **▶ Resume point**, the ledger and the parent's feedback. Don't redo validated work.
- Your first line: "Hop <n>: resuming at <next item>."
- Quick spot-check of 2 items marked done (open the cited evidence; if wrong, say so), then start the next item right away — no re-planning, no re-exploring.
- Apply the parent's feedback and the predecessor's "do better" notes first.
- Continue the ledger as hop n+1.

## 7. The parent (orchestrator) too
The parent follows the same rules for its own context (`playbooks/handoff.md`): keep results as files, not transcripts; at ~85% or on drift, write the session handoff and ask the engineer to resume in a fresh session. A new top-level session always needs the engineer to start it.
