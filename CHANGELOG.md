# Changelog

## Release 53.1 - stable navigation icons and document routing

- Added one SVG icon owner for every Loan Suite and Income Calculator group, including Documents, Income, and Qualification.
- Kept Release 50's already-stable Loan Suite masked icons as the sole owner of Loan Suite page-tab glyphs; Release 53 SVG icons now apply only where the Income Calculator needs them. This removes the square and doubled-glyph artifacts from secondary navigation.
- Made page-tab cleanup run before the settled-state shortcut so asynchronously rebuilt tabs such as Assets cannot reintroduce stale icon markup.
- Normalized freeform percentage display so the FHA 3.5% preset remains `3.5`, never a binary floating-point tail, and made shared screen cleanup safe during rapid workspace changes.
- Added a startup recovery for a stale Full-form view state, so a restored Loan Suite tab cannot leave the shell visible while every normal workspace panel is hidden.
- Retained the Release 51 document-routing improvements so payroll, VOE, tax, and income-extraction JSON is sent to the Income Calculator instead of silently falling through to Loan Suite fields.
- Preserved the full Release 50.4 calculation, autosave, shared OCR, JSON-review, property synchronization, and scenario workflow.

## Release 50.4 - workflow, autosave, and nationwide county sync

- Added an **Other / Variable Income** salary source, optional job title, and Auto as the starting calculation method while preserving the underwriting engine and manual overrides.
- Added one compact five-recent-scenarios menu shared by the Income Calculator and Loan Suite.
- Income Report now saves a restorable income snapshot; generated Loan Suite reports and documents save a named scenario version before output.
- Standardized automatic file names to borrower, program, price, and down payment for loan scenarios, and borrower, income used, employer, and title for income scenarios.
- Added nationwide ZIP-to-county enrichment through the public FCC Area API, with New York City borough-to-county fallbacks and all freeform fields retained.
- Reorganized Income Calculator file actions into the same compact, categorized action-card system used by the Loan Suite.
- Consolidated document review into one shared Income/Loan OCR workspace, kept the complete prompt library in a collapsed collection, and added a review-first importer for any supported JSON object.
- Fixed direct Documents navigation, the dedicated Contract & LE workspace, Draft LE generation, and delayed Loan-Suite startup protection so normal Income/Loan switching remains reliable.
- Fixed Auto-agency recalculation so renovation preset changes resolve a real underwriting method before DTI painting instead of producing a transient console error.

## Release 50.3 - multi-way property and escrow synchronization

- Made Setup, Quote, Property, ZIP lookup, Taxes & Proration, and Escrow share one guarded scenario data flow in both directions.
- Added freeform full-address parsing so a street address with city, state, and ZIP can populate the corresponding scenario fields while keeping the street line clean.
- Made ZIP lookup state scenario-specific and added an online locality refinement without repeatedly re-running lookups when switching saved files.
- Added automatic ZIP-driven ARV planning and New York closing-cost refreshes while preserving manually changed ARV, as-is values, and fee overrides.
- Synchronized annual tax, closing date, first payment date, cushion months, and tax billing-cycle disbursements back from Taxes & Proration into the live escrow aggregate.
- Re-runs the aggregate escrow analysis with the jurisdiction cushion and automatic first-payment timing whenever a new property/ZIP is pulled.

## Release 50.2 — county limits and property synchronization

- Embedded the official 2026 conventional and FHA county loan-limit tables, including Nassau County's distinct one-unit conventional high-balance limit and FHA high-cost ceiling.
- Added compact, linked Live Summary checks for ARV and loan classification: conforming, high-balance, jumbo, FHA standard, FHA high-cost, or over the FHA county limit.
- Kept ZIP/locality lookup text out of the street-address field and synchronized Quote/Setup property changes with the Property, Escrow, and Taxes & Proration workspaces.
- Added automatic ZIP lookup stabilization, locality/tax-cycle handoff, compact status styling, and regression coverage for county-limit classifications and property synchronization.

## Release 50.1 — stable navigation and landing layout

- Replaced mutable Loan Suite group-icon markup with fixed, theme-aware icons keyed to each navigation group, preventing late legacy redraws from changing button widths.
- Hid the retired duplicate Documents group from the first paint while retaining the organized Documents pages under Results and the direct Documents launcher.
- Pinned Setup and Quote metric strips to a full-width, equal-column grid with responsive two- and one-column fallbacks.
- Added a deliberate mid-width header wrap so scenario, date, and action controls no longer compress into one another.
- Hardened the landing-page card grid against overflow and removed hover translation so both workspace cards remain aligned when opened or hovered.
- Cleared both retained Full-view state flags when opening a focused workspace, so Full can be reopened repeatedly without a stale invisible page intercepting the button.

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
