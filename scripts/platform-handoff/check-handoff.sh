#!/usr/bin/env bash
# Consumer-side: verify platform handoff was read; compare CHANGELOG to last-seen marker.
#
# Note: D-004 (2026-06-29) deprecated the A+C cross-repo bot workflow.
# check-handoff.sh now reads CHANGELOG directly (handoff_changelog.py was removed from platform).
#
# Usage (from techdev-cursor root):
#   ./scripts/platform-handoff/check-handoff.sh
#   ./scripts/platform-handoff/check-handoff.sh --mark-seen

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLATFORM_ROOT="${TERM_PREP_PLATFORM_ROOT:-$REPO_ROOT/../term-prep-platform}"
CHANGELOG="${PLATFORM_ROOT}/meta/consumer-handoff/CHANGELOG.md"
SEEN_FILE="${REPO_ROOT}/meta/.platform-handoff-last-seen"

MARK_SEEN=0
if [[ "${1:-}" == "--mark-seen" ]]; then
  MARK_SEEN=1
fi

if [[ ! -f "$CHANGELOG" ]]; then
  echo "error: platform CHANGELOG not found: $CHANGELOG" >&2
  echo "Set TERM_PREP_PLATFORM_ROOT or clone sibling term-prep-platform" >&2
  exit 1
fi

LATEST="$(grep -m1 '^## [0-9]' "$CHANGELOG" | sed 's/^## //' | cut -d' ' -f1)"

if [[ "$MARK_SEEN" -eq 1 ]]; then
  mkdir -p "$(dirname "$SEEN_FILE")"
  printf '%s\n' "$LATEST" > "$SEEN_FILE"
  echo "marked seen: $LATEST"
  exit 0
fi

echo "platform handoff latest: $LATEST"
echo "read pack: ${PLATFORM_ROOT}/meta/consumer-handoff/README.md"

if [[ ! -f "$SEEN_FILE" ]]; then
  echo ""
  echo "status: NEW — no meta/.platform-handoff-last-seen yet"
  echo "action: read consumer-handoff README → 01 → 02 → 04 → 03; open consumer PR if needed"
  echo "        then: $0 --mark-seen"
  exit 2
fi

SEEN="$(tr -d '\n' < "$SEEN_FILE")"
if [[ "$SEEN" == "$LATEST" ]]; then
  echo "status: OK — consumer marked seen through: $SEEN"
  exit 0
fi

echo ""
echo "status: STALE — last seen: $SEEN"
echo "action: read CHANGELOG + 04-consumer-pr-guide; update consumer PR or request-platform-change.sh"
exit 1
