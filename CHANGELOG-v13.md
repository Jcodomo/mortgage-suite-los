# v13 — workflow completion

Adds a final additive layer without editing either calculation engine.

- Property now uses borrower, street, unit, city, state, ZIP, county/area, property type, units, FHA tier, and representative score fields. ZIP-only files remain valid; lookup is optional, fills blanks only, and never locks fields.
- Property projection now shows each year from 1–5, supports appreciation or depreciation, and identifies the selected scenario horizon.
- OCR-facing inputs gain Auto-matched / Needs Review / Manual Override states; edits switch to Manual Override and are never silently replaced.
- Credit review adds status, responsibility, property/REO linkage, editable review state, totals, a transparent Low/Moderate/High screen, and its reasons. The existing agency-specific months-remaining rules and gross-income override remain intact.
- Adds a printable PMI estimate worksheet with the 720–759 / 0.50% planning example, monthly and total estimates, and an 80% LTV removal estimate. It repeatedly labels insurer pricing as unverified.
- Adds versioned scenario JSON export/import with schema validation and a field-level preview before applying changes. Default names use `First Last – Down Payment – Loan Amount – Program`.
- Keeps the existing A–J draft LE and live Closing mapping. Existing renovation line names and financed-cost reconciliation remain unchanged.
- Paystub demo output has three generic layouts and a permanent SAMPLE / DEMO / NOT FOR SUBMISSION border/watermark in preview, image, PDF, and print HTML.
- Keeps the existing Schedule C analysis labeled as a non-filed internal income-analysis draft.
- Adds a P&L generator beside the paystub workflow, including self-employment autofill, editable/custom rows, date fields that never mutate amounts silently, totals, margin/expense ratios, prior-period percentage change, underwriting insights, and Low/Moderate/High risk.
- Stipulations now show the generated borrower-facing email draft in an editable review box. It is copy-only and never sends.
- Adds a printable FHA 203(k) vs HomeStyle renovation fee cheat sheet that separates planning estimates from items requiring a current lender/vendor quote.

## Reference limitations

The original attachments were available to this task only through cached text summaries, not as downloadable source files. Consequently, no pixel-level reproduction or new field extraction was claimed from the PMI PDF, two Loan Estimates, paystub images, Schedule C screenshot, P&L samples, or renovation guide. The implementation uses the terminology and examples preserved in the conversation summary. Exact tables, fee ranges, and document-specific aliases should be confirmed against the original files before production use.

## Verification

- 143 pre-existing logic assertions pass.
- 13 new v13 logic assertions pass (PMI, five-year appreciation/depreciation, P&L totals/margins/risk, and scenario schema guard).
- JavaScript syntax passes and the bundle builds to one self-contained HTML file.
- Browser automation was attempted but the legacy harness lacks its Playwright dependency and the in-app browser connection timed out; interactive browser QA remains recommended before production use.
