# v11 — suite JSON/AI import, multi-LE extraction, modal layout, escrow
#       cushion, Property corrections

Adds `src/patch-v11.js` + `patch-v11.css`. Neither engine edited.

## The import modal layout — two stacking faults

Both visible in the screenshot:

- `.rpt-modal` sits at z-index **300** while `#shellbar` is **400**, so
  the mode-switch bar painted straight over the dimmed overlay and over
  the modal's own title row. A bar on top of a modal that is supposed to
  be covering the page.
- `.rpt-modal-bar` is sticky with **no z-index**, so the panel below it —
  later in the DOM and carrying a shadow — scrolled over the top of it
  instead of under.

Fixed for the existing report and extract modals as well as the new one,
plus the title now takes the row and the buttons sit right rather than
everything centring and wrapping into each other.

## Loan Estimate extraction into scenarios

A new **Import / AI** button on the suite toolbar opens a modal with the
same three-step shape as the income side. The prompt asks for a JSON
object with an `estimates` array — **one object per Loan Estimate** — and
each becomes its own scenario, so three programmes come back as three
scenarios ready to compare.

The prompt is explicit about the two things that silently corrupt an
import: rates are returned **as printed** (6.875, not 0.06875) and
converted on the way in, and "Closing Costs Financed" prints negative on
the form but is returned **positive**.

Nothing is reconciled on import, and the modal says so. The lender's loan
amount and cash to close are kept as printed while the file still
calculates its own — where they disagree that is a question worth
asking, not something to average away.

## Tested against the three real Loan Estimates supplied

`test/v11.test.js`, 24 assertions, using the FHA 203(k) at 10% down, the
same with four months of payments financed, and the Conventional
HomeStyle as fixtures. They are the useful test because they differ in
exactly the ways a naive importer breaks:

- **P&I reproduces to the cent on all three** from loan, rate and term —
  $6,142.05, $6,325.44 and $5,688.34 — which checks the rate conversion
  is right rather than merely self-consistent.
- D + I = J on every form.
- Cash to close keeps its sign: two of the three are **negative** (the
  borrower receives funds), the HomeStyle is positive.
- The HomeStyle finances **$30,000 of its $56,444** in costs while the
  203(k) files finance all of theirs. An importer that assumed
  "financed = J" would be wrong on exactly that one, so it is asserted.
- MI is zero on both FHA forms and $321 on the HomeStyle.

## Escrow cushion defaults to two months

RESPA allows up to two and nearly every file runs it. The engine
defaulted to the state rule, which is 2 everywhere in its table **except
Nebraska and Vermont, which are 1 by statute**. New scenarios now default
to 2 and those two states are deliberately left on their statutory
figure — blanket-overriding them would collect a cushion the state does
not permit.

## Property screen

- The address field carried a **sample address as its placeholder**.
  Placeholder text is grey helper text, but in a field meant to hold an
  address it reads as data at a glance. Replaced with a format hint.
- **"Do we have an address?" is a mode toggle, not a data field**, and
  v8's blanket free-form conversion turned it into a text box that would
  accept anything — which is how a house number ended up in it. Mode
  toggles are restored to selects; free-form stays on everything that
  actually holds data.
- A committed five-digit ZIP now fires the online lookup on top of the
  offline table, and repaints the panel when it returns.

## An assumption caught before shipping

`loadState` looks like the obvious way to load a saved file. It is a
module-level function that reads localStorage and takes **no argument** —
calling it with an object would have done nothing at all, silently. The
store's real restore path is `replaceInputs(inputs, action)`, the same
one Reset and the version history use, so it audits and emits correctly.

## Verification

Bundle clean, rebuild idempotent, full suite now 117 assertions passing.
Browser check still owed — the modal layout is the first thing to look
at, since that is what the screenshot was about.
