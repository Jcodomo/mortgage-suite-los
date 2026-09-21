#!/usr/bin/env python3
"""Build the distributable Release 53.1 files from the supplied snapshot."""

from pathlib import Path


root = Path(__file__).resolve().parent.parent
source = root / "archive" / "mortgage-suite-los-v53.1.html"
out = source.read_text(encoding="utf-8")

out = out.replace(
    '<meta name="los-release" content="50.4">',
    '<meta name="los-release" content="53.1">',
    1,
)
out = out.replace(
    '<title>Mortgage Suite v50.4 &mdash; Income Calculator &amp; Loan Suite</title>',
    '<title>Mortgage Suite v53.1 &mdash; Income Calculator &amp; Loan Suite</title>',
    1,
)
stamp = (
    '<script id="los-release-53-stamp">'
    'document.documentElement.setAttribute("data-los-release","53.1");'
    'window.LOS_RELEASE="53.1";'
    '</script>\n'
)
close = out.rfind("</body>")
if close < 0:
    raise RuntimeError("Release snapshot is missing the final </body> tag")
out = out[:close] + stamp + out[close:]

dist = root / "dist"
dist.mkdir(exist_ok=True)
for name in ("mortgage-suite-los.html", "mortgage-suite-los-v53.1.html"):
    (dist / name).write_text(out, encoding="utf-8")

print(f"Built Release 53.1 ({len(out.encode('utf-8'))} bytes)")
