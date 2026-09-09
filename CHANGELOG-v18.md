# Mortgage Suite v18

## New York fee estimates

- Removed the online closing-fee search buttons and the external CFPB link from the fee workflow.
- Added a built-in **Apply NY LE best estimate** action on the itemized fee sheet and **Refresh NY LE estimate** in Closing.
- Automatically seeds an existing New York scenario once, while preserving subsequent manual edits unless the user presses Refresh.
- Uses the attached New York HomeStyle Loan Estimate for Conventional/HomeStyle scenarios and the attached New York FHA 203(k) Loan Estimate for FHA scenarios.
- Scales lender title insurance by the active total loan and optional owner's title insurance by purchase price. Other supported title/service amounts use the matching sample's entered values.
- Sends the supported estimate into Closing, renovation inspection/title-update fields, and the draft LE. Attorney and survey remain $0 because neither attached sample itemized those charges.
- Keeps the requested combined origination, processing, and underwriting charge fixed at $2,250; percentage-based origination points remain separate.

## Reference profiles

- HomeStyle reference: Section C $3,841 at a $725,016 loan; lender's title $894; optional owner's title $3,172 at a $690,000 purchase price.
- FHA 203(k) reference: Section C $4,159 at a $615,580 loan; lender's title $1,018; optional owner's title $2,200 at a $551,200 purchase price.
- HomeStyle names include Bankruptcy Search, Endorsements, Escrow Fee, Lender's Title Insurance, Municipal Lien Search, Sales Tax, and Settlement Fee.
- FHA 203(k) names include Courier/Shipping, Endorsements, Title Update Fee, Lender's Title Insurance, Title Search/Abstract, and Settlement Fee.

## Themes and inputs

- The single theme button now displays both the application theme and its field tone.
- Light uses light gray fields; Dark uses high-contrast light fields; Navy uses blue fields; Navy + black uses dark fields.
- The Navy preset provides the requested dark interface with blue editable fields and stays synchronized between the Loan Suite and Income Calculator.

## QA

- Passed 215 automated assertions with zero failing test files.
- Browser-tested removal of all search controls, automatic FHA estimates in Closing, both FHA and HomeStyle itemized title labels/amounts, live lender-title scaling, and the Navy blue-field theme in both applications.
