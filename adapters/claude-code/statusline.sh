#!/usr/bin/env bash
# Shows context usage in the status line and records it so context-guard.sh can warn the agent.
input=$(cat)
sid=$(echo "$input" | jq -r '.session_id // "unknown"')
pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
if [ -z "$pct" ]; then  # fallback: compute from token counts if the pre-calculated field is missing
  pct=$(echo "$input" | jq -r '
    (.context_window.current_usage // {}) as $u
    | (.context_window.context_window_size // 0) as $size
    | if $size > 0 then ((($u.input_tokens // 0) + ($u.cache_creation_input_tokens // 0) + ($u.cache_read_input_tokens // 0)) * 100 / $size | floor) else empty end')
fi
state="${TMPDIR:-/tmp}/keelson-ctx"; mkdir -p "$state"
[ -n "$pct" ] && printf '%s' "${pct%.*}" > "$state/$sid.pct"
model=$(echo "$input" | jq -r '.model.display_name // ""')
hard="${KEELSON_HANDOFF_PCT:-85}"
label="ctx ${pct:-?}%"
if [ -n "$pct" ] && [ "${pct%.*}" -ge "$hard" ]; then label="⚠ ctx ${pct%.*}% — HAND OFF"; fi
echo "$model | $label"
