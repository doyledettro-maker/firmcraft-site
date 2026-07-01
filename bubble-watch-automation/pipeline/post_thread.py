#!/usr/bin/env python3
"""Compose and post the weekly Bubble Watch thread to @PredictiumAI.

Stdlib-only (no pip deps): OAuth 1.0a HMAC-SHA1 is implemented by hand so this
runs on a bare macOS python3 from cron/launchd.

Data sources (never hardcode numbers):
  - summary.json  (deployed): value, zone, mag7, saas, drawdown, as_of
  - snapshot      content/bubble-watch/<as_of>.json: bubble_index.what_moved,
                  bubble_index.lead, mag7.label, saaspocalypse.fork,
                  saaspocalypse.stats

Honesty rules (hard-enforced by lint before any post):
  - drawdown figure is a measured historical base rate, never a forecast
  - SaaS cyclical/structural split is an editorial estimate, not a model output
  - the Bubble Index is a scored read of current conditions, not a prediction
  - no hype, no doom; never invent numbers

Usage:
  post_thread.py --dry-run                      # compose + print, post nothing
  post_thread.py --image _tweet/bubble-watch-<as_of>.png
  post_thread.py --force                        # ignore the already-posted state file
"""

import argparse
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime
from pathlib import Path

HOME = Path.home()
DEFAULT_SUMMARY = "https://www.predictium.ai/data/bubble-watch/summary.json"
DEFAULT_SNAPSHOT_DIR = HOME / "source/predictium/40pfrom3/frontend/content/bubble-watch"
DEFAULT_STATE_FILE = HOME / ".openclaw/state/bubble-watch-last-posted.txt"
DEFAULT_TOOLS_MD = HOME / ".openclaw/workspace/TOOLS.md"
TWEET_URL = "https://www.predictium.ai/bubble-watch"

BANNED = [
    "we predict", "likely to crash", "crash is coming", "will crash",
    "chance of a crash", "guaranteed", "imminent",
]
BANNED_RE = re.compile(r"\d+(\.\d+)?%\s*(chance|probability|odds)", re.I)


