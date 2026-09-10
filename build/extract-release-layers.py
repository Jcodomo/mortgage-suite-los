#!/usr/bin/env python3
"""Extract self-contained V26-V34 CSS/JS layers from a supplied release HTML."""
from pathlib import Path
import re
import sys


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: extract-release-layers.py RELEASE_HTML OUTPUT_SRC_DIR")
    source = Path(sys.argv[1]).read_text(encoding="utf-8")
    output = Path(sys.argv[2])
    output.mkdir(parents=True, exist_ok=True)
    for version in range(26, 35):
        block_match = re.search(
            rf"<!-- ===== V{version} LAYER BEGIN ===== -->(.*?)<!-- ===== V{version} LAYER END ===== -->",
            source,
            flags=re.S,
        )
        if not block_match:
            raise SystemExit(f"V{version} layer markers not found")
        block = block_match.group(1)
        css_match = re.search(r"<style>\s*(.*?)\s*</style>", block, flags=re.S)
        js_match = re.search(r"<script>\s*(.*?)\s*</script>", block, flags=re.S)
        if not css_match or not js_match:
            raise SystemExit(f"V{version} CSS or JS block not found")
        (output / f"patch-v{version}.css").write_text(css_match.group(1) + "\n", encoding="utf-8")
        (output / f"patch-v{version}.js").write_text(js_match.group(1) + "\n", encoding="utf-8")
        print(f"extracted V{version}")


if __name__ == "__main__":
    main()
