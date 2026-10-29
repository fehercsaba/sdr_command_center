#!/usr/bin/env python3
"""Build SDR Command Center Lite for one person.

Joins the page parts in assets/page (in file-name order) into one HTML file and,
optionally, inserts a seed (company setup + playbook) the page reads on first open.

Usage:
  python prepare_desk.py seed.json OUTPUT.html   # page with a prepared setup
  python prepare_desk.py - OUTPUT.html           # plain page, no seed
No network access; reads only files inside this skill and the seed you pass.
"""
import datetime
import json
import pathlib
import re
import sys

PAGE_DIR = pathlib.Path(__file__).resolve().parent.parent / "assets" / "page"
MARKER = '<script type="application/json" id="sdr-seed">{}</script>'
KEYS = ["who", "opener", "pitch", "discovery", "objections", "competitors", "close", "voicemail", "email", "linkedin", "rules"]
CHOICES = {
    "crm": {"hubspot", "salesforce", "pipedrive", "close", "other", "none"},
    "dialer": {"tel", "aircall", "ringcentral", "dialpad", "zoom", "teams", "other"},
    "mail": {"mailto", "gmail", "outlook"},
    "seq": {"instantly", "apollo", "lemlist", "outreach", "salesloft", "hubspot", "none"},
    "data": {"apollo", "lusha", "cognism", "zoominfo", "salesnav", "clay", "other"},
    "callMode": {"tel", "web", "copy"},
}
TOKENS = {"first_name", "last_name", "company", "title", "my_name", "my_company", "my_website", "booking_link", "slot1", "slot2"}


def page_html() -> str:
    parts = sorted(p for p in PAGE_DIR.iterdir() if p.is_file() and re.match(r"^\d\d-", p.name))
    return "".join(p.read_text(encoding="utf-8") for p in parts)


def sections(pb):
    if isinstance(pb, dict) and isinstance(pb.get("sections"), list):
        return {s.get("k"): str(s.get("body", "")) for s in pb["sections"] if isinstance(s, dict)}
    if isinstance(pb, dict):
        return {k: v for k, v in pb.items() if isinstance(v, str)}
    return {}


def check(seed):
    warn = []
    st = seed.get("settings") or {}
    for k in ("name", "company", "website"):
        if not str(st.get(k, "")).strip():
            warn.append(f"settings.{k} is empty")
    if st.get("website") and not re.match(r"^https?://", str(st["website"])):
        st["website"] = "https://" + str(st["website"]).lstrip("/")
    seed["settings"] = st
    for k, allowed in CHOICES.items():
        v = (seed.get("stack") or {}).get(k)
        if v and v not in allowed:
            warn.append(f"stack.{k}={v!r} is not one of {sorted(allowed)} – the page will ignore it")
    secs = sections(seed.get("playbook"))
    filled = {k for k, v in secs.items() if v.strip()}
    if not secs:
        warn.append("no playbook – the person will build one in the setup guide")
    else:
        missing = [k for k in KEYS if k not in filled]
        if missing:
            warn.append("playbook sections missing: " + ", ".join(missing))
        joined = "\n".join(secs.values()) + "\n" + json.dumps(seed.get("script") or {})
        for t in sorted(set(re.findall(r"\{([a-z_0-9]+)\}", joined)) - TOKENS):
            warn.append(f"unknown placeholder {{{t}}} – it will show as plain text")
        for p in sorted(set(re.findall(r"\[[^\]\n]{3,40}\]", joined))):
            warn.append(f"unfilled placeholder {p}")
        if "email" in filled and not re.match(r"^\s*subject\s*:", secs["email"], re.I):
            warn.append("the email section should start with 'Subject: …'")
    return warn, len(filled)


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    html = page_html()
    if html.count(MARKER) != 1:
        print("ERROR: page parts are incomplete or edited – reinstall the skill")
        return 1
    out = pathlib.Path(sys.argv[2])
    out.parent.mkdir(parents=True, exist_ok=True)
    if sys.argv[1] == "-":
        out.write_text(html, encoding="utf-8")
        print(f"Wrote {out} ({out.stat().st_size // 1024} KB), no seed")
        return 0
    seed = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    if not isinstance(seed, dict):
        print("ERROR: the seed must be a JSON object")
        return 1
    warn, n = check(seed)
    seed.setdefault("seedId", datetime.datetime.now().strftime("seed-%Y%m%d-%H%M%S"))
    payload = json.dumps(seed, ensure_ascii=False).replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
    out.write_text(html.replace(MARKER, f'<script type="application/json" id="sdr-seed">{payload}</script>'), encoding="utf-8")
    st = seed["settings"]
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB), seedId={seed['seedId']}")
    print(f"Company: {st.get('company') or '—'} | website: {st.get('website') or '—'} | playbook sections: {n}/{len(KEYS)}")
    for w in warn:
        print("WARNING:", w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
