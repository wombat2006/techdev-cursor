#!/usr/bin/env python3
"""Normalize glossary adopt/hold JSON — absolute paths to portable relative refs."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def rel_to_repo(repo_root: Path, value: str) -> str:
    path = Path(value)
    try:
        return path.resolve().relative_to(repo_root.resolve()).as_posix()
    except ValueError:
        return value


def rel_to_platform_sibling(platform_root: Path, value: str) -> str:
    path = Path(value)
    try:
        rel = path.resolve().relative_to(platform_root.resolve())
        return f"../term-prep-platform/{rel.as_posix()}"
    except ValueError:
        resolved = str(path.resolve())
        prefix = str(platform_root.resolve())
        if resolved.startswith(prefix + os.sep):
            return "../term-prep-platform/" + resolved[len(prefix) + 1 :].replace(os.sep, "/")
        return value


def normalize_doc(doc: dict, repo_root: Path, platform_root: Path) -> None:
    morph = doc.get("morphology")
    if isinstance(morph, dict) and morph.get("dicdir"):
        morph["dicdir"] = rel_to_platform_sibling(platform_root, morph["dicdir"])

    files = doc.get("corpus_files")
    if isinstance(files, list):
        doc["corpus_files"] = [rel_to_repo(repo_root, f) for f in files]


def main(argv: list[str] | None = None) -> int:
    repo_root = Path(__file__).resolve().parents[1]
    platform_root = Path(
        os.environ.get("TERM_PREP_PLATFORM_ROOT", repo_root / "../term-prep-platform")
    ).resolve()

    targets = argv if argv is not None else sys.argv[1:]
    if not targets:
        targets = ["meta/glossary-adopt.json", "meta/glossary-hold.json"]

    for rel in targets:
        path = (repo_root / rel).resolve()
        if not path.is_file():
            print(f"skip (missing): {rel}", file=sys.stderr)
            continue
        with path.open(encoding="utf-8") as fh:
            doc = json.load(fh)
        normalize_doc(doc, repo_root, platform_root)
        with path.open("w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"normalized: {rel}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
