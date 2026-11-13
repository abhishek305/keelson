#!/usr/bin/env bash
# Estimates each SUB-AGENT's context use and tells it when to wrap up or relay.
# Main session is covered by statusline.sh + context-guard.sh; this only acts when the hook input has an agent_id.
# Estimate = fixed overhead + (chars of tool inputs and results) / 4, and tool-call count. Whichever is further along wins.
# Tune: KEELSON_SUBAGENT_CONTEXT (200000 tokens), KEELSON_SUBAGENT_TOOL_BUDGET (40), KEELSON_HANDOFF_PCT (85), KEELSON_WARN_PCT (70 here).
input=$(cat)
aid=$(echo "$input" | jq -r '.agent_id // empty')
[ -z "$aid" ] && exit 0
sid=$(echo "$input" | jq -r '.session_id // "unknown"')
state="${TMPDIR:-/tmp}/keelson-ctx/agents"; mkdir -p "$state"
f="$state/$sid-$aid"

chars=$(echo "$input" | jq -r '((.tool_input // {} | tostring | length) + (.tool_response // "" | tostring | length))')
read -r calls total <<<"$(cat "$f" 2>/dev/null || echo "0 0")"
calls=$((calls + 1)); total=$((total + chars))
printf '%s %s' "$calls" "$total" > "$f"

ctx="${KEELSON_SUBAGENT_CONTEXT:-200000}"; tools="${KEELSON_SUBAGENT_TOOL_BUDGET:-40}"
hard="${KEELSON_HANDOFF_PCT:-85}"; warn="${KEELSON_WARN_PCT:-70}"
tok_pct=$(( (15000 + total / 4) * 100 / ctx ))
call_pct=$(( calls * 100 / tools ))
pct=$(( tok_pct > call_pct ? tok_pct : call_pct ))

if   [ "$pct" -ge "$hard" ]; then level=hard
elif [ "$pct" -ge "$warn" ]; then level=warn
else exit 0; fi
last=$(cat "$f.level" 2>/dev/null)
[ "$last" = "$level" ] && [ "$level" = warn ] && exit 0   # warn once; repeat the relay message until it stops
printf '%s' "$level" > "$f.level"

if [ "$level" = hard ]; then
  msg="SUB-AGENT BUDGET ~${pct}% (${calls} tool calls). Stop now: finish your ledger and return status PARTIAL with a Relay handoff, per .keelson/roles/_context-protocol.md section 5. Do not start new items."
else
  msg="SUB-AGENT BUDGET ~${pct}% (${calls} tool calls). Stop exploring, finish the current item, update your ledger."
fi
jq -n --arg m "$msg" '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $m}}'
