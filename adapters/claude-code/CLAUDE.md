@AGENTS.md

## Claude Code specifics (Keelson)
- Sub-agents in `.claude/agents/` are thin wrappers around `.keelson/roles/*.md`, with models pinned from `.keelson/models.yaml` (planner / builder / reviewer). Use them for research, spec-driven builds, independent review and Playwright QA.
- Guardrail and context hooks live in `.claude/hooks/` and are wired in `.claude/settings.json`. If a hook blocks you, tell the engineer what was blocked and why; never work around it.
