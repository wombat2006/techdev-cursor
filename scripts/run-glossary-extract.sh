#!/usr/bin/env bash
# Invoke term-prep-platform glossary_extractor against THIS repo's consumer config only.
# Read-only on the platform clone — do not edit or commit term-prep-platform from here.
# If platform changes are required, notify the user (meta/TO-BE-GLOSSARY-PIPELINE.md § Platform escalation).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM_ROOT="${TERM_PREP_PLATFORM_ROOT:-$REPO_ROOT/../term-prep-platform}"
PYTHON="${PLATFORM_ROOT}/.venv/bin/python"
EXTRACTOR="${PLATFORM_ROOT}/scripts/glossary_extractor.py"
CONFIG="${REPO_ROOT}/meta/glossary-config.json"

if [[ ! -f "$CONFIG" ]]; then
  echo "error: consumer config not found: $CONFIG" >&2
  exit 1
fi

if [[ ! -x "$PYTHON" ]]; then
  echo "error: platform venv not found: $PYTHON" >&2
  echo "Clone term-prep-platform as sibling (../term-prep-platform) and install:" >&2
  echo "  cd \"\$TERM_PREP_PLATFORM_ROOT\" && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt" >&2
  exit 1
fi

if [[ ! -f "$EXTRACTOR" ]]; then
  echo "error: glossary_extractor.py not found: $EXTRACTOR" >&2
  exit 1
fi

if [[ "${1:-}" == "--check" ]]; then
  exec "$PYTHON" "$EXTRACTOR" --config "$CONFIG" "$@"
fi

"$PYTHON" "$EXTRACTOR" --config "$CONFIG" "$@"
NORMALIZER="${REPO_ROOT}/scripts/normalize-glossary-output.py"
export TERM_PREP_PLATFORM_ROOT="$PLATFORM_ROOT"
"$PYTHON" "$NORMALIZER"
