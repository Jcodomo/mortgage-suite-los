# Release 20

- Cross-checked FHA 203(k) ARV/MMW against the supplied renovation master and added its exact reference case to automated tests.
- Added richer Setup and scenario controls, strict freeform validation, inline calculation editing, ARV/as-is warnings, expanded live comparison, and amortization.
- Added rent-by-ZIP search, contractor thresholds, synchronized two-month escrow controls, and three OCR document presets.
- Added P&L preview, statement-only output, a faint DRAFT pay-statement watermark, and a generic fourth payroll layout.
- Added last-three-session restore and a GitHub Pages landing page.

The income workbook was used to verify wage, self-employment, entity, asset-depletion, and Schedule E coverage. Some historical Wage Earner cells in the supplied `.xlsm` contain `#REF!`; those broken formulas were not copied.
