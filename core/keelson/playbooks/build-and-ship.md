# Build and Ship (G4–G8)

## Hand-off to builders (after G2–G3 approval)
The planner plans and checks; builders build. Once the engineer has approved the plan and stories:
1. Leave plan mode first. A sub-agent started from plan mode stays in plan mode and can't edit.
2. Wave by wave (from the plan's "Execution waves"), delegate each slice to its own `implementer` sub-agent (on the builder model; see `.keelson/models.yaml`); start all slices of a wave in parallel. Brief = story key + plan path + slice ID + AC IDs. It starts with no chat history, so everything it needs must be in the plan file.
3. Validate each output against `evals/output-validation.md` and the slice: diff matches the listed files and contracts, the slice's checks were run and passed (re-run them yourself), nothing extra changed. Then run the wave's combined checks before starting the next wave.
4. `BLOCKED` → fix the plan (not the code), show the engineer the plan change, re-delegate. Failed validation → reject with specific feedback (max 2 retries), then escalate.
5. Only then present the slice at G4 below. No sub-agents (plain chat, or a tool without them)? Run the slice in a fresh chat on the builder model with only the plan file.

## Per slice (G4)
1. Confirm inputs: story key, plan path + slice ID, files in scope, AC IDs.
2. Read the surrounding code and follow existing patterns. Check library versions before using APIs.
3. Write the failing test first where practical, then the code.
4. Stay in scope. Need more files than planned? Stop and say why.
5. Run typecheck, lint, and relevant tests. Paste commands and results.
6. Present: diff summary, files touched, AC covered, one "Explain it simply" note per decision, open risks.
7. Wait for approval before committing. Commit message: `<JIRA-KEY>: <what changed>`.

## Code principles
- Readable over clever. Small functions and modules, one responsibility each.
- Reuse before adding. No dead code, no speculative abstraction, no "just in case" options.
- Comments only for a non-obvious "why".
- Validate input at boundaries; typed, meaningful errors; no swallowed exceptions.
- Correct first with tests; then measure; then optimise with evidence (query plan, profile, benchmark).

## Independent review (G5)
Run the peer-reviewer role (and security-reviewer when the change touches auth, data access, user input, secrets, infra, LLM/RAG or MCP). The reviewer gets ONLY the story text and the diff — no plan, no chat history.
Present findings to the engineer with your proposed response for each: fix / disagree (with reason) / follow-up ticket. The engineer decides.

## Local CI (G6) — run what CI would run, scaled to the change
| Change touches | Run |
|---|---|
| Any TS/JS | typecheck, lint, unit tests for changed packages |
| API / DB | integration tests; migration up + down on a fresh DB |
| UI flow in an AC | affected Playwright specs (full suite before G7) |
| `.github/workflows/*` | `act` for changed jobs (Linux runners only; guard posting/deploy steps with `if: ${{ !env.ACT }}`) |
| Dependencies | audit + lockfile diff review + secret scan (e.g. gitleaks) |
Read the repo's actual CI config first and mirror it; don't invent commands. If something can't run locally, say so and run its underlying script directly.
Then, with approval: push the branch and open the PR using the PR template.

## E2E verification (G7)
Use the qa-playwright role: every AC → at least one Playwright test, run headless, report attached to the PR (and sent to Slack/email by CI if configured — see `.github/workflows/e2e.yml`).

## After merge (G8 is human-only)
Run the retro in `learn-from-corrections.md`.
