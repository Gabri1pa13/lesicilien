#!/usr/bin/env python3
"""
Static-site sanity checks for lesicilien.it.

Runs on every push/PR (see .github/workflows/site-checks.yml). Catches the
class of bugs that has repeatedly slipped into this hand-authored HTML site:
broken internal links (wrong/deprecated slugs, stray language prefixes) and
malformed JSON-LD structured data. It does not need a build step or any
secrets, so it runs the same locally as in CI:

    python3 scripts/check_site.py

Exits non-zero (and prints every problem found) if anything is broken.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SKIP_DIR_PARTS = {"node_modules", ".git", ".next", ".open-next", "supabase"}

HREF_RE = re.compile(r'href=["\']([^"\']+)["\']')
JSONLD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
SCRIPT_OPEN_RE = re.compile(r"<script\b", re.I)
SCRIPT_CLOSE_RE = re.compile(r"</script>", re.I)


def all_html_files():
    for path in glob.glob("**/*.html", recursive=True):
        if any(part in SKIP_DIR_PARTS for part in path.split(os.sep)):
            continue
        yield path


def load_redirect_sources():
    sources = set()
    redirects_path = os.path.join(ROOT, "_redirects")
    if not os.path.exists(redirects_path):
        return sources
    with open(redirects_path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if parts:
                sources.add(parts[0].rstrip("/"))
    return sources


def local_path_exists(url_path):
    """A path like /stays/urban-retreat/ resolves if stays/urban-retreat/index.html
    (or stays/urban-retreat.html, or a matching static file) exists."""
    clean = url_path.split("#")[0].split("?")[0]
    if clean in ("", "/"):
        return True
    rel = clean.lstrip("/")
    candidates = [
        rel,
        os.path.join(rel, "index.html"),
        rel.rstrip("/") + ".html",
    ]
    return any(os.path.exists(os.path.join(ROOT, c)) for c in candidates)


def check_links(errors):
    redirect_sources = load_redirect_sources()
    for path in all_html_files():
        with open(path, encoding="utf-8") as fh:
            content = fh.read()
        for href in HREF_RE.findall(content):
            if not href.startswith("/") or href.startswith("//"):
                continue  # only check same-site absolute paths
            if href.startswith(("/api/", "/admin")):
                continue  # app routes, not static files
            clean = href.rstrip("/")
            if clean in redirect_sources:
                continue
            if local_path_exists(href):
                continue
            errors.append(f"{path}: broken internal link {href!r} (no matching page and no _redirects entry)")


def check_jsonld(errors):
    for path in all_html_files():
        with open(path, encoding="utf-8") as fh:
            content = fh.read()
        for block in JSONLD_RE.findall(content):
            try:
                json.loads(block)
            except json.JSONDecodeError as e:
                errors.append(f"{path}: invalid JSON-LD ({e})")


def check_script_balance(errors):
    for path in all_html_files():
        with open(path, encoding="utf-8") as fh:
            content = fh.read()
        opens = len(SCRIPT_OPEN_RE.findall(content))
        closes = len(SCRIPT_CLOSE_RE.findall(content))
        if opens != closes:
            errors.append(f"{path}: unbalanced <script> tags ({opens} opening vs {closes} closing)")


def main():
    errors = []
    check_links(errors)
    check_jsonld(errors)
    check_script_balance(errors)

    if errors:
        print(f"❌ {len(errors)} issue(s) found:\n")
        for e in errors:
            print(" -", e)
        sys.exit(1)

    print("✅ All site checks passed.")


if __name__ == "__main__":
    main()
