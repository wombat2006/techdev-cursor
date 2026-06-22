#!/usr/bin/env bash
# Connect ByteRover (brv) to a cloud API provider (not local Ollama).
# Reads keys from .env.brv.local (gitignored). Does not print secrets.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BRV="${REPO_ROOT}/node_modules/.bin/brv"
if [[ ! -x "$BRV" ]]; then
  echo "error: byterover-cli not installed — run: npm install" >&2
  exit 1
fi

if [[ -f "$REPO_ROOT/.env.brv.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env.brv.local"
  set +a
fi

# BRV_PROVIDER overrides auto-detect: openrouter | anthropic | openai | google | byterover
PROVIDER="${BRV_PROVIDER:-}"

pick_provider() {
  if [[ -n "$PROVIDER" ]]; then
    echo "$PROVIDER"
    return
  fi
  if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then echo openrouter; return; fi
  if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then echo anthropic; return; fi
  if [[ -n "${OPENAI_API_KEY:-}" ]]; then echo openai; return; fi
  if [[ -n "${GEMINI_API_KEY:-}" ]]; then echo google; return; fi
  echo ""
}

PROVIDER_ID="$(pick_provider)"
if [[ -z "$PROVIDER_ID" ]]; then
  cat >&2 <<'EOF'
error: no API credentials found.

1. cp .env.brv.local.example .env.brv.local
2. Set ONE of: OPENROUTER_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY
   Or set BRV_PROVIDER=byterover and run: brv providers connect byterover --oauth
3. Re-run: npm run setup-brv-provider

OAuth (no key in file):
  brv providers connect openai --oauth
  brv providers connect byterover --oauth
EOF
  exit 1
fi

MODEL="${BRV_MODEL:-}"

connect_openrouter() {
  local model="${MODEL:-openai/gpt-4o-mini}"
  "$BRV" providers connect openrouter --api-key "$OPENROUTER_API_KEY" --model "$model"
}

connect_anthropic() {
  local model="${MODEL:-claude-haiku-4-5}"
  "$BRV" providers connect anthropic --api-key "$ANTHROPIC_API_KEY" --model "$model"
}

connect_openai() {
  local model="${MODEL:-gpt-4o-mini}"
  "$BRV" providers connect openai --api-key "$OPENAI_API_KEY" --model "$model"
}

connect_google() {
  local model="${MODEL:-gemini-2.0-flash}"
  "$BRV" providers connect google --api-key "$GEMINI_API_KEY" --model "$model"
}

connect_byterover() {
  if [[ "${BRV_OAUTH:-}" == "1" ]]; then
    "$BRV" providers connect byterover --oauth
  else
    echo "error: byterover requires --oauth. Run: BRV_OAUTH=1 npm run setup-brv-provider" >&2
    exit 1
  fi
}

echo "Connecting brv provider: ${PROVIDER_ID}"
case "$PROVIDER_ID" in
  openrouter) connect_openrouter ;;
  anthropic) connect_anthropic ;;
  openai) connect_openai ;;
  google) connect_google ;;
  byterover) connect_byterover ;;
  *)
    echo "error: unknown BRV_PROVIDER=${PROVIDER_ID}" >&2
    exit 1
    ;;
esac

echo ""
"$BRV" providers
echo ""
echo "Smoke: brv query \"What is Wall-Bounce?\""
echo "       brv curate \"Short test fact for smoke check.\""
