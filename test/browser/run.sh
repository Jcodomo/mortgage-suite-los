#!/bin/sh
# Functional regression battery.  usage: sh test/browser/run.sh <path-to-built-html>
# Needs: python3, playwright (pip install playwright && playwright install chromium)
F="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; D="$(cd "$(dirname "$0")" && pwd)"; RC=0
run(){ timeout -s KILL "$1" python3 "$D/$2" "$F" $3 || RC=1; }
run 200 qa_calc.py
run 200 qa_math.py
run 500 qa_nav.py
run 900 sweep.py "suite -"
run 900 sweep.py "income -"
exit $RC
