# Mortgage Suite LOS — Release 36

## Interface polish

- Matched the Loan Suite more closely to the Income Calculator with a compact full-width header, centered 1320px worksheet, modern navigation, lighter field surfaces, restrained cards, and consistent typography.
- Kept the Live Summary nested inside the desktop/ultrawide worksheet and reduced it to the decision-focused acquisition, loan, warning, and live-planning content.
- Placed `Live` immediately beside `Actions`, stabilized the Property control, and moved the continuous Full-form page directory directly below the primary workspace navigation.
- Added a compact suite footer and responsive Full-form page directory without horizontal overflow.

## Assets and document review

- Restored Assets as a first-class Qualification subpage.
- Added Auto, Fannie Mae, Freddie Mac, and FHA asset-use summaries that distinguish income eligibility from closing/reserve use by account type.
- Added reviewed PDF/image/text asset-statement extraction, editable large-deposit thresholds, source/review states, and explicit add-to-file behavior that does not overwrite an existing account.
- Added a versioned JSON-only assistant prompt for large-deposit analysis and exposed it from Documents & OCR.

## Verification

- Rebuilt the self-contained distribution and ran all 26 automated test files successfully.
- Verified the Loan Suite and Income Calculator at the normal desktop viewport and the Loan Suite at 1920px widescreen with no horizontal overflow or browser console errors.
- Confirmed all 14 Full-form pages remain present and the Assets page exposes both guideline and OCR workflows.
