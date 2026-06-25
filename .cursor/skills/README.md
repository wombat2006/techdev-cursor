# Cursor skills — consumer ↔ platform pairs

| techdev-cursor skill | term-prep-platform pair | Direction |
|----------------------|---------------------------|-----------|
| [consumer-integration](./consumer-integration/SKILL.md) | `platform-integration` | Read **platform** handoff before consumer work |
| [consumer-handoff](./consumer-handoff/SKILL.md) | `consumer-handoff` | Apply **platform → consumer** obligations (A+C workflow) |
| [platform-handoff](./platform-handoff/SKILL.md) | (agent reads `platform-integration` on platform) | Generate paste prompt for **platform** agent chat |

## Typical flows

**Consumer starts glossary / Drive work**

1. `consumer-integration` — read platform 05 · 01 · 02 + local boundary
2. Implement in techdev-cursor only
3. If platform Issue arrives later → `consumer-handoff`

**User assigns platform task**

1. `platform-handoff` — copy prompt into term-prep-platform chat
2. Platform agent uses `platform-integration` + implements on platform
3. Platform maintainer uses platform `consumer-handoff` → CHANGELOG + bot Issue
4. Back on consumer → `consumer-handoff` → PR per `04` + `check-handoff --mark-seen`

## Invoke

Name the skill in chat, e.g. **「consumer-handoff スキルで handoff を確認して」**.
