# Project Context (learn the project, then work through the ideas in it)

Use when the engineer shares a Confluence page, Google Doc, Notion page, notes, or feedback about the project — or says "understand this project first".
Outputs: `.keelson/memory/project/context.md` (what the project is) and `.keelson/memory/project/ideas.md` (the ideas/feedback and what we decided). Both are team-shared and change through PRs.

## 1. Get the source (never guess its contents)
In order:
1. **Connected tool:** Confluence/Jira via the Atlassian MCP, Google Docs/Drive via a Google MCP, Notion via its MCP. Check `memory/project/tools.md` and what's connected now.
2. **File in the repo or attached** (export the page as Markdown/PDF/DOCX).
3. **Not reachable?** Say so, then either propose connecting the tool (`tools-and-mcp.md`) or ask the engineer to export and attach it. Never summarise a page you couldn't open.
Record each source: title, link, owner, last-modified/version, date read.

## 2. Build the picture (read widely, then connect to the code)
Read the document fully, then the linked pages it depends on (one level deep unless needed), then the repo parts it mentions. For big projects, use Orchestrate: one context-builder sub-agent per area (e.g. data, API, frontend, infra), then merge.
Write `context.md` using the "Project context" template in `templates.md`:
- Summary in 5 lines; goals and non-goals; users and tenants.
- Glossary: every project term, defined in plain words.
- Architecture: components → where they live in the repo (`path`, verified) → who owns them. Mermaid diagram for the main flow.
- Data: stores, key tables/collections, pipelines, Cube models, dashboards.
- Integrations, constraints (compliance, SLOs, cost), decisions (link ADRs).
- **Doc vs code conflicts:** anything the doc says that the code contradicts. Flag it; never silently pick one.
- Open questions.
Every fact cites its source (doc link + section, or `file:line`). Mark anything not verified as Inferred.

## 3. Check understanding with the engineer
Present a short summary + the conflicts + open questions. Ask: "What did I get wrong or miss?" Fix, then save `context.md` only after approval.

## 4. Work through the ideas/feedback (the main event)
Extract every idea, opinion or piece of feedback into `ideas.md` (template in `templates.md`). Then:
1. **Triage together:** quick table of all ideas with impact / effort / risk (each one line, labelled Inferred). Ask which to start with; suggest an order.
2. **For each idea, one at a time:**
   - **What it means** in plain words (and what problem it solves for users).
   - **How it would work here** — in this codebase, with real file paths.
   - **Research** (`research.md`): how others solve it, framework/library options, known pitfalls. Cite sources.
   - **Options** (≥2, including "don't do it" when fair): pros, cons, effort, behaviour at 100× scale, risks.
   - **Recommendation** + "Explain it simply".
   - **Teach the concept underneath** (e.g. "this is really an idempotency problem — here's what that means"), at the depth in `learner.md`.
   - **Decision needed:** ask; record the answer, who decided, date.
3. Approved ideas flow into Plan mode (clarify → plan → stories). Rejected/deferred ideas stay in `ideas.md` with the reason.

## 5. Keep it fresh
- At session start, if `context.md` lists a source whose last-modified is newer than our read date (check via the connected tool), offer a re-sync. Re-read only what changed; update affected lines; show the diff.
- When code changes make a context line wrong, propose the one-line fix.
- Never write back to Confluence/Docs without approval. Offer to post a comment summarising decisions instead of editing the author's page.
