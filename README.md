# Mortgage Suite

A browser-based mortgage workstation in a single, self-contained HTML file:

- **Income Calculator** — W-2, Schedule C, partnership and corporate, Schedule E, other income, asset depletion, PITIA and DTI, document OCR, AUS findings, underwriting summary and agency guidelines.
- **Loan Suite** — FHA 203(k) and HomeStyle renovation engine, maximum mortgage (HUD-92700), mortgage rates, closing costs with New York rules, escrow, tax proration, qualification, rental, credit, contract and Loan Estimate readers, scenarios, summaries and document generators.

Everything runs in the browser. No server, no build step to use it, and no data leaves the machine.

## Open it

- **Hosted:** enable GitHub Pages on this repository (Settings → Pages → Deploy from branch → `main`, folder `/root`). The root `index.html` forwards to `dist/mortgage-suite-los.html`.
- **Local:** download `dist/mortgage-suite-los.html` and open it in Chrome, Edge, Safari or Firefox.

## Release 53.1 — stable workbench navigation

Release 53.1 retains the Release 50 workbench and gives each navigation row one stable icon owner: the established Release 50 masked icons for Loan Suite page tabs, and SVG icons for Income Calculator tabs. It also preserves the expanded document-routing and OCR workflow introduced after Release 50.

The Loan Suite uses the Income Calculator's frame:

1. Navy bar with the Income Calculator / Loan Suite switch and an income menu (pull income, send figures, open the calculator or its report).
2. Gradient header with Sync, Scenarios, the file picker and the As of / Closing dates.
3. Grey figure strip with Loan tools, Documents, Compare, View, Live, All actions, **Loan Report** and **File actions**.
4. White group tabs: File, Loan, Costs, Underwriting, Results, Documents, Full.
5. Pill page tabs with icons, counts and warning dots.

Above every page: four stat cards and the four quote presets with the program switch and Compare. The live summary sits on the right with a status line at the top.

See [CHANGELOG.md](CHANGELOG.md) for the full list, including the navigation fixes.

## Repository layout

```
index.html                     GitHub Pages entry, forwards to dist/
dist/mortgage-suite-los.html   the app (current release)
dist/mortgage-suite-los-v53.1.html
src/release-50/                the Release 50 layer (CSS + JS)
src/release-53/                the supplied Release 53.1 icon patch and notes
archive/mortgage-suite-los-v53.1.html the supplied Release 53.1 snapshot
tools/build-release-53.py      rebuilds the current dist/ files
```

## Rebuilding

```
python tools/build-release-53.py
```

Edit the release sources, run the script, and commit the updated `dist/` files.

## Notes

Calculations are planning figures. Confirm limits, fees and eligibility against agency guides, AUS findings and lender overlays before quoting or disclosing.
