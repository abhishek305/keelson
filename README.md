<p align="center"><img src="adapters/claude-code/icon.png" width="96" alt="" /></p>

# Keelson

**A staff-level engineer for your AI coding agent.** Keelson is a set of portable instructions, sub-agent roles and guardrails that turn Claude Code, Codex, OpenCode, Cursor, Copilot, Gemini CLI or ChatGPT into the senior engineer everyone on the team goes to: it answers "dumb" questions without judgement, debugs to the root cause, plans with zero open questions, builds in small reviewable slices, and teaches you why at every step. You approve every gate.

> A *keelson* is the beam bolted along a ship's keel to keep the hull straight under load. That's the job: keep AI-assisted delivery straight as the work gets bigger.

```bash
npx github:abhishek305/keelson init
```

## Why

AI coding agents are fast but drift: they assume instead of asking, invent APIs, skip tests to get green, lose the thread in long sessions, and forget your corrections next time. Keelson is the operating manual that fixes those habits, in plain Markdown any agent can read:

- **No silent assumptions.** Every unknown is researched, asked as a multiple-choice question, or escalated before code is written.
- **Truth over fluency.** Claims are labelled Verified (with a source), Inferred or Unknown. "Done" needs command output.
- **Spec-driven development.** A *planner* model writes an executable spec per slice; cheap *builder* sub-agents implement slices in parallel waves; the planner validates every result.
- **Validated multi-agent orchestration.** The parent agent rejects sub-agent output that fails its contract, guardrails or rubric (max 2 retries), then escalates to you.
- **Context handoff.** At ~85% context, or on drift, agents write a handoff and resume in a fresh session or sub-agent exactly where they stopped.
- **Self-improving rules.** Corrections become one-line rules (personal or team) after you approve them, and load next session.
- **Mentor mode.** Every decision comes with an "explain it simply" note you can repeat to your team.

## Quick start

Everything installs straight from this GitHub repo. You need Node.js 18+ and git; no npm account or global install.

```bash
cd your-repo
npx github:abhishek305/keelson init          # asks which tools and which stack profile
```

Or non-interactively:

```bash
npx github:abhishek305/keelson init --tools claude-code,codex,opencode,cursor --profile node-fullstack --yes
```

Then review the changes (`git diff`), commit them, start your agent and say: *"Read AGENTS.md and confirm which Keelson files you loaded."*

### All the ways to use it

| Want | Do |
|---|---|
| Install or update in a repo | `npx github:abhishek305/keelson init` / `npx github:abhishek305/keelson update` (update never touches team memory) |
| Pin a version | `npx github:abhishek305/keelson#<tag> init` (tags are listed under Releases) |
| Check the install | `npx github:abhishek305/keelson doctor` |
| Claude Code plugin | `/plugin marketplace add abhishek305/keelson`, then `/plugin install keelson@keelson` |
| Just the skill, in any agent that supports Agent Skills | `npx skills add abhishek305/keelson` |
| ChatGPT (Custom GPT or Project) | `npx github:abhishek305/keelson chatgpt`, paste `instructions.md` into the instructions, upload the other three files as knowledge |
| No npx at all | `git clone https://github.com/abhishek305/keelson.git` then `node keelson/bin/keelson.js init --dir your-repo` |

**Tools:** `claude-code`, `codex`, `opencode`, `cursor`, `copilot`, `gemini`. **Profiles:** `generic` (learns your stack from the repo), `node-fullstack`, `python-backend`.

**Tip:** to save typing, add `alias keelson="npx github:abhishek305/keelson"` to your shell profile, then run `keelson init`.

## How it works

You talk to it normally. It picks a **mode** and says which one:

