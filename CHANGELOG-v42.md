# Mortgage Suite LOS — Release 42

Additive over 41. All 32 test files pass. Layers V5–V42 present.

## The crushed bar — built again, differently

Releases 40 and 41 both tried to rescue the header icon bar in place and
it stayed crushed. I searched the built stylesheet for every rule that
can shrink a descendant of the masthead and found nothing conclusive —
which is itself the answer: whatever is doing it targets the class names
those layers used, and arguing with it a third time was not going to
converge.

Release 42 uses none of those names. New element, new classes, and
`all:unset` on every control so nothing is inherited from any ancestor;
every dimension is then declared explicitly. The right-hand slot that
held the crushed bar is hidden outright. The earlier bars are stowed,
not removed, so their wiring survives.

**Every button carries an icon and a label, always.** There is no
icon-only state anywhere in this layer, and a test asserts that.

    TOTAL LOAN  PAYMENT  CASH TO CLOSE  BACK DTI  RATE     ·     File  View  Documents  Compare  Loan tools  Live  Actions

Readings left, cluster right, one band. File, View, Documents and Loan
tools open small labelled menus; Compare and Live open the comparison;
Actions opens the full list. Documents offers **Print / Generate /
Open**. Any real control that no menu lists surfaces under File, so a
feature cannot go missing — asserted with a control that does not exist
yet.

## Layout

The group nav and the context tabs are centred. The live summary is
pinned to the right column and sized 380px (420px above 1700px wide);
the main column takes the rest, and the whole canvas widens to 1680px.

## The rail — the borrower summary, in exact figures

The scenario summary's borrower block prints ranges because it is
written to be shown to a borrower. On the rail the exact figure is
wanted. Every line is read from the same output the summary reads and
printed to the cent: program, purchase price, after-repair value, down
payment with its percentage, base loan, upfront fee, total loan, rate
and term, **monthly payment**, **closing costs**, **cash to close** —
each exact, never the low–high pair — earnest money credited, equity
after the renovation with its percentage, projected value at the file's
horizon and appreciation rate, minimum as-is value needed, and the
renovation amount. Every row opens the edit popout or the workspace.

Tests assert the range keys (`paymentLow`, `buyerClosingCostsHigh`,
`cashToCloseLow` and so on) do **not** appear in the rail source, and
the exact keys do.

## Tests

`test/v42.test.js` — 18 assertions: no earlier header class name reused,
`all:unset` on every control, icon-and-label on every button with no
icon-only state, the old slot hidden and the old bars clipped rather
than removed, the menu inventory with an unknown control surfacing
under File, exact-not-range on the rail, and the centred nav and pinned
rail present in the built file.

**Not browser-verified.** If the slivers are still visible after this,
they are not any header bar of mine — and the next step is a screenshot
with the element inspector open on them, which will name the culprit
in one look.
