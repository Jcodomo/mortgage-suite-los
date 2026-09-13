# Mortgage Suite LOS — Release 48

Additive over 47. All 38 test files pass. Layers V5–V48 present, build
idempotent. The Income Calculator is untouched.

## The structure, back — and Full as the toggle

Release 47 flattened the tabs into one row of seventeen. That was the
wrong reading of "simpler", and the screenshots settle it. The grouped
structure is restored:

    File · Loan · Costs · Underwriting · Results · Full · Documents

with the rounded row underneath showing the pages of the group you are
in. **Full is the toggle that shows every rounded page at once**;
pressing it again returns to the group you were on. Release 47's
flattening stands down. A **Documents** group is added to the nav.

Nineteen destinations, each in exactly one group — asserted, along with
File showing three, Underwriting five, and Full showing all nineteen.

## Three pages that had no route

**Documents & worksheets** and **Draft LE** had no tab of their own.
**Taxes & proration** had one, but its handler opened a panel that the
parked-stage rules then hid. All three are tabs now, routed explicitly,
and all three sit in the Documents or Costs group.

## Loan tools → the rates page

Release 47 turned this into a popup. The page is what was asked for, so
the menu entry opens the page; the popup stays on the Quote rate field,
where it is the right control.

## Four Quote presets

FHA 3.5% and 5% down existed. **FHA 203(k)** and **HomeStyle**, both at
a **$50,000** budget, are added — the applier already understood them,
they were simply never rendered. Each renovation preset turns renovation
on, seeds $50,000 only when the file has no budget (an existing figure
is kept — asserted), then clears the draw override and re-enables fee
sync so release 45's tier rule re-derives the draw count and its fees.

## The value test, and it is two different tests

On a renovation file the live summary now runs the test the programme
actually applies — and the two are not the same:

- **FHA 203(k)** caps the **value basis** at **110% of ARV**.
- **HomeStyle** caps the **loan** at **95%** of the as-completed value.

The tests assert the distinction with the file from the screenshots:
$658,418 ARV, $625,497.10 loan, $662,025 basis. Under HomeStyle it sits
exactly on its 95% cap and passes with a $0 margin. Applying the FHA
test to a HomeStyle file would pass a loan that is over its cap — so the
wrong test is not a cosmetic error, and that case is asserted directly.

## State-specific risks on the live summary

The things that change how a file closes without being a calculation:

- **Attorney states** — nine where the closing is conducted by an
  attorney, and seven more where involvement is customary. Phrased as
  what to expect, because it is closing practice rather than statute
  everywhere.
- **Community property** — nine states, with the note that a
  non-borrowing spouse's debts can count against the ratio on government
  loans.
- **New York** mortgage recording tax and **Florida** doc stamps and
  intangible tax, both of which move with the loan rather than the price.
- States with their own escrow rules.

No state appears on both lists — asserted, since that would be a
copy-paste error rather than a fact.

## Tests

`test/v48.test.js` — 34 assertions. One of my own expectations was
wrong and was corrected rather than the code: the groups hold nineteen
destinations, not eighteen.

**Not browser-verified.** Look first at the nav on a 760px phone, where
both rows scroll horizontally.
