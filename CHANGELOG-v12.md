# v12 — credit report reader

Adds `src/patch-v12.js` + `patch-v12.css`. Neither engine edited.
A **Credit** button on the suite toolbar opens it.

## What it does

Reads a credit report through the OCR engine already loaded, classifies
each tradeline, applies the agency rule that decides whether the payment
counts, flags the derogatory history that actually moves an approval,
estimates a rate where the arithmetic supports one, and ranks what is
worth paying off. Nothing crosses into the file until you send it, and
only the counted payments go — each as its own row, tagged `[credit]`,
rather than one lump.

## The exclusion rule is not one rule

Written out per agency because they genuinely differ, and the difference
changes the answer:

| Agency | Threshold | Extra condition |
|--------|-----------|-----------------|
| Fannie Mae (B3-6-05) | 10 **or fewer** payments | — |
| Freddie Mac (5401.2) | 10 **or fewer** months | — |
| **FHA (4000.1)** | **fewer than 10** — so 9 or fewer | cumulative excluded payments ≤ **5% of gross monthly income** |
| VA (Handbook ch.4) | 10 or fewer payments | residual income test still applies |

**Ten months remaining qualifies under Fannie and fails under FHA.** That
one-month difference is asserted in the tests, because switching agency
on a borderline file changes the ratio and it is easy to carry the
Fannie answer across by habit.

The FHA 5% cap is applied across the whole file rather than per account —
it cannot be evaluated until every line has been tested — and when it is
breached the panel says so and keeps counting the payments rather than
quietly allowing an exclusion FHA would not.

**Leases are never excluded**, however few payments remain. The vehicle
has to be returned or replaced, so the obligation renews rather than
ending. This is the most common way the "10 or fewer" rule is applied
wrongly, so it is a hard block with its own explanation, not a warning.
Student loans are likewise held out of the shortcut — a payment must be
counted even when deferred.

## Rate estimate — and where it refuses

For an installment account with a balance, a payment and payments
remaining, the rate is recoverable: it is the rate at which the present
value of the remaining payments equals the balance. Solved by bisection.
Tested by round-trip against known amortisations at 4.49%, 7.9%, 14.99%
and 29.99% — all recover to within 0.02 of a point.

**For revolving accounts it refuses to estimate**, and that is the
correct answer rather than a gap. A card's minimum payment is set by the
issuer as a percentage of the balance; two cards at 12% and 29% with the
same balance show the same minimum. Any number printed there would be
invention, so the column reads "not recoverable".

It also refuses when the payments do not repay the balance, which means
either negative amortisation or figures that disagree — flagged rather
than silently fitted.

## Ranking: two lists, because there are two questions

**DTI relief per dollar** — monthly payment removed per dollar spent.
This is the origination question: what gets the ratio down cheapest.

**Rate** — the money question.

They rank differently and the panel shows both. A 0% furniture loan with
a large payment tops the first list and sits at the bottom of the second;
the tests assert that the two orders genuinely diverge on that case.

One mechanical caveat is carried on every installment row: **paying an
installment balance down does not reduce the payment.** It is fixed by
the note, so only paying it off removes it from the ratio. Revolving
minimums do move with the balance. Advising a paydown on the wrong one
costs the borrower money and changes nothing.

## A false-passing test caught a real bug

`near('0% loan solves to 0', got, 0)` passed while `got` was `null` —
`Math.abs(null - 0)` is 0. The solver was rejecting **every genuine 0%
loan**: it refused when `payment × months <= balance`, but exactly equal
is an interest-free loan, not a broken one. Promotional furniture,
dental and buy-now-pay-later balances are all exactly that shape.

Fixed to refuse only on a shortfall, return 0% on equality, and the test
helper now fails explicitly on null instead of coercing it.

## Verification

`test/v12.test.js` — 26 assertions: solver round-trips, the 0% and
shortfall cases, every agency threshold including the FHA-vs-Fannie
divergence at exactly 10 months, the lease block, the FHA 5% cap, and
that the two payoff rankings differ. Full suite now 143 assertions.
Bundle clean, rebuild idempotent.

**Not verified in a browser**, and one caveat worth stating plainly: the
tradeline parser is a first pass to save typing, not an authority.
Credit report layouts vary enormously and it guesses which figure is the
balance and which the payment. Every row is editable and the panel says
to confirm each against the report.
