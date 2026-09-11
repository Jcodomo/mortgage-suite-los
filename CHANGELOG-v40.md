# Mortgage Suite LOS — Release 40

Additive over 39. All 30 test files pass. Layers V5–V40 present.

## The header — one row

    [file] [view] [documents] [compare] [file actions] [loan tools]     Live    Actions

The screenshot showed two rows: release 39's labelled row and the older
Live and Actions still beneath it. One row owns the header now. Six
icons; Live and Actions are the two labelled buttons with menus. Every
earlier header control is stowed — kept in the DOM with its wiring,
taken off screen — so nothing that clicks one by reference breaks.

Documents is the one icon that pops a choice rather than going
somewhere: **Print**, **Generate**, or **Direct** to the Documents & OCR
page. The other five open their thing directly or as a small list.

## Icons redrawn

One set — GitHub's octicons, 16-grid — for the header, the group nav
(File, Loan, Costs, Underwriting, Results, Full) and the rail, replacing
the earlier hand-drawn house-and-coins set. Nothing in the chrome draws
its pictures a different way now.

## The MORTGAGE RATES flicker — found and ended

Three releases hid the promoted copies of Mortgage Rates, Property,
Advanced and Documents by adding a class. A fourth "stabilised" the
Property control with a rule that out-specifies a `display:none`. The
tab appeared and vanished depending on which rule had run last — that is
the chip in the screenshot.

The copies are now **moved** out of the context row into a hidden
holder. They stay in the DOM with their handlers, so anything that
clicks them by reference still works — and no stylesheet can bring them
back into a row they are no longer in. The tests model both approaches:
class-hiding loses to a stabilise rule on alternating frames; a moved
node is out of the row whatever any rule says.

## The live summary — three times the information, same style

New sections in the engine's own markup — a `.sec-head`, then `.out`
rows with a label and a value — so a reader cannot tell which rows the
engine drew and which came from here. Every row carries `data-out`, so
release 35's delegation opens the edit popout with its "open the
workspace" button.

Added: **Terms** (rate, term, programme, down payment, LTV on its value
basis), **Payment detail** (P&I; MI with its rate and tier; for FHA a
plain "life of loan" rather than a cancellation figure that will never
happen; taxes and insurance with their annual figures; HOA; the rounded
range), **Qualifying** (income, debts, front and back DTI with headroom
bars against their caps, maximum payment, cushion), **Closing detail**
(buyer costs split into lender, third-party, government and prepaids
from the engine's own itemised lines; seller credit against its ceiling;
earnest money; escrow cushion), **Renovation** when active, and
**Reserves** when there is anything to measure.

Rows whose figure is empty are not drawn. Release 39's More-detail
disclosure keeps the planning block beneath.

## Income report worksheets — no agency

`rptHead` is wrapped: the "Agency: FNMA" line and the "Base, overtime,
bonus and commission analysis per FNMA Form 1084 / FHLMC Form 91 / HUD
4000.1" subtitle are removed from every worksheet page. The Wage Earner
title, the employment record, the hire date and months on the job stay.
Any subtitle that is *not* agency text survives — asserted. The frames
and bands are restyled closer to the NMB sheet.

## Tests

`test/v40.test.js` — 23 assertions: the report head with agency stripped
and non-agency subtitles kept, the flicker modelled both ways, the
header inventory (six icons, two menus, every earlier owner stowed, the
rate chip deliberately *not* stowed because it is a reading), Documents'
three-way choice, rail rows drawn only when they have a figure, the
closing buckets summed from real line keys with seller lines excluded,
and the row count against the base.

**Not browser-verified.** Worth checking first: the six icons at the
phone width, and the Terms section's LTV row on a renovation file where
the value basis is the 110% ARV cap.