def alert(msg: str) -> None:
    """Best-effort alert: stderr always, Slack webhook if configured."""
    sys.stderr.write(f"[ALERT] {msg}\n")
    hook = os.environ.get("SLACK_WEBHOOK_URL", "")
    if hook:
        try:
            req = urllib.request.Request(
                hook,
                data=json.dumps({"text": f":rotating_light: Bubble Watch: {msg}"}).encode(),
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(req, timeout=15)
        except Exception as e:  # alerting must never crash the alerter
            sys.stderr.write(f"[ALERT] slack webhook failed: {e}\n")


# ---------------------------------------------------------------- data loading

def load_json(src: str):
    if src.startswith("http://") or src.startswith("https://"):
        with urllib.request.urlopen(src, timeout=30) as r:
            return json.loads(r.read().decode())
    return json.loads(Path(src).expanduser().read_text())


def dig(obj, path, default=None):
    cur = obj
    for key in path.split("."):
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur[key]
    return cur


# ------------------------------------------------------------- composition

def tweet_len(text: str) -> int:
    """Approximate X weighted length: URLs count as 23, emoji as 2."""
    n = 0
    for chunk in re.split(r"(https?://\S+)", text):
        if chunk.startswith("http"):
            n += 23
        else:
            n += sum(2 if ord(c) > 0x1F000 else 1 for c in chunk)
    return n


def one_clause(text: str, cap: int = 110) -> str:
    """Trim what_moved to a single clause."""
    if not text:
        return ""
    clause = re.split(r"[;.]\s", text.strip())[0].strip().rstrip(".;")
    if len(clause) > cap:
        clause = clause[: cap - 1].rsplit(" ", 1)[0] + "…"
    return clause


def pct(x) -> str:
    return f"{round(float(x) * 100)}%"


def compose_thread(summary: dict, snapshot: dict, dry_run: bool) -> list:
    as_of = summary["as_of"]
    value = summary["value"]
    zone = summary["zone"]
    mag7 = summary["mag7"]
    drawdown = summary["drawdown"]

    def snap(path, label):
        v = dig(snapshot, path)
        if v is None:
            if dry_run:
                return f"⟨{label} unavailable in this environment⟩"
            raise SystemExit(f"snapshot field missing: {path} — refusing to post")
        return v

    what_moved = one_clause(str(snap("bubble_index.what_moved", "what_moved")))
    mag7_label = snap("mag7.label", "mag7.label")
    fork_c = dig(snapshot, "saaspocalypse.fork.cyclical")
    fork_s = dig(snapshot, "saaspocalypse.fork.structural")
    sp_weight = dig(snapshot, "saaspocalypse.stats.sp_weight") or dig(snapshot, "mag7.stats.sp_weight")

    if (fork_c is None or fork_s is None) and not dry_run:
        raise SystemExit("saaspocalypse.fork missing — refusing to post")
    fork_txt = (
        f"{pct(fork_c)} cyclical vs {pct(fork_s)} structural"
        if fork_c is not None and fork_s is not None
        else "⟨fork unavailable⟩ cyclical vs ⟨fork unavailable⟩ structural"
    )

    date_h = datetime.strptime(as_of, "%Y-%m-%d").strftime("%B %-d")
    # deterministic per-week variant so the connective wording rotates
    v = int(hashlib.sha256(as_of.encode()).hexdigest(), 16)

    open_lines = [
        "How stretched are US markets? Our weekly scored read.",
        "Our weekly, transparently-scored read on how stretched US markets are.",
        "One number for how stretched US markets look right now — scored, not vibes.",
    ]
    t1 = (
        f"📊 Bubble Watch — {date_h}\n"
        f"{open_lines[v % 3]}\n"
        f"Bubble Index: {value}/100 — {zone}.\n"
        f"{what_moved}\n"
        f"A thread 🧵"
    )

    t2_tails = [
        "That's a base rate, not a forecast. We tested — no public signal reliably times it.",
        "A base rate, not a forecast: we back-tested, and no public signal reliably times drawdowns.",
        "That's history, not a prediction. We checked — nothing public reliably times it.",
    ]
    t2 = (
        "\"Is a crash coming?\" We don't claim to know — and neither does anyone, honestly.\n"
        f"Historically a ≥20% S&P drawdown has occurred within 12 months ~{drawdown.lstrip('~')} of the time.\n"
        f"{t2_tails[v % 3]}"
    )

    conc = f"Concentration: ~{sp_weight} of the S&P, and still earnings-backed." if sp_weight else \
        ("⟨stats.sp_weight unavailable⟩" if dry_run else None)
    if conc is None:
        raise SystemExit("stats.sp_weight missing — refusing to post")
    t3 = (
        f"The AI engine: Mag 7 Heat {mag7}/100 — {mag7_label}.\n"
        f"{conc}"
    )

    t4_leads = [
        "The AI casualty: per-seat software. Our read on the selloff —",
        "On the other side of the AI trade: per-seat software. Our read on the selloff —",
        "The AI casualty is per-seat software. How much of the selloff is permanent? Our read —",
    ]
    t4 = (
        f"{t4_leads[v % 3]}\n"
        f"{fork_txt}.\n"
        f"(Our editorial estimate, not a model.)"
    )

    t5_leads = [
        "Full breakdown — every bucket, the methodology, the weekly archive, all transparent:",
        "Every bucket scored, methodology open, weekly archive public:",
        "The full picture — all buckets, the scoring, the archive, nothing hidden:",
    ]
    t5 = f"{t5_leads[v % 3]}\n{TWEET_URL}\nNew reading every week."

    return [t1, t2, t3, t4, t5]


def lint_thread(tweets: list) -> list:
    problems = []
    for i, t in enumerate(tweets, 1):
        n = tweet_len(t)
        if n > 275:
            problems.append(f"tweet {i} too long ({n} weighted chars)")
        low = t.lower()
        for phrase in BANNED:
            if phrase in low:
                problems.append(f"tweet {i} contains banned phrase: {phrase!r}")
        if BANNED_RE.search(t):
            problems.append(f"tweet {i} phrases the base rate as a probability forecast")
    return problems


# ------------------------------------------------------------- twitter client

def load_creds(tools_md: Path) -> dict:
    """Env vars win; otherwise best-effort parse of TOOLS.md X/Twitter section."""
    env_map = {
        "consumer_key": "X_CONSUMER_KEY",
        "consumer_secret": "X_CONSUMER_SECRET",
        "access_token": "X_ACCESS_TOKEN",
        "access_secret": "X_ACCESS_TOKEN_SECRET",
    }
    creds = {k: os.environ.get(v, "") for k, v in env_map.items()}
    if all(creds.values()):
        return creds

    text = ""
    if tools_md.exists():
        text = tools_md.read_text()
        # narrow to the X/Twitter section if headers exist
        m = re.search(r"^#+.*\b(x|twitter)\b.*$", text, re.I | re.M)
        if m:
            rest = text[m.end():]
            nxt = re.search(r"^#+ ", rest, re.M)
            text = rest[: nxt.start()] if nxt else rest

    label_map = {
        "consumer_key": r"(api|consumer)[ _]?key",
        "consumer_secret": r"(api|consumer)[ _]?(key )?secret",
        "access_token": r"access[ _]?token(?![ _]?secret)",
        "access_secret": r"access[ _]?(token[ _]?)?secret",
    }
    for field, pat in label_map.items():
        if creds[field]:
            continue
        m = re.search(pat + r"\s*[:=]?\s*[`\"']?([A-Za-z0-9\-_]{15,})", text, re.I)
        if m:
            creds[field] = m.group(m.lastindex)

    missing = [k for k, v in creds.items() if not v]
    if missing:
        raise SystemExit(
            f"missing Twitter credentials: {missing}. Export "
            f"{', '.join(env_map[k] for k in missing)} or check {tools_md}"
        )
    return creds


def oauth1_header(creds: dict, method: str, url: str, extra_params: dict = None) -> str:
    oauth = {
        "oauth_consumer_key": creds["consumer_key"],
        "oauth_nonce": uuid.uuid4().hex + secrets.token_hex(4),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": creds["access_token"],
        "oauth_version": "1.0",
    }
    enc = lambda s: urllib.parse.quote(str(s), safe="")
    sig_params = dict(oauth)
    sig_params.update(extra_params or {})
    param_str = "&".join(f"{enc(k)}={enc(v)}" for k, v in sorted(sig_params.items()))
    base = f"{method.upper()}&{enc(url)}&{enc(param_str)}"
    key = f"{enc(creds['consumer_secret'])}&{enc(creds['access_secret'])}"
    oauth["oauth_signature"] = base64.b64encode(
        hmac.new(key.encode(), base.encode(), hashlib.sha1).digest()
    ).decode()
    return "OAuth " + ", ".join(f'{enc(k)}="{enc(v)}"' for k, v in sorted(oauth.items()))


def api_request(creds: dict, method: str, url: str, *, json_body=None,
                form=None, files=None):
    headers = {}
    data = None
    if json_body is not None:
        headers["Authorization"] = oauth1_header(creds, method, url)
        headers["Content-Type"] = "application/json"
        data = json.dumps(json_body).encode()
    elif files:
        # multipart: body params are excluded from the OAuth1 signature
        headers["Authorization"] = oauth1_header(creds, method, url)
        boundary = uuid.uuid4().hex
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        parts = []
        for k, v in (form or {}).items():
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
            )
        for k, (fname, blob) in files.items():
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"; "
                f"filename=\"{fname}\"\r\nContent-Type: application/octet-stream\r\n\r\n".encode()
                + blob + b"\r\n"
            )
        parts.append(f"--{boundary}--\r\n".encode())
        data = b"".join(parts)
    elif form is not None:
        headers["Authorization"] = oauth1_header(creds, method, url, form)
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        data = urllib.parse.urlencode(form).encode()
    else:
        headers["Authorization"] = oauth1_header(creds, method, url)

    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode()
        return json.loads(body) if body else {}


