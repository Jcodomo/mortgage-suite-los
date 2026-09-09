# v14 - professional documents and live suite integration

- Reworked the generated Profit & Loss into three professional accounting layouts: accountant summary, detailed ledger, and condensed statement. All business and preparer fields start blank; no sample business, CPA identity, certification, or signature is inserted.
- Preserved the mandatory SAMPLE / DEMO / NOT FOR SUBMISSION marking on generated payroll worksheets while retaining three generic pay-statement layouts. Removed the long instructional paragraph from the printed statement.
- Added live PMI behavior. Home price, down payment, credit score, rate, term, and PMI factor recalculate on input and write through to the open scenario.
- Added a live editable scenario comparison grid for purchase price, down payment, interest rate, and program; loan, payment, and cash-to-close results recalculate from each scenario.
- Added an explicit four-choice theme menu (Light, Dark, Navy, OLED) synchronized across the income calculator and loan suite.
- Removed property-field Editable badges and property icons while keeping every field manually editable. Added pull-from-loan-setup, push-to-other-forms, Google property search, and address-document OCR controls.
- Added a live combined summary for qualifying income, total payment, total loan, closing costs, cash to close, projected value, borrower, property, and program.
- Added OCR prompt presets for income, credit reports, leases, purchase-contract addenda, and contractor estimates.
- Added printable lease and purchase-contract addendum generators with editable fields and local OCR intake. The addendum follows the supplied one-page agreement structure.
- Added a contractor estimate generator modeled on the supplied bid/estimate references, including searchable scope categories, labor/material columns, overhead and contingency, reconciliation checks, OCR intake, Google cost-search links, and renovation-base-cost synchronization.
- Added an editable A-J itemized fee sheet using only fee names found in the supplied Loan Estimates or already present in the suite. Entered lender/title/appraisal/renovation values feed supported Closing overrides and the existing draft LE; system taxes, prepaids, and escrow remain controlled by their source calculations to avoid double counting.
- Added custom closing-cost cushion percentage and rounding inputs to the itemized fee workflow.
- The renovation fee sheet can now apply the suite's existing consultant/per-draw assumptions and program/unit/utility-based contingency selection to the active scenario.

## References reviewed

- `profit and loss statement.pdf`: one-page professional P&L hierarchy and subtotal treatment.
- `Draft LE homestyle.pdf` and `draft le cantave.pdf`: A-J section names, fee terminology, cash-to-close structure, and renovation items.
- `Fillable Addendum.pdf`: purchase/sale addendum wording and signature layout.
- Three contractor estimates: company/customer header, scope, labor/material/line totals, subtotals, overhead, contingency, and signature blocks.
- Official CFPB Loan Estimate guidance and current HUD/Fannie Mae renovation guidance were checked for section structure and HomeStyle contingency treatment.

## Unavailable references

The Windows Recent shortcut, the H: drive lease template, the H: drive Addendum Generator workbook, and the H: drive contractor estimate were not mounted in this task. The lease generator therefore uses a clean one-page residential structure rather than claiming a pixel-level match to that unavailable template.

## Safety boundary

Generated pay statements remain unmistakably marked as samples. Generated P&Ls do not fabricate accountant/CPA certification or signatures; preparer fields print only when the user enters them.
