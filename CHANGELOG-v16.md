# Mortgage Suite v16

## Documents

- Rebuilt the lease generator from the supplied fillable one-page lease template. It now follows the same six sections and field set: agreement date, landlord and mailing address, tenants, property and residence type, term, rent/payment instructions, security-deposit selection, return period, and signatures.
- Added explicit document-only **Print** and **Download PDF** actions for the lease, addendum, contractor estimate, and Profit & Loss statement.
- Kept P&L analysis in the workbench while excluding it from the printed/downloaded statement.
- Added a fourth payroll presentation, **Payroll voucher**, alongside compact corporate, classic earnings, and modern payroll layouts.
- Reduced the payroll training-draft marking to a compact single-line header while keeping it visible.
- Added the full Documents and Worksheets launcher card to the Loan Suite Documents & OCR screen.

## Workflow

- Darkened editable inputs with coordinated contrast for light, dark, navy, and navy/black themes.
- Converted newly added document amount/date controls to freeform text entry; valid typed dates normalize automatically.
- Added one visible Closing action that imports the active scenario's 20 buyer fee lines into supported Closing and draft-LE fields.
- Made the departing-residence Fannie Mae reminder conditional on **Include vacating rental**.
- Made Advanced risk/warning rows navigable to their related screen.
- Added **Gross Rental Cash Flow** immediately above **Net Rental Cash Flow** for every Schedule E property.

## QA

- Verified the actual fillable lease contains one page, 15 AcroForm fields, and the six modeled sections.
- Browser checks passed for all four document-only output controls, four payroll layouts, Loan Suite document launchers, the 20-line fee action, conditional rental guidance, and Schedule E gross-before-net ordering.
