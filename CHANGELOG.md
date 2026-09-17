# Changelog

## Release 50 — Workbench layout

Additive over Release 48. Neither calculation engine and no earlier layer was edited. The Income Calculator is unchanged (its screen renders pixel-identical to Release 48).

### Layout
- Navigation refinement: every retained page is now organized under File, Loan, Costs, Underwriting or Results; document workspaces are consolidated under Results instead of duplicating a primary group.
- Full now opens the continuous file view with a grouped directory to all 19 retained workspaces.
- Credit now opens as a standalone Loan Suite workspace using the existing editable credit-report and tradeline engine.
- Rule tables, Mortgage rates, Taxes & proration, Escrow, Credit and Contract & LE now use distinct matching icons; the Advanced shortcut row uses the same compact card language.
- Loan Suite rebuilt in the Income Calculator's frame: full-width gradient header, grey figure strip, white group tabs and pill page tabs. All navigation is across the top.
- Header: **Sync on/off** and **Scenarios** buttons, a labelled File picker, white date fields.
- Figure strip: Total loan as the green lead pill; Compare, View and Live become icon buttons; new blue **Loan Report** button (prints the scenario summary); **File actions** in black; the all-in-one menu relabelled **All actions**.
- Group tabs in calculator style, with Full as the last tab and the file context on the right.
- Page tabs show readable names (for example "Closing costs", "Worksheets"), icons, a count on Scenarios and Advanced, and an orange dot on any page with an open warning (hover for the list).
- Above every page: stat cards for Total loan, Monthly payment, Cash to close and Back-end DTI (each opens its page), the four quote presets with the active one highlighted, **Switch to Conventional / FHA** and **Compare both**.
- Page cards, the Renovation / Max mortgage sub-tabs and the live summary restyled to match the calculator's worksheets.
- Live summary: compact rows, pass and warning colours, and a status line at the top (within limits, waiting on the after-repair value, value test fails, loan limit binding, funds short).
- Top bar: clicking "Income synced" opens a menu to pull income, send figures, open the Income Calculator, return to the Loan Suite or open the income report.
- Light and dark surfaces both supported; narrow screens stack the header and strip and drop the summary below the page.

### Fixes (present in Release 48)
- **Mortgage rates** opened underneath the previous page; it now opens on its own.
- **Documents & OCR** and the **Documents** button left the previous page on screen above the document tools; both now open the Documents group on its OCR page, at the top.
- The page highlight lagged one click behind after visiting Taxes & proration, Contract & LE or Documents; it now follows the page you chose, and the group tab follows too.
- Live summary rows now open the page that holds their figure; a second click on the same page still jumps to the field.
- The Quote "Rates" shortcut floated at the right edge of the window; it now sits inside the rate field.