| You bring | Mode |
|---|---|
| A question, concept or logic puzzle | **Ask/Teach**: answer, why, example, gotchas, one check question. Hints on request |
| A bug or failing test | **Debug**: reproduce, ranked hypotheses, cheapest check first, root-cause fix with a regression test, then the reasoning |
| A Confluence page, Google Doc or list of ideas | **Context**: maps the doc to the code, flags conflicts, reviews ideas one at a time |
| A vague idea, PRD or TRD | **Plan**: open-questions table → plan with options → stories with Given/When/Then |
| A feature or epic | **Spec-driven**: executable spec, waves, builder sub-agents |
| A big task with independent parts | **Orchestrate**: briefed sub-agents, validated outputs |
| "That's wrong" | **Learn**: fixes it, logs a lesson, proposes one rule |

Planning and building stop at gates (G1 spec → G2 plan → G3 stories → G4 each slice → G5 independent review → G6 local CI + PR → G7 E2E evidence → G8 you merge).

### What gets installed

```
AGENTS.md                 Keelson block (your own content stays outside it)
.keelson/
  playbooks/ roles/ evals/ templates.md   kit files (updated by `keelson update`)
  models.yaml             which real model is planner / builder / reviewer, per tool   ← yours
  profile.md              your stack profile                                             ← yours
  memory/                 team rules, lessons, project context, ideas, approved tools    ← yours
docs/agent/ACTIVE.md      resume registry for handed-off work                            ← yours
+ per-tool adapters (below)
```

Files marked *yours* are created once and never overwritten. If you edit a kit file, updates leave your version alone and write `<file>.keelson-new` next to it.

### Tool support

Everything is plain Markdown, so every tool gets the persona, modes, gates and playbooks. Automation depends on what each tool exposes:

| | Claude Code | Codex | OpenCode | Cursor | Copilot | Gemini CLI | ChatGPT |
|---|---|---|---|---|---|---|---|
| Persona | `CLAUDE.md` → `AGENTS.md` | `AGENTS.md` | `AGENTS.md` | `AGENTS.md` + rule | `AGENTS.md` + pointer | `GEMINI.md` pointer | instructions |
| Playbooks | `.keelson/` | `.keelson/` + skill | `.keelson/` | `.keelson/` | `.keelson/` | `.keelson/` | knowledge files |
| Sub-agents with pinned models | ✓ | fresh session | ✓ (`mode: subagent`) | fresh chat | fresh chat | fresh session | fresh chat |
| Guard hooks (secrets, force-push, destructive SQL) | ✓ | – | – | – | – | – | – |
| 85% context handoff | automatic | self-detected | self-detected | you watch the meter | self-detected | self-detected | self-detected |
| Auto-resume after handoff | `SessionStart` hook | `AGENTS.md` rule | rule + `opencode.json` | rule | rule | rule | paste the handoff |

"Self-detected" means the agent watches for drift (fuzzy recall, re-asking settled questions, contradicting decisions). The written rules guide the agent; the real enforcement is GitHub branch protection, secret scanning and the Claude Code hooks, so set those up.

## Configure

- **Models:** edit `.keelson/models.yaml`, then `npx github:abhishek305/keelson update`. Playbooks only ever say *planner*, *builder* and *reviewer*.
- **Stack:** `npx github:abhishek305/keelson profiles` lists profiles (`generic`, `node-fullstack`, `python-backend`). `generic` learns the stack from your repo. New profiles are very welcome.
- **Team memory:** add 3–5 real facts to `.keelson/memory/team-rules.md` on day one (test command, data access pattern, error type). Corrections add more over time, through PRs.
- **Personal rules:** copy `.keelson/memory/local/*.example.md` (gitignored).

## Contributing

Keelson improves the way it asks agents to improve: one specific change at a time, with evidence. Each PR changes one playbook, role or adapter and includes golden-task results from at least one tool. See [CONTRIBUTING.md](CONTRIBUTING.md), the [roadmap](docs/roadmap.md) and [Discussions](https://github.com/abhishek305/keelson/discussions) for ideas, feedback and show-and-tell.

## License

[MIT](LICENSE) © Abhishek Ezhava
