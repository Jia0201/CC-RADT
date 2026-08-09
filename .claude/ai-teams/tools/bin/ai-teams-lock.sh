#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ai-teams-lib.sh
source "$SCRIPT_DIR/ai-teams-lib.sh"

usage() {
  cat <<'USAGE'
用法：
  bash tools/bin/ai-teams-lock.sh acquire --resource <path> --owner <agent> [--task <task-id>] [--ttl-minutes <n>]
  bash tools/bin/ai-teams-lock.sh release --resource <path> --owner <agent>
  bash tools/bin/ai-teams-lock.sh status [--resource <path>]
  bash tools/bin/ai-teams-lock.sh self-test

说明：
  使用 mkdir 创建 shared/locks/.locks/<hash>.lock，目录创建在本地文件系统上是原子操作。
USAGE
}

hash_resource() {
  printf "%s" "$1" | shasum -a 256 | awk '{print $1}'
}

lock_dir_for() {
  local resource hash
  resource="$1"
  hash="$(hash_resource "$resource")"
  printf "shared/locks/.locks/%s.lock" "$hash"
}

write_meta() {
  local file resource owner task ttl
  file="$1"
  resource="$2"
  owner="$3"
  task="$4"
  ttl="$5"
  {
    printf "resource=%s\n" "$resource"
    printf "owner=%s\n" "$owner"
    printf "task=%s\n" "$task"
    printf "ttl_minutes=%s\n" "$ttl"
    printf "created_at=%s\n" "$(ai_teams_now)"
  } > "$file"
}

cmd="${1:-}"
[[ -n "$cmd" ]] || { usage; exit 2; }
shift || true

ai_teams_require_root
ai_teams_ensure_runtime_dirs

resource=""
owner=""
task="-"
ttl="120"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource)
      resource="${2:-}"
      shift 2
      ;;
    --owner)
      owner="${2:-}"
      shift 2
      ;;
    --task)
      task="${2:-}"
      shift 2
      ;;
    --ttl-minutes)
      ttl="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      usage
      exit 2
      ;;
  esac
done

case "$cmd" in
  acquire)
    [[ -n "$resource" && -n "$owner" ]] || { echo "acquire 需要 --resource 和 --owner" >&2; exit 2; }
    lock_dir="$(lock_dir_for "$resource")"
    if mkdir "$lock_dir" 2>/dev/null; then
      write_meta "$lock_dir/meta.env" "$resource" "$owner" "$task" "$ttl"
      echo "锁定成功：$resource -> $lock_dir"
    else
      echo "锁定失败：$resource 已被占用" >&2
      if [[ -f "$lock_dir/meta.env" ]]; then
        sed -n '1,20p' "$lock_dir/meta.env" >&2
      fi
      exit 3
    fi
    ;;
  release)
    [[ -n "$resource" && -n "$owner" ]] || { echo "release 需要 --resource 和 --owner" >&2; exit 2; }
    lock_dir="$(lock_dir_for "$resource")"
    [[ -d "$lock_dir" ]] || { echo "锁不存在：$resource"; exit 0; }
    current_owner=""
    if [[ -f "$lock_dir/meta.env" ]]; then
      current_owner="$(awk -F= '$1 == "owner" {print $2}' "$lock_dir/meta.env")"
    fi
    if [[ -n "$current_owner" && "$current_owner" != "$owner" ]]; then
      echo "释放失败：锁属于 $current_owner，不属于 $owner" >&2
      exit 4
    fi
    rm -rf "$lock_dir"
    echo "释放成功：$resource"
    ;;
  status)
    if [[ -n "$resource" ]]; then
      lock_dir="$(lock_dir_for "$resource")"
      if [[ -d "$lock_dir" ]]; then
        echo "锁定中：$resource"
        sed -n '1,20p' "$lock_dir/meta.env" 2>/dev/null || true
      else
        echo "未锁定：$resource"
      fi
    else
      find shared/locks/.locks -mindepth 1 -maxdepth 1 -type d -name "*.lock" -print | sort
    fi
    ;;
  self-test)
    resource="self-test/ai-teams-lock-$$"
    owner="lead"
    "$0" acquire --resource "$resource" --owner "$owner" --task self-test >/dev/null
    "$0" status --resource "$resource" | grep -Fq "锁定中"
    "$0" release --resource "$resource" --owner "$owner" >/dev/null
    "$0" status --resource "$resource" | grep -Fq "未锁定"
    echo "ai-teams-lock 自检通过"
    ;;
  *)
    echo "未知命令：$cmd" >&2
    usage
    exit 2
    ;;
esac
