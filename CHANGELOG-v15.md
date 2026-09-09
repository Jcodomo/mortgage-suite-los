# Mortgage Suite v15

## Documents and income

- Consolidated worksheets and document generators into **Documents + OCR**.
- Added accountant-style Profit & Loss layouts with blank/default-safe content, typed-date correction, January 1 current-year beginning, most recent completed month ending, Schedule C/entity source selection, comparison thresholds, income analysis, margins, expense ratios, and print-statement-only output.
- Added multiple payroll statement layouts with live earnings, deductions, taxes, YTD and net-pay math. Generated payroll statements retain a red training-draft marking.
- Expanded the lease generator into a structured one-page residential lease with parties, term, rent, deposit, utilities, occupancy, notices and signatures.
- Preserved OCR review states and extended document shortcuts for P&L, payroll, PMI/MIP, renovation fees, itemized fees, contractor estimate, lease and addendum.

## Loan and property

- Added a live conventional PMI rate table and FHA UFMIP/annual MIP table; the worksheet remains synchronized with price, down payment, program, score, rate, term and monthly payment.
- Added the itemized-fee pull action in Closing and preserved its draft-LE mapping.
- Expanded live scenario comparison with renovation, seller concession and mortgage-insurance inputs that recalculate each saved scenario.
- Added ZIP/available-data Property lookup, area appreciation, projected value, equity and renovation value summaries while keeping all fields manually editable.
- Added a live, linked 203(k) maximum-mortgage worksheet preview and advanced escrow/Schedule E summaries.
- Corrected the Fannie Mae departing-residence treatment so positive rental surplus offsets PITIA only and is not added to qualifying income.
- Consolidated scenario import/export and the four appearance choices; navy is the initial v15 theme.

## QA

- 171 automated assertions passed; zero failed.
- Interactive browser checks passed for Documents, P&L, PMI/MIP, Closing fee pull-through, Property tools and live scenario comparison.
- Rebuild hash matched exactly, confirming an idempotent single-file build.

## Reference limits

- The exact one-page lease file on the unavailable `H:` drive could not be opened during the final pass, so the lease uses the supplied requirements and standard one-page clause structure rather than an exact visual reproduction.
- The condensed P&L reference was a Windows shortcut whose target was unavailable; available P&L images/PDFs were used for hierarchy and presentation.
- OCR cannot reliably infer absent fields or damaged scan text. Those values remain blank or marked Needs Review; no amounts are invented.
- PMI/MIP tables are planning estimates. Actual insurer, lender and agency pricing must come from the applicable quote or current program source.
