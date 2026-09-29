# QA report, release 54

Run in Chromium 141 (Playwright), `file://`, clean profile, against `dist/mortgage-suite-los.html`.

| Suite | Result |
|---|---|
| Income Calculator known-answer tests (`qa_calc.py`) | 41 / 41 |
| Loan Suite independent math (`qa_math.py`) | 23 / 23 |
| Navigation and regression (`qa_nav.py`) | 52 / 52 |
| Loan Suite sweep: 237 dropdown options, 589 typed entries, 14 pages | 0 errors, 0 leaks |
| Income Calculator sweep: 86 options, 1,341 entries, 9 tabs (records added on empty tabs) | 0 errors, 0 leaks |
| Package click-through from a clean copy (`qa_package.py`) | 14 / 14 |
| Node structural tests | 8 / 8 |

## What the math tests cover
FHA (base loan, 1.75% UFMIP, 0.55% MIP on the base, P&I on the total), Conventional 80% and 95% LTV (P&I; PMI self-consistency and plausibility), 203(k) default file, freeform entry, live-update latency (rail, KPI strip, LTV card and header chips all update in about 110-225 ms), pay-frequency conversions, YTD / YTD+12 / YTD+24, the auto-recommendation rule, Schedule C (recent, 24-month, lower-of, auto), Schedule E (full year, partial year, month cap, 75% lease method), gross-up, asset depletion, front and back DTI, plus edge cases that must stay finite (blank dates, hire date after paystub, negatives, text, huge values).

## Limits
- **HomeStyle** and the renovation draw tiers were verified in an earlier session by independent arithmetic but are not in this automated suite.
- The sweeps skip disabled controls (for example "Calculation Method, locked by Auto") and date inputs, and some pages expose no editable controls (Summary, Advanced, Contract & LE in the Loan Suite).
- Parsers (contract, Loan Estimate, AUS, credit report) were exercised by earlier sessions against real documents, not by this suite.
- Performance figures come from one machine with a sandboxed network. Run-to-run variance is 10-30%; use `perf.py` several times and compare medians. Network effects of the deferred CDN libraries are not captured.
- Rates shown as "seed" (Mortgage Rates page) are stale placeholders until pulled online.
- The agency guideline text and 2026 tax tables are reference data and should be re-checked each January.