def upload_media(creds: dict, image: Path):
    """v1.1 chunked-less media upload. Returns media_id string or None."""
    url = "https://upload.twitter.com/1.1/media/upload.json"
    try:
        resp = api_request(creds, "POST", url,
                           files={"media": (image.name, image.read_bytes())})
        return str(resp["media_id"])
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:500]
        alert(f"media upload failed (HTTP {e.code}) — likely a Free-tier limit; "
              f"posting text-only. Consider Basic tier (~$100/mo) for images. {body}")
        return None


def post_tweet(creds: dict, text: str, media_id=None, reply_to=None) -> str:
    body = {"text": text}
    if media_id:
        body["media"] = {"media_ids": [media_id]}
    if reply_to:
        body["reply"] = {"in_reply_to_tweet_id": reply_to}
    resp = api_request(creds, "POST", "https://api.twitter.com/2/tweets", json_body=body)
    return resp["data"]["id"]


# --------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--summary", default=DEFAULT_SUMMARY,
                    help="summary.json path or URL (default: live site)")
    ap.add_argument("--snapshot", default=None,
                    help="snapshot json path (default: <frontend>/content/bubble-watch/<as_of>.json)")
    ap.add_argument("--image", default=None, help="PNG to attach to tweet 1")
    ap.add_argument("--state-file", default=str(DEFAULT_STATE_FILE))
    ap.add_argument("--tools-md", default=str(DEFAULT_TOOLS_MD))
    ap.add_argument("--dry-run", action="store_true",
                    help="compose + print the thread; post nothing")
    ap.add_argument("--force", action="store_true",
                    help="post even if the state file matches this as_of")
    args = ap.parse_args()

    summary = load_json(args.summary)
    as_of = summary["as_of"]

    state_file = Path(args.state_file).expanduser()
    if not args.dry_run and not args.force and state_file.exists() \
            and state_file.read_text().strip() == as_of:
        print(f"already posted for {as_of}; skipping (use --force to override)")
        return 0

    snap_path = args.snapshot or str(DEFAULT_SNAPSHOT_DIR / f"{as_of}.json")
    try:
        snapshot = load_json(snap_path)
    except (FileNotFoundError, OSError):
        if not args.dry_run:
            alert(f"snapshot not found at {snap_path} — refusing to post")
            return 1
        snapshot = {}

    tweets = compose_thread(summary, snapshot, args.dry_run)
    problems = lint_thread(tweets)

    print(f"=== Bubble Watch thread for {as_of} ===")
    for i, t in enumerate(tweets, 1):
        print(f"\n--- tweet {i}/{len(tweets)} ({tweet_len(t)} chars)"
              f"{' [image attached]' if i == 1 and args.image else ''} ---")
        print(t)
    if problems:
        for p in problems:
            print(f"LINT FAIL: {p}", file=sys.stderr)
        if not args.dry_run:
            alert(f"thread failed lint for {as_of}: {problems} — not posted")
        return 1

    if args.dry_run:
        print("\n[dry-run] nothing posted.")
        return 0

    creds = load_creds(Path(args.tools_md).expanduser())

    media_id = None
    if args.image:
        img = Path(args.image).expanduser()
        if img.exists():
            media_id = upload_media(creds, img)
        else:
            alert(f"image {img} missing — posting text-only")

    ids = []
    for i, text in enumerate(tweets):
        for attempt in range(3):
            try:
                tid = post_tweet(creds, text,
                                 media_id=media_id if i == 0 else None,
                                 reply_to=ids[-1] if ids else None)
                ids.append(tid)
                break
            except urllib.error.HTTPError as e:
                body = e.read().decode(errors="replace")[:500]
                if attempt == 2:
                    alert(f"tweet {i+1} failed after retries (HTTP {e.code}): {body}. "
                          f"Posted so far: {ids}")
                    return 1
                time.sleep(5 * (attempt + 1))
        time.sleep(2)

    url = f"https://x.com/PredictiumAI/status/{ids[0]}"
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(as_of + "\n")
    print(f"\nposted thread: {url}  (media: {'yes' if media_id else 'text-only'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
