# Mortgage Suite LOS v36

A self-contained mortgage income, renovation, property, qualification, closing-cost, scenario, OCR, and document-workbench application.

## Run

Open `index.html` for the landing page, `loan-suite.html` to start directly in Mortgage Suite Quote, or `income-calculator.html` to start directly in the Income Calculator. No server or installation is required for the application.

## Develop

Requirements: Node.js 20+ and Python 3.12+.

```bash
npm test
npm run build
```

## Release verification

- All 26 repository test files pass through `npm test`, including calculation, freeform date/number, navigation, print, and Release 36 UI checks.
- GitHub Actions rebuilds the HTML and confirms the release artifact is non-empty.
- The distributed HTML contains all styles, application code, calculators, and printable templates in one file.

Reference PDFs used to tune the New York estimates are intentionally excluded from the repository. The implemented reference figures and formulas are documented in `CHANGELOG-v18.md`.
