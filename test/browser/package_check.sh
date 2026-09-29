#!/bin/sh
# Click-through of the landing page from a clean copy of dist/.  usage: sh test/browser/package_check.sh [dist-dir]
D="$(cd "$(dirname "$0")" && pwd)"; SRC="${1:-$D/../../dist}"; T="$(mktemp -d)"; cp "$SRC"/*.html "$T"/
python3 "$D/qa_package.py" "$T"; RC=$?; rm -rf "$T"; exit $RC
