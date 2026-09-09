# Mortgage Suite v17

## Fixed

- Fixed the Generated Pay Statement refresh error that duplicated the statement-layout selector every 700 ms. The preview now keeps exactly one selector with four working styles.
- Expanded Live Compare to a full-viewport, horizontally scrollable control center so no fields are clipped.
- Synchronized the Income Calculator and Loan Suite theme controls. Each application now has one text button that cycles Light, Dark, Navy, and Navy + black using the same saved theme.

## Scenario control center

- Added live scenario rename, borrower name, property address, ZIP, state, county/area, occupancy, price, down payment, rate, term, credit score, program, renovation, seller concession, mortgage-insurance rate, annual taxes, annual insurance, and HOA fields.
- Kept live recalculation for PMI/MIP, total loan, payment, and cash to close.
- Annual tax and insurance edits in Live Compare now explicitly switch those inputs to annual basis.

## Contractor estimate

- Made contractor names, addresses, scope descriptions, labor, material, percentages, dates, and notes freeform.
- Added a clear **Add freeform scope line** action; category search remains optional.

## Closing fees and escrow

- Fixed combined origination, processing, and underwriting at **$2,250** per scenario. Origination points remain a separate percentage-based line.
- Added source explanations to Closing and the itemized fee sheet.
- Added **Search official/local fees online**, prefilled from the active property address, county, state, and ZIP. Search results never overwrite entered fees.
- Newly upgraded scenarios now use the suite's aggregate 12-month escrow trial balance, anchored to closing date and automatic first-payment date. Tax-disbursement months, insurance renewal, and cushion drive the initial escrow deposit; the manual mode remains available.

## Fee provenance

- Title, settlement, attorney, recording, survey, appraisal, and routine third-party defaults are planning values from the suite's versioned state closing-cost profiles and standard third-party planning table.
- Mortgage recording and transfer taxes continue to use the suite's jurisdiction tables.
- Itemized/user overrides remain authoritative. No title-company quote, county page, or online search result is silently imported.

## QA

- Passed the full existing automated regression suite plus 15 v17 assertions.
- Browser-tested the pay-statement selector after repeated live refreshes, all four payroll styles, cross-application theme synchronization, full-width scenario editing and rename, contractor freeform fields, the fixed $2,250 fee, fee-source controls, and date-driven escrow display.

## Extraction limits

- No new source document was auto-extracted in this increment. Exact title-company premiums, settlement charges, attorney charges, county recording charges, tax due dates outside the stored jurisdiction schedule, and other provider-specific fees still require a quote, official local source, OCR review, or manual entry.
