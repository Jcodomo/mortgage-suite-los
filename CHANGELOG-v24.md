# Release 24

- Folded Quick edit into the Setup Worksheet as its always-expanded first rail row, retaining borrower, address, ZIP/county, purchase price, as-is value, ARV, down payment, renovation budget, and all preset actions.
- Merged Transaction, Property, Borrower, and Rate & terms into the same Worksheet card. Removed the separate Scenario Control Center band and moved its explanation into the Worksheet title tooltip.
- Linked missing ARV warnings to the ARV field with an amber border that clears as soon as a valid freeform value is entered.
- Moved the full scenario control into the header, gave it a 320px minimum width, and placed the compact property/program context in the shared tab row.
- Made Midnight Terminal the default with the requested exact surfaces and a theme-specific purple program badge. Expanded appearance controls to ten page themes and five independent input tones across both applications.
- Split secondary controls into File actions and Loan tools, added a Live summary drawer, an itemized closing-cost explanation, explicit PMI planning profiles, and live qualification/rental-income planning cards.
- Preserved the underlying income, MMW, ARV, escrow, mortgage-insurance, closing-cost, and amortization engines. Numeric fields retain freeform currency, percentage, comma, `k`, and `m` entry.
- Added live browser regression coverage for layout, theme tokens, freeform edits, missing-field linking, calculation updates, and theme/input cycling.
