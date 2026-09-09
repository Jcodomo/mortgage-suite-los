# Mortgage Suite v19 - Publishable Release

## Theme control

- Replaced the long theme text controls with one compact dark-mode style icon in the Income Calculator and one in the Loan Suite.
- The icon changes with the active Light, Dark, Navy, or Navy + black preset while the coordinated field color changes with it.
- Either icon advances the same shared preset and repaints both applications immediately.
- The preset cycle is Light with light fields, Dark with light fields, Navy with blue fields, and Navy + black with dark fields.
- Added accessible current/next-theme labels, keyboard focus treatment, and matching hover behavior.

## Freeform entry

- Converted every rendered numeric input to freeform text mode without replacing its existing change/input handlers or calculation path.
- Preserved decimal mobile keyboards, currency/percentage parsing, commas, and supported `k`/`m` shorthand.
- Normalizes formatted values before original live handlers execute; browser verification confirmed `550k` becomes `550000` before the loan calculation runs.
- Date fields continue to accept typed common US formats, normalize to valid dates, and retain their optional date picker.
- Constrained choices such as program, state, occupancy, property type, and yes/no remain dropdowns so invalid values cannot enter the calculation engine.

## Calculation and workflow regression pass

- Rechecked P&I, payment capacity, FHA/HomeStyle loan math, UFMIP/PMI/MIP, down payment, seller concession, renovation financing, closing A-J totals, NY title estimates, cash to close, escrow dates, tax pickup schedule, DTI rules, debt-month exclusions, Schedule E cash flow, P&L totals/margins, projections, contractor totals, and lock-extension pricing.
- Rechecked scenario comparison live edits, JSON schema validation, scenario naming/selection, document-only print/export controls, and pay-statement layout stability.
- All 16 test files passed before packaging.

## GitHub package

- Added `package.json` with `npm test`, `npm run build`, and `npm run verify`.
- Added a cross-platform Node test runner.
- Added a GitHub Actions workflow for Node 20/Python 3.12 test-and-build checks on pushes and pull requests.
- The repository includes the self-contained release HTML under `dist/` and does not include the private reference PDFs.
