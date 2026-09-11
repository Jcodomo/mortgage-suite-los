# Mortgage Suite LOS — Release 38

## Live Summary — one summary, not three

The rail in the screenshots carried the same figures two and three
times over, with a raw `&amp;` in one of them. That was release 29's
extra block: it appended to the rail's **card**, while release 36 trimmed
the rail by walking the card's **body** — so the block was never seen by
the trim and leaked out underneath, and its own escaper ran over text
that was already escaped.

Release 29's block is retired. The parts worth keeping — ratios against
their caps with a headroom bar, what mortgage insurance costs and when it
stops, the rounded payment range, reserves — move into the live-details
section as the same clickable rows release 35 uses, so every one of them
opens the existing edit popout with an "open the workspace" button. No
second click handler.

Rows that would only say "nothing entered" are not rendered. A ratio of
0.0% against a 50% cap with "50% of room left" is not information. For
FHA, the MI row says plainly that MIP runs the life of the loan at this
LTV rather than printing a cancellation figure that will never happen.

Warning bodies were rendering at 8px; they are 11px with room now. The
programme badge in the summary header was unreadable on light surfaces.

## OCR — the document families a real file actually contains

Two complete loan files were supplied for training: **177 documents**
across a New York purchase and a Florida purchase. Only their **label
vocabulary** was used — the phrases a form prints beside its figures —
and nothing from them is embedded in the build. No name, figure, account
or address. The government IDs and Social Security cards were not
opened.

The classifier now recognises 23 families beyond the engine's income
set: bank statements, asset verifications (AccountChek), IRS
transcripts, DU/LPA findings, credit reports and supplements, insurance
binders and policies, title bills, commitment/approval letters,
contracts of sale, leases, letters of explanation, Work Number
verifications, award letters, Form 1098, contractor estimates, Loan
Estimates, Closing Disclosures, the 1003, appraisals and K-1s.

Two things the training set made plain:

- **Most of these arrive scanned with no text layer** — the W-2s, 1040s,
  1003, appraisal, contract, lease, insurance policy, award letter.
  Recognition has to survive OCR output, so every signature is tolerant
  of spacing and case and **needs two or three hits, not one**. Stress
  tested with simulated OCR noise: 8 of 8 families still classify at 8%
  character corruption, 6 of 8 at 12%.
- **A signature must be a form label, never a name.** "Earnings
  Statement" identifies a paystub on any employer's form; an employer
  name identifies one employer.

Against the real text-layer training documents: **17 of 17** classify
correctly once two gaps were closed. The commitment letter never uses
the word "commitment" — it is an approval letter, and is now matched on
what one actually states. And one file named "MortgageStatement" was a
**Form 1098**; content wins over filename, and 1098 is its own family.

The engine's `classify()` is wrapped, not edited; its `DOC_TYPES` is
extended in place so every new family renders a label.

## MISMO 3.4 import

The Florida file included a `LoanSnapshot.xml` — MISMO 3.4 URLA with the
ULAD extension, which is what every current LOS exports. Drop one
anywhere a document is accepted and it loads borrowers, current
employment, income, assets (account numbers masked to the last four),
liabilities, the subject property and the loan terms into **both**
shells. Every write is labelled "MISMO import" in the audit trail, and
**nothing that already holds a non-zero value is overwritten**.

The note rate is converted on apply (6.875 → 0.06875), never on parse —
the same 100× trap as everywhere else, guarded the same way. A document
that is XML but not MISMO is refused, not guessed at.

## ZIP lookup on every field

Every ZIP input in either shell resolves city, state and county the
moment five digits are committed. Two sources, in order: zippopotam.us
(free, no key, cross-origin) for city and state; HUD's USPS crosswalk for
county and FIPS when a HUD token is on the file — skipped, not failed,
without one. **Only empty sibling fields are filled.** A city someone
typed is never replaced by a lookup.

## State that survives refresh and back

Both engines already persisted their data. What did not survive was
*where you were* — shell, tab, scroll — and the back button
specifically, which restores from the back/forward cache with the
enhancement scheduler asleep. Position is now saved on navigation and on
`pagehide`, restored on load and `pageshow`, and a cache restore re-arms
the scheduler. Both engines' autosave is flushed on the way out.

## Motion and performance

Rows, popouts and menus have brief eased transitions, and **none at all
when the OS has reduced motion on**. The layer registers with the shared
scheduler rather than running its own timer; the scheduler already
coalesces the earlier layers' intervals into one visible-page task, so
there was no timer sprawl left to remove.

## Verification

`test/v38.test.js` — 50 assertions: all 23 families on synthetic label
text, the two families that share words kept apart, a one-hit case
correctly refused, the MISMO parser on a synthetic document including
account masking and the rate conversion, non-MISMO XML rejected, rail
gating, the double-escape reproduced, and ZIP fill-if-empty.

All **28 test files pass** through `test/run-all.js`. Built through
`build/inject.py`, idempotent on rebuild, every layer V5–V38 present.

**Not browser-verified in this pass.** The repo's own `verify:browser`
harness needs Chromium, which this sandbox cannot download. Worth
running first: a scanned W-2 through the OCR path, and a real
`LoanSnapshot.xml` from your LOS.
