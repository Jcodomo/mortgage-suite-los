# Mortgage Suite LOS — Release 46

Additive over 45. All 36 test files pass. Layers V5–V46 present, build
idempotent.

## The reference look, restored

The two reference screenshots are the engine's own original light
style — a white card on the page colour, a quiet grey title band with
the programme label washed to the right, blue section captions, tinted
result rows with soft corners, totals in blue on a rule, the green
cushion row, and the footer strip. Later layers drifted from it. This
release brings the **live summary**, the **Quote worksheet** and the
**Scenario control centre** back to that look, in the theme's tokens so
every colourway keeps the shape. Information on the rail is unchanged;
only its dress.

## The large cards, first — and four more

Release 44's four metric cards sat at the bottom of the control centre,
under the fields. They are what a person reads before touching anything,
so they now sit directly under the title. Four join them in the same
icon-and-figure card: **Monthly payment**, **Cash to close**, **LTV** on
its value basis, and **Back-end DTI** against its cap. Every card is a
live row and opens its source.

## The assistant panel — a prompt library and a copy button

The panel had one route: build a prompt from a document already loaded.
It now carries a library chosen from a select — **one generic reading
prompt and eleven specific ones** — filled into the box with a **Copy
prompt** button beside it.

Every prompt in the library carries the same contract, and the tests
assert it on all twelve: JSON only, no prose; numbers plain; **rates as
printed (6.875), never as decimals**; dates ISO; **omit a blank field
rather than guess**; copy what is printed and do not calculate, average,
annualise or reconcile. The specific prompts ask for exactly the keys
this file imports — the Loan Estimate prompt uses the release-11
schema, the credit prompt asks for the fields the credit reader needs
(months remaining, 30/60/90 lates, disputed, authorised user), the bank
prompt asks for **every** deposit because the file applies its own
large-deposit threshold, and the paystub prompt separates YTD by type.

## Tests

`test/v46.test.js` — 58 assertions: the contract on every prompt, the
schema keys per document type, and the card ordering.

## Final browser QA

Verified at 1024px, 1280px and 1920px. The final pass corrected two
responsive issues found outside the automated suite: the Live Summary no
longer overlays the worksheet at laptop widths, and the eight metric cards
switch to two columns before their values can clip. Duplicate card chevrons
were also removed. Documents routing, Loan Tools, the OCR prompt library,
freeform shorthand recalculation and the Income Calculator were exercised
with no browser-console errors or horizontal overflow.
