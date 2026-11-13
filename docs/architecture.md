# Architecture

**One source, many tools.** Everything an agent reads is plain Markdown in `core/`. Adapters add the minimum glue each tool needs, and the installer writes both into a repo.

```
core/AGENTS.md ─────────────► AGENTS.md (managed block)  ◄── read natively by Codex, Cursor, OpenCode, Copilot…
core/keelson/** ────────────► .keelson/**   (kit-owned: overwritten on update unless edited)
core/seed/** ───────────────► .keelson/memory/**, docs/agent/ACTIVE.md  (team-owned: created once)
profiles/<name>.md ─────────► .keelson/profile.md (team-owned)
adapters/_agents/*.md ──┬───► .claude/agents/*.md   (model from models.yaml)
                        └───► .opencode/agents/*.md (mode: subagent)
adapters/claude-code/** ────► CLAUDE.md block, .claude/hooks, statusline, merged settings.json
adapters/<tool>/** ─────────► each tool's rule/pointer file
scripts/build.js ───────────► skills/keelson (Agent Skill), plugins/keelson (Claude plugin), dist/chatgpt
```

**Ownership.** `.keelson/manifest.json` stores a hash of every kit file written. On update, a kit file whose hash changed (someone edited it) is left alone and the new version goes to `<file>.keelson-new`. Team-owned files are never touched.

**Model roles.** Playbooks say *planner*, *builder*, *reviewer*. `models.yaml` maps roles to real models per tool, and each sub-agent to a role and effort. Only adapters that can pin models use it; others inherit the session model.

**Why Markdown and not a framework.** Every agent can read Markdown, teams can review changes in PRs, and nothing breaks when a tool changes its plugin API. Code exists only where a tool needs it (hooks, installer).
