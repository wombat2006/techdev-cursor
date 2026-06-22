# Anthropic Vision Integration

**Status**: Documented — `image` blocks not wired in `claude-adapter.ts` (Track B-0)  
**Platform**: [Vision](https://platform.claude.com/docs/en/docs/build-with-claude/vision) · [Cookbook — getting started with vision](https://platform.claude.com/cookbook/multimodal-getting-started-with-vision) · [Best practices for vision](https://platform.claude.com/cookbook/multimodal-best-practices-for-vision)  
**Related**: [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

Claude **understands images** via `type: "image"` content blocks — charts, screenshots, forms, multi-image comparison, and multi-turn visual dialogue.

**ZDR:** Eligible.

**Platforms:** Claude API, AWS, Bedrock, Vertex, Foundry — all active models (platform). **Fork AS-IS:** `claude-sonnet-4-6` (`modalities: vision`, `document`).

**This fork:** CLI `--print` text-only today; vision agent paths are **API/SDK reference** until Messages API wiring.

---

## Limits (platform)

| Limit | Value |
|-------|--------|
| Images per request (200k context) | **100** |
| Images per request (other) | **600** |
| Max image dimension | **8000×8000** px (→ **2000×2000** when >20 images/request) |
| Max image size (Claude API) | **10 MB** base64 per image |
| Max image size (Bedrock / Vertex) | **5 MB** base64 per image |
| Max request payload | **32 MB** (whole request; may hit before image count cap) |

**Formats:** JPEG, PNG, GIF, WebP (`image/jpeg`, `image/png`, `image/gif`, `image/webp`). Animated GIF → first frame only. **No image metadata** parsed.

**Files API:** Beta `files-api-2025-04-14` — upload once, reference `file_id`; reduces multi-turn payload growth. **Not ZDR** for Files API storage semantics.

---

## Visual token math

Images are processed in **28×28 pixel patches** (visual tokens):

```
visual_tokens = ⌈width / 28⌉ × ⌈height / 28⌉
```

Claude resizes oversized images (aspect ratio preserved), then **pads** bottom/right to the next multiple of 28 px. Cost = visual tokens × model input price. Preflight via [`messages/count_tokens`](./ANTHROPIC_TOKEN_COUNTING.md).

### Standard resolution (Sonnet 4.6 AS-IS)

| Constraint | Value |
|------------|--------|
| Max long edge | **1568** px |
| Max visual tokens | **1568** per image |

Example: 1920×1080 → downscaled to ~1456×819 → ~1560 tokens (cap).

### High resolution (Opus 4.7+ migration)

| Constraint | Value |
|------------|--------|
| Max long edge | **2576** px |
| Max visual tokens | **4784** per image |
| Models | Opus 4.7+, Opus 4.8, Fable 5, Mythos 5 — **auto-enabled**, no beta header |

**Catalog note:** `claude-opus-4-8` / `claude-sonnet-4-6` use **standard** limits until model upgrade.

---

## Image block sources

| Source | `source.type` | Notes |
|--------|---------------|--------|
| URL | `url` | Hosted images |
| Inline | `base64` + `media_type` | Bedrock/Vertex: base64 only |
| Files API | `file` + `file_id` | Multi-turn agents; smaller repeat payloads |

```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/jpeg",
    "data": "..."
  }
}
```

**Placement:** Prefer **image(s) before text** in `content`. Multi-image: label with `Image 1:`, `Image 2:` text blocks.

---

## Coordinates and bounding boxes

- Ask for **absolute pixel coordinates** `[x1, y1, x2, y2]` — not normalized 0–1000 scales.
- Coordinates refer to Claude's **resized** image (not padded dimensions). Normalize/rescale using **resized** width/height, not padded.
- **Pre-resize before upload** for 1:1 coordinate mapping (platform provides `resized_size()` reference).
- **PDF uploads:** server-side rasterization dimensions are not controllable — for reliable coordinates, rasterize pages yourself and use image blocks. See [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md).
- Spatial reasoning is approximate — verify before production use.

---

## Optimization

| Practice | Why |
|----------|-----|
| Pre-resize to model limits | Lower latency; predictable coordinates |
| JPEG/WebP compression (careful) | Smaller payloads; avoid heavy artifacts on text |
| Files API `file_id` in long threads | History re-send without base64 bloat |
| `cache_control` on static image prefix | Repeat Q&A on same screenshot |
| [count_tokens](./ANTHROPIC_TOKEN_COUNTING.md) preflight | Avoid context / request-size overflow |
| Downsample before batch ingest | [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) |

---

## Limitations (platform)

| Area | Note |
|------|------|
| People identification | Refused per AUP |
| Low quality / rotated / &lt;200 px | Higher error rate |
| Spatial / counting | Approximate — verify outputs |
| AI-generated detection | Unreliable |
| Inappropriate content | Refused per AUP |
| Medical CT/MRI | Not for diagnosis — human review required |

Full list: [platform limitations](https://platform.claude.com/docs/en/docs/build-with-claude/vision#limitations). Same constraints apply to [PDF vision](./ANTHROPIC_PDF_SUPPORT.md).

---

## Fork use cases

| Scenario | Pattern |
|----------|---------|
| Chart / screenshot Q&A | Sonnet + image block(s) + Japanese question |
| Multi-image compare | `Image 1:` / `Image 2:` labels + single user turn |
| RAG chart enrichment | Batch + shared image prefix + cache |
| PDF with coordinates | Self-rasterize pages → image blocks (not document block) |
| Opus aggregate | Text-only AS-IS; escalate vision to Sonnet |

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `modalities` includes `vision` | Sonnet AS-IS |
| `apiFeatures.visionSupport` | Limits, token math, sources |
| `prompting.guidanceTopics[]` | See below |

| Topic slug | Focus |
|------------|-------|
| `vision-image-blocks` | `type: image` + text question |
| `vision-source-url-base64-file` | Three source types |
| `vision-limits-token-cost` | Count caps, 28×28 patches, resize |
| `vision-prompt-placement` | Image before text; multi-image labels |
| `vision-coordinates-bounding-box` | Pixel coords, pre-resize, PDF caveat |
| `vision-multi-image-comparison` | Compare/contrast multi-turn patterns |
| `vision-high-resolution-migration` | Opus 4.7+ 2576/4784 limits |

---

## AS-IS gaps

- `claude-adapter.ts` does not send `image` blocks.
- Files API beta not integrated.
- High-resolution vision not applicable until catalog model upgrade.

---

## Backlog

- **B-0** — Messages API path with `image` blocks on Sonnet agent routes.
- **F-10** — Inject `vision-limits-token-cost` when attachment exceeds thresholds.

---

## References

- [Vision (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/vision)
- [Evaluate image size](https://platform.claude.com/docs/en/docs/build-with-claude/vision#evaluate-image-size)
- [Files API](https://platform.claude.com/docs/en/docs/build-with-claude/files)
- [Cookbook — multimodal/getting-started-with-vision](https://platform.claude.com/cookbook/multimodal-getting-started-with-vision)
- [Cookbook — multimodal/best-practices-for-vision](https://platform.claude.com/cookbook/multimodal-best-practices-for-vision)
- [Cookbook — multimodal/reading-charts-graphs-powerpoints](https://platform.claude.com/cookbook/multimodal-reading-charts-graphs-powerpoints)
- [Cookbook — multimodal/how-to-transcribe-text](https://platform.claude.com/cookbook/multimodal-how-to-transcribe-text)
