# Mortgage Suite LOS — Release 44

Release 44 is the final v21-based Loan Suite merge. It preserves the calculation engines and the complete Release 43 tool inventory while returning the Loan Suite to the cleaner, denser worksheet layout requested for daily use.

## Loan Suite

- Uses Quote as the default workspace and merges Quick edit into the Quote worksheet.
- Keeps the compact v21 summary cards, nested Live Summary, and direct editing flow.
- Provides File, View, Documents, Compare, Loan tools, Live, and Actions menus with consistent icons and grouped destinations.
- Keeps all 17 focused workspaces reachable: Quote, Setup, Property, Renovation, Max Mortgage, Mortgage Rates, Closing, Escrow, Taxes & Proration, Qualify, Rental, Credit, Advanced, Contract & LE, Scenarios, Summary, and Documents & OCR.
- Keeps the core worksheets together in Full form while opening specialist pages as focused workspaces.
- Converts native number and date controls to freeform text entry, including shorthand number parsing and date normalization with validation.
- Makes the Quote purchase price, ZIP, down payment, value, ARV, renovation budget, loan amount, and rate controls recalculate the shared scenario live.
- Retains scenarios, JSON import/export, prior sessions, OCR, credit analysis, PMI/MIP, escrow, amortization, closing-cost mapping, renovation tools, leases, addenda, contractor estimates, pay statements, P&L, and printable worksheets.

## Appearance and layout

- Centers the main work area up to 1560px and adapts cleanly from laptop to ultrawide screens without horizontal overflow.
- Refines the Loan Suite masthead into the Income Calculator's full-width band style, with centered controls, a denser KPI/action row, aligned scenario fields, and evenly spaced dates.
- Keeps Light, Dark, and OLED surfaces independent from the color palette and input-field tone.
- Retains all palette choices and Paper, Mist, Mint, Sand, and Ink input tones.
- Uses the Midnight/terminal palette treatment for the dark Loan Suite while preserving light mode and accessible menu contrast.

## Income Calculator

- Preserves the Release 37 layout and calculation behavior.
- Adds Auto as the initial Agency choice for a fresh file while retaining FNMA, FHLMC, FHA, and VA choices.

## Verification

- All 34 repository test files pass.
- Calculation scenarios cover income, FHA 203(k), HomeStyle, conventional financing, PMI/MIP, escrow cushioning, closing-cost buckets, and 360-payment amortization.
- Browser checks cover Quote editing, invalid-input recovery, freeform dates, Documents, Full form, specialist workspaces, comparison, appearance, console errors, and 1280/1920/2560-wide layouts.
