# Mortgage Suite LOS — Release 39

Additive over 38, with three small source edits to earlier layers, each
noted below. All 29 test files pass. Layers V5–V39 verified present.

## The live summary, to the reference

The reference build shows six sections and nothing else. Release 36 had
already trimmed the engine's rail to that set; what made it busy again
was the planning block release 35 added beneath it and the extras
release 38 folded in. Both are useful; neither belongs in view by
default. They now sit in one **More detail** disclosure under the
checks — closed until opened, and the choice is remembered.

Every row in the six sections and in the disclosure is a live target:
each opens the edit popout from release 35, with its "open the
workspace" button. Rows show a hover surface so it is obvious they are
clickable.

The line release 5 inserted under the title is retired. It repeated the
header badge and the scenario picker, and its trailing
"Conventional – Conventional" was the programme label being appended to
a name that already ended with it.

**The washed-out badge — the "bugged icon".** The header's programme
badge had no contrast on light surfaces and was rewritten by the engine
on every render tick, which is what made it look like it was twitching.
It now has one fixed treatment with `transition:none`, so neither the
colour nor the motion can flicker.

## The header — five controls

    Actions · File & view · Documents · Loan tools · Live

Release 35 collected everything behind one Actions button, which was
right against the flicker and wrong for daily use — a twenty-entry menu
is the wrong size. The list is split by what people are doing. Each is
a small panel; each entry still clicks the real control, which stays in
the DOM stowed. **Anything no panel claims lands in File & view**, so a
feature added by a later layer cannot go missing — asserted.

Live opens the comparison directly.

## One button system, one tab system

The reference's controls: 34px, 8px radius, 1px border, medium weight,
subtle surface, one accent for the control that leads. Applied to every
control in the header band, the scenario row, and the rail's rows.
The tab strip gets the reference's pill treatment. Three button
treatments in the same 90 pixels became one.

## GitHub colourways

`github` (Primer light: #ffffff / #f6f8fa / #d0d7de / #0969da) and
`github-dark` (#0d1117 / #161b22 / #30363d / #58a6ff), with the success,
attention and danger colours mapped onto the engine's pass, amber and
warn tokens.

**Source edit, `patch-v24.js`:** both names added to `THEMES`, and
`github-dark` added to the dark-base test. Release 24's `applyTheme`
rejects unregistered names and is re-applied from storage on a timer,
so a theme that is not on that list is reset to Terminal within a
second — registering them is the only way they persist.

## One appearance panel

Three cycle buttons meant nine clicks to see the options and no way to
know which you were on. One popover lists surface, theme (as swatches)
and input tone, with the current choice marked. The cycle buttons are
stowed, not removed.

A mistake caught by the existing tests: the first draft listed input
tones that do not exist. The real five are `paper, mist, mint, sand,
ink`; `setInput` silently falls back to `ink` for anything else, so two
of the panel's buttons would have done nothing. Fixed.

## Every destination is its own page

**Source edit, `patch-v8.js`:** the function that appended Taxes &
Escrow under the Escrow screen now stands down when release 39 is
present. Taxes is a page of its own in the parked-panel stage, reached
from the linked subnav beside Closing and Escrow. Every parked page and
every primary-nav destination scrolls to the top on open — the "brings
the page to the bottom of an already established page" case.

## Address search on every address field

Type into any address field and suggestions appear from OpenStreetMap's
Nominatim — free, keyless, and answering cross-origin, which is what a
local file can actually reach. **USPS has no public address API without
a registered account, so it is not pretended to.** Picking a suggestion
fills the address and, where they sit beside it and are empty, the city,
state, ZIP and county. A typed value is never replaced. The full address
is optional: four characters of a street starts the search, a bare ZIP
takes the ZIP path from release 38 instead, and nothing is written until
a suggestion is chosen.

## Free-form

One more sweep covers `type=date` as well as `type=number`, since dates
were the last native pickers left.

## Tests

`test/v39.test.js` — 23 assertions: no control unreachable from the five
buttons, the GitHub pair registered and a registered name surviving the
re-apply timer, address fill-only-blanks including select matching, and
the ZIP-vs-address routing.

Two existing tests encoded the old state and were updated rather than
deleted. `v24-ui` now asserts the five curated themes are *retained* and
the GitHub pair is *added*. `v22-ui` hard-coded the list of release
numbers it accepts and would have failed on every bump forever; it now
reads `package.json`.

**Not browser-verified.** Worth checking first: the More-detail
disclosure's row hover on the darker themes, and an address search on
the Setup tab's property address field.
