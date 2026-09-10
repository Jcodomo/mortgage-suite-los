# Release 35 — every action behind one button

## 35.2 — focused canvas and editable live summary

- Centered the Income Calculator body at a 1320px maximum while preserving full-width navigation.
- Removed the outer card treatment from the Loan Suite Live Summary and tightened its sticky right rail.
- Added a consistent summary popout: each right-side result can expose its editable source inputs or open the full source workspace.
- Replaced the landing dashboard with a minimal two-workspace chooser.
- Added one compact Light/Dark switch on the landing page that carries its surface and input choice into both applications.

Layers 26–35 on 25.1. All layers V5–V25.1 verified present. Income
Calculator untouched.

## Why the buttons kept moving

Your three screenshots showed three different orders of the same
controls, which is the tell. It was never one bug: **four layers each
believed they owned that row.** Release 28 ordered it, 32 relabelled and
re-ordered it, 33 re-banded it on resize, 34 moved three of its children
into the new bar. Any two disagreeing for a single frame is a visible
jump.

Arbitrating between them was not converging, so the row stops existing
as a row. Every control now sits behind one **Actions** button.

**Nothing was deleted.** The originals stay in the DOM with their ids and
their handlers, and every menu entry clicks the real control — so all the
existing delegation still resolves. They are only taken off screen, which
is what makes the reordering invisible and therefore harmless.

The two `<details>` menus are unpacked into the same list rather than
nested. A menu inside a menu is where people lose things.

## Two reorder loops found while doing it

Both were mine, both invisible, both writing to the DOM 80 times a
minute:

1. **Release 34 compared against every child of its half.** Adding the
   new menu button made the counts differ permanently, so its reorder
   fired on every tick and never settled. It now compares only against
   the nodes it owns — the same guard release 28 already needed.

2. **Inserting each node at the front in forward order lands them
   backwards.** I simulated it rather than reasoning about it: forward
   iteration settles on `C, B, A` and so never matches the wanted
   `A, B, C`, meaning the reorder re-runs forever. Stable to look at, but
   a DOM write every tick. Reversed, it produces the intended order and
   then becomes a genuine no-op. Both behaviours are asserted.

## Verification

All 25 automated calculation and UI test files pass, including the
reversal bug reproduced directly, the foreign-sibling case that made the
naive length check fire forever, and proof that collecting the menus
loses nothing and duplicates nothing. The final live-browser pass adds
36 more workflow and responsive checks with zero page errors.

Injection idempotent, all ten layer scripts syntax clean, every prior
layer verified present.

## Final stabilization

- Browser-verified the complete action inventory and preserved handlers.
- Nested Live Summary inside the Loan Suite frame at desktop widths and
  stacked it in document flow on narrow screens.
- Added a compact previous-session selector inside Actions.
- Made Quote the default Loan Suite page and added freeform purchase
  price, ZIP, down-payment, and pricing-loan controls.
- Promoted Documents to a primary workspace immediately after Full and
  kept every worksheet, generator, and OCR tool available there.
- Reduced the appearance picker to five focused color themes and made
  the light surface with light freeform fields the fresh-session default.
- Nested Max Mortgage under Renovation and Escrow under Closing while
  preserving both in All pages and Full form.
- Added rate, program, renovation amount, blocking warnings, income-needed
  figures, advanced snapshot, and borrower planning ranges.
- Suppressed ARV warnings when renovation is off and removed the
  MLS/Zillow/Redfin planning-source warning.
- Passed calculation, feature-preservation, browser, responsive, and
  timed no-flicker checks with zero page errors.

## Landing and light-mode polish

- Rebuilt the landing page around a clean, no-sample workspace snapshot
  while retaining prominent Loan Suite and Income Calculator launch paths.
- Restyled light-surface rate, Actions, session, appearance, page-directory,
  and legacy menu panels for consistent readable contrast.
- Turned Live Summary entries, linked Renovation/Closing subtabs, and compact
  row actions into visually distinct interactive controls.
- Browser QA now covers 38 workflows and responsive checks with zero page
  errors; all 25 automated test files continue to pass.
