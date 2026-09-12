# Mortgage Suite LOS — Release 45

Additive over 44. All 35 test files pass. Layers V5–V45 present, build
idempotent. Everything below is in `patch-v45.js` / `patch-v45.css`; no
engine or earlier layer is edited.

## The theme reaches every popup — found

Every modal appended to `<body>` read `--panel`, `--line`, `--ink` from
its ancestors, and those were defined on `#suite-root` and `#calc-root`
— never on the root. A popup outside both shells got the browser
default, which is why they looked off-theme. The bridged tokens are
mirrored onto `:root` under `html[data-v24-theme]`, so anything anywhere
inherits, and `color-scheme` follows the surface so native controls
match. The suite's bands take their colours from the same header token
the calculator uses.

## The live summary, to the reference

White card, quiet header with the programme badge, section labels in the
accent, values in the numeric face, bold totals on a rule, and the
"Click any line to jump to the field that drives it" footer. The value
test banner goes red when the file is over the 110% cap.

## Seller credit in dollars — found

The dollar field was `disabled` unless a separate "entered as" select
said dollars, and the percent field the reverse — so a typed amount went
nowhere. Both fields take input; typing in one switches the basis to it.
The select still works.

## Draw tiers and the conventional fee

The engine's draw table is a sealed module constant with three bands at
$35k and $75k. The bands asked for are four:

    under $25,000        2 draws
    $25,000 – $59,999    3 draws
    $60,000 – $99,999    4 draws
    $100,000 and up      5 draws

Applied through the engine's own manual-override path, and **only while
the count still equals what this rule last set** — a count the user
typed is never overwritten (asserted). Conventional renovation files get
a **$150 inspection fee per draw** where the field still holds the
engine default of $375; a fee someone entered is kept. Every boundary is
tested: $24,999 → 2, $25,000 → 3, $59,999 → 3, $60,000 → 4, $99,999 → 4,
$100,000 → 5.

## Scenario names

"Unnamed · FHA 203(k) · 3.50% down · 6.875% · 09-08 – Conventional" was
a placeholder where a name should be, with the programme appended to a
label that already carried it. A file with no borrower yet is named from
the street, then the city, then the date it was started — never
"Unnamed" — and the programme appears once.

## Tax schedule due dates

Clicking **Disbursement rule** or **Tax structure** opens the actual due
dates for the closing year and the next, from the jurisdiction's cycle,
with the share of the annual bill each instalment carries.

## The rate editor

The float noise (6.875000000000001) is gone — every percent shown for
editing prints at the precision it was entered. Beneath the inputs sits
a small survey board with a **Use** button on each row once rates have
been pulled. **Open Mortgage Rates** leaves the full form and opens the
rates workspace as its own page. Opening that page also runs the ZIP and
HUD lookups so the FHA area figures are current, and the header art that
painted as a black disc is sized.

## Addresses

A chosen match fills the street line without the country, and city,
ZIP and county into their own fields wherever they sit — typed values
kept. A full "street, city, state ZIP" typed into one field is split
into the blanks beside it. Every address field in both shells gets
**Maps · Zillow · Redfin · Realtor** links that search the typed address.
Links, because Google has no keyless address API and USPS no public one;
a link is what can be promised honestly.

## Full is a toggle

Clicking Full while it is open returns to the last group.

## Movable sections, saved with the scenario

Drag a section header to reorder the cards on a workspace. The order is
stored on the scenario's inputs, so it travels with the file, saves with
it, and is gone when the file is reset or a new one started. **Reset
layout** restores the default.

## Also

- The calculator's File actions carry a **Loan Suite** section with every
  suite action, each switching shell and running the real control.
- Every row on the Scenario Summary opens its source editor.
- Outside clicks close the rail editor, the Look panel, the due-dates
  popover, and every modal's backdrop.
- The third row (Quote · Setup · Property) uses the same 32px framed
  button as the row above it.
- Mortgage payments escrowed: the engine has no escrow-waiver input, so
  none is invented. Qualifying payment must include taxes and insurance
  whether or not they are escrowed; what a waiver changes is the deposit
  at closing, which is section G and the aggregate-escrow switch that
  already exists on the Closing page.

## Tests

`test/v45.test.js` — 33 assertions: every draw boundary, the engine
table disagreeing at $30k and $80k (which is why override is needed), a
typed count surviving a tier change, the conventional fee rule, naming
in all four fallbacks and the programme appearing once, the float fix,
address cleanup including Canada kept, Nominatim parts, tax due dates for
two cycles, and the seller-credit basis.

**Not browser-verified.** Look first at drag-reorder on the Quote page,
and the rail in dark mode where the reference was light.
