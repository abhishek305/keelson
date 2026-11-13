#!/usr/bin/env bash
# Blocks risky shell commands. Exit 2 = block and show the message to the agent.
cmd=$(jq -r '.tool_input.command // ""')
block() { echo "BLOCKED: $1. Ask the engineer." >&2; exit 2; }

[[ "$cmd" =~ git[[:space:]]+push.*(main|master|release) ]] && block "push to a protected branch"
[[ "$cmd" =~ rm[[:space:]]+-rf[[:space:]]+(/|~|\.)([[:space:]]|$) ]] && block "destructive rm"
[[ "$cmd" =~ (--no-verify) ]] && block "skipping git hooks"
[[ "$cmd" =~ (DROP[[:space:]]+(TABLE|DATABASE)|TRUNCATE[[:space:]]) ]] && block "destructive SQL"
[[ "$cmd" =~ (curl|wget).*(TOKEN|SECRET|PASSWORD|API_KEY) ]] && block "possible secret exfiltration"
exit 0
