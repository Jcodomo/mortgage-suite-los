#!/usr/bin/env python3
"""Rebuild dist/mortgage-suite-los.html from the v48 file plus the Release 50 layer.

Usage:  python3 tools/build-release-50.py
The layer is appended just before </body>; nothing else in the file changes.
"""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
base = (root / "archive" / "mortgage-suite-los-v48.html").read_text(encoding="utf-8")
css = (root / "src" / "release-50" / "release-50.css").read_text(encoding="utf-8")
js = (root / "src" / "release-50" / "release-50.js").read_text(encoding="utf-8")

block = (
    "<!-- ===== RELEASE 50 — WORKBENCH LAYOUT ===== -->\n"
    '<style id="los-release-50">\n' + css + "\n</style>\n"
    '<script id="los-release-50-js">\n' + js + "\n</script>\n"
)
i = base.rindex("</body>")
out = base[:i] + block + base[i:]
out = out.replace(
    "<title>Mortgage Suite &mdash; Income Calculator &amp; Renovation Engine</title>",
    "<title>Mortgage Suite v50 &mdash; Income Calculator &amp; Loan Suite</title>", 1)
out = out.replace("<head>", '<head>\n<meta name="los-release" content="50">', 1)

for name in ("mortgage-suite-los.html", "mortgage-suite-los-v50.html"):
    (root / "dist" / name).write_text(out, encoding="utf-8")
print("Built dist/mortgage-suite-los.html (%d bytes)" % len(out.encode("utf-8")))
