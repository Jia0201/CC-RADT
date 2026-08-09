#!/usr/bin/env bash
set -euo pipefail

mode="--plan"
if [[ "${AI_TEAMS_HOOK_APPLY:-0}" == "1" ]]; then
  mode="--apply"
fi

bash "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/tools/bin/ai-teams-logs-clean.sh" --before "$(date "+%Y-%m-%d")" "$mode"
