# Keelson plugin for Claude Code

Keelson turns Claude Code into a staff-level engineering partner: it answers and teaches, debugs to the root cause, plans with zero open questions, runs spec-driven development (a planner writes executable specs, builder sub-agents implement them), validates every sub-agent's output, hands off long sessions before they degrade, and improves its rules from your corrections. You approve every gate.

Install (Claude Code 2.1.275 or later):

    /plugin install keelson --marketplace abhishek305/keelson

This plugin bundles the `keelson` skill, eleven role sub-agents and the guard, context and resume hooks. For pinned team memory and the context status line, also run `npx keelson init` in your repo.

Docs: https://github.com/abhishek305/keelson
