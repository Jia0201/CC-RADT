#!/usr/bin/env bash

ai_teams_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/../.." && pwd
}

ai_teams_now() {
  date "+%Y-%m-%d %H:%M:%S"
}

ai_teams_stamp() {
  date "+%Y%m%d-%H%M%S"
}

ai_teams_day() {
  date "+%Y-%m-%d"
}

ai_teams_require_root() {
  local root
  root="$(ai_teams_root)"
  cd "$root"
}

ai_teams_ensure_runtime_dirs() {
  mkdir -p \
    logs/agent \
    logs/task \
    logs/command \
    logs/hook \
    logs/upgrade \
    logs/package \
    logs/audit \
    logs/security \
    logs/compressed/archive \
    tools/rollback/snapshots \
    tools/commands/ai \
    memory/candidates \
    memory/conversations/sessions \
    memory/conversations/compact \
    memory/conversations/restore-points \
    memory/archive \
    kb/candidates \
    shared/events \
    shared/transactions \
    shared/locks/.locks
}

ai_teams_is_sensitive_path() {
  local path lower base
  path="$1"
  lower="$(printf "%s" "$path" | tr "[:upper:]" "[:lower:]")"
  base="$(basename "$lower")"
  case "$base" in
    .env|.env.*|*.pem|*.key|*.p12|*.pfx|id_rsa|id_ed25519|.token|.token.*|token.json|token.yaml|token.yml|.secret|.secret.*|secret.json|secret.yaml|secret.yml|.credentials|.credentials.*|credentials.json|credentials.yaml|credentials.yml|service-account*.json)
      return 0
      ;;
  esac
  case "$lower" in
    */secrets/*|*/.secrets/*|*/.ssh/*|*/.gnupg/*)
      return 0
      ;;
  esac
  return 1
}

ai_teams_safe_find() {
  local target harness_root
  target="$1"
  harness_root="$(ai_teams_root)"
  find "$target" \
    -path "$harness_root" -prune -o \
    -path "$target/.claude/ai-teams" -prune -o \
    -path "$target/.claude/agents" -prune -o \
    -path "$target/.claude/CLAUDE.md" -prune -o \
    -path "$target/.claude/settings.json" -prune -o \
    -path "$target/.claude/settings.local.json" -prune -o \
    -path "$target/.claude/settings.local.example.json" -prune -o \
    -path "$target/.claude/manifest.json" -prune -o \
    -path "*/.git" -prune -o \
    -path "*/node_modules" -prune -o \
    -path "*/target" -prune -o \
    -path "*/build" -prune -o \
    -path "*/dist" -prune -o \
    -path "*/out" -prune -o \
    -path "*/.next" -prune -o \
    -path "*/.nuxt" -prune -o \
    -path "*/.venv" -prune -o \
    -path "*/venv" -prune -o \
    -path "*/.cache" -prune -o \
    -path "*/tmp" -prune -o \
    -path "*/.codegraph" -prune -o \
    -type f -print
}

ai_teams_update_section() {
  local file marker content_file tmp begin end
  file="$1"
  marker="$2"
  content_file="$3"
  mkdir -p "$(dirname "$file")"
  [[ -f "$file" ]] || touch "$file"
  tmp="$(mktemp)"
  begin="<!-- AI-TEAMS:${marker}:BEGIN -->"
  end="<!-- AI-TEAMS:${marker}:END -->"
  awk -v begin="$begin" -v end="$end" '
    $0 == begin { skipping = 1; next }
    $0 == end { skipping = 0; next }
    skipping != 1 { print }
  ' "$file" > "$tmp"
  {
    sed -e '${/^$/d;}' "$tmp"
    printf "\n\n%s\n" "$begin"
    cat "$content_file"
    printf "\n%s\n" "$end"
  } > "$file"
  rm -f "$tmp"
}

ai_teams_log_command() {
  local name content_file log_file
  name="$1"
  content_file="$2"
  ai_teams_ensure_runtime_dirs
  log_file="logs/command/${name}-$(ai_teams_stamp).md"
  cp "$content_file" "$log_file"
  printf "%s\n" "$log_file"
}

ai_teams_write_status_event() {
  local message tmp
  message="$1"
  tmp="$(mktemp)"
  {
    printf "## 最近自动状态\n\n"
    printf -- "- 时间：%s\n" "$(ai_teams_now)"
    printf -- "- 事件：%s\n" "$message"
  } > "$tmp"
  ai_teams_update_section "index/STATUS.md" "auto-status-event" "$tmp"
  rm -f "$tmp"
}

ai_teams_checksum_tree() {
  local target output
  target="$1"
  output="$2"
  (
    cd "$target"
    find . -type f \
      ! -path "./checksums.txt" \
      ! -path "./.DS_Store" \
      -print0 | sort -z | xargs -0 shasum -a 256
  ) > "$output"
}
