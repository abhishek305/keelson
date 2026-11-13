#!/usr/bin/env bash
# Reads the context % recorded by statusline.sh and tells the agent when to checkpoint or hand off.
# Wired to UserPromptSubmit and PostToolUse. Thresholds: KEELSON_WARN_PCT (75), KEELSON_HANDOFF_PCT (85).
input=$(cat)
sid=$(echo "$input" | jq -r '.session_id // "unknown"')
event=$(echo "$input" | jq -r '.hook_event_name // "UserPromptSubmit"')
state="${TMPDIR:-/tmp}/keelson-ctx"
pct=$(cat "$state/$sid.pct" 2>/dev/null) || exit 0
[ -z "$pct" ] && exit 0
warn="${KEELSON_WARN_PCT:-75}"; hard="${KEELSON_HANDOFF_PCT:-85}"

if   [ "$pct" -ge "$hard" ]; then level=hard
elif [ "$pct" -ge "$warn" ]; then level=warn
else exit 0; fi

# After tool calls, only speak when crossing into a new level (avoid repeating every call).
last=$(cat "$state/$sid.level" 2>/dev/null)
if [ "$event" = "PostToolUse" ] && [ "$last" = "$level" ]; then exit 0; fi
printf '%s' "$level" > "$state/$sid.level"

if [ "$level" = hard ]; then
  msg="CONTEXT AT ${pct}% (limit ${hard}%). Stop new work now and follow .keelson/playbooks/handoff.md: leave code clean, finalise docs/agent/<task>/handoff.md from git and files, run the cold-read test, then give the engineer the resume prompt."
else
  msg="CONTEXT AT ${pct}%. Finish only the current small step, update docs/agent/<task>/handoff.md, and start no new tasks."
fi
jq -n --arg e "$event" --arg m "$msg" '{hookSpecificOutput: {hookEventName: $e, additionalContext: $m}}'
