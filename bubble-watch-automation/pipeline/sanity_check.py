#!/usr/bin/env python3
"""Sanity-gate the freshly generated Bubble Watch summary before deploy/post.

Checks (any failure => exit 1, caller must alert and STOP):
  1. value is an integer 0-100
  2. week-over-week change in the Index is <= 15 (bigger jump = likely a data
     glitch, e.g. a stale or percent-vs-decimal feed)
  3. CAPE is in a sane 20-60 range

Usage:
  sanity_check.py --summary <path> [--prev-value N] [--cape X]
    --prev-value  last week's Index (caller captures it BEFORE phase 1
                  overwrites summary.json); omit on the very first run
    --cape        CAPE as printed by the weekly runner; REQUIRED — if the
                  caller can't extract it, that itself is a stop condition
"""

import argparse
import json
import sys
from pathlib import Path


def fail(msg: str) -> None:
    print(f"SANITY FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--summary", required=True)
    ap.add_argument("--prev-value", type=float, default=None)
    ap.add_argument("--cape", type=float, default=None)
    args = ap.parse_args()

    summary = json.loads(Path(args.summary).expanduser().read_text())

    value = summary.get("value")
    if not isinstance(value, int) or isinstance(value, bool) or not (0 <= value <= 100):
        fail(f"value must be an integer 0-100, got {value!r}")

    if not summary.get("as_of"):
        fail("as_of missing from summary")

    if args.prev_value is not None:
        delta = abs(value - args.prev_value)
        if delta > 15:
            fail(f"week-over-week jump {delta:.0f} > 15 "
                 f"(prev {args.prev_value:.0f} -> now {value}) — possible data glitch")
    else:
        print("sanity: no previous value available; skipping WoW check", file=sys.stderr)

    if args.cape is None:
        fail("CAPE not provided — could not extract it from the runner output")
    if not (20 <= args.cape <= 60):
        fail(f"CAPE {args.cape} outside sane 20-60 range")

    print(f"sanity OK: value={value} as_of={summary['as_of']} cape={args.cape}")


if __name__ == "__main__":
    main()
