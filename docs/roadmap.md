# Roadmap

Direction, not promises. Discuss in GitHub Discussions; big items need an RFC.

## v0.1 (this release)
Tool-neutral core, model roles, stack profiles, installer (`init/update/doctor/chatgpt`), adapters for Claude Code, Codex, OpenCode, Cursor, Copilot, Gemini CLI, ChatGPT pack, Agent Skill, Claude plugin.

## v0.2: reach and feedback
- Listing: Anthropic plugin directory, skills.sh, awesome lists; a published Custom GPT.
- Codex sub-agents and hooks once their formats settle; OpenCode permissions for read-only roles.
- Docs site with a "first hour with Keelson" walkthrough per tool.
- `keelson feedback`: opens a pre-filled issue with version, tools and (optionally) a redacted lesson.

## v0.3: measurable quality
- Runnable golden tasks: fixture repos plus headless runs (`claude -p`, `codex exec`, `opencode run`), scored by deterministic checks and a rubric judge; nightly on a small budget, results published per tool.
- More profiles: Go, Java/Spring, Rails, .NET, mobile.

## v0.4+: orchestration
- A small, tool-neutral runner for the spec's **execution waves**: start builders per slice, collect ledgers, run combined checks, write run logs consistently across tools.
- Shared lesson exchange: opt-in upstreaming of generalised lessons with review.
- Metrics from run logs: blocked rate per slice, retries, relays, tokens per slice.
