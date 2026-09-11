# Mortgage Suite LOS — Release 43

Additive over 42, plus three small source edits (noted). All 33 test
files pass. Layers V5–V43 present, build idempotent.

## Pages that had lost their route

Auditing every destination against every route found four pages with no
way in: **Property, Mortgage Rates, Advanced and Documents & OCR**.
Releases 34, 37 and 40 each took their tabs out of the context row to
avoid duplicating the direct-nav buttons — then the direct buttons went
too, and nothing was left. Three more — **Taxes & proration, Credit,
Contract & LE** — never had a tab at all.

All seventeen destinations now sit in the group they belong to:

    File          Quote · Setup · Property
    Loan          Renovation · Max mortgage · Mortgage rates
    Costs         Closing · Escrow · Taxes & proration
    Underwriting  Qualify · Rental · Credit · Advanced · Contract & LE
    Results       Scenarios · Summary · Documents & OCR

**Source edits:** release 23's group lists carry the three new tabs so
its own filter shows them; releases 34 and 40 stand down when 43 is
present so they stop hiding what 43 restores. The tests assert every
page is placed exactly once.

## The menus — the File-actions design, reorganised

Release 23's File actions panel — a grid of cards, an icon and a label
each — is the design that reads well. The header menus use it, one type
size smaller so a whole group fits without scrolling, with an octicon
per card.

Grouped by what the person is doing, not by which layer added the
button:

- **File** — Save · Save scenario as… · New · Reset · Export JSON ·
  Import JSON / AI. Nothing else. The "anything unlisted lands in File"
  fallback from 42 is gone; the full inventory belongs under Actions.
- **View** — Full form · All pages · Look & theme · Return to Quote
- **Documents** — Print (Print / PDF, Print summary) · Generate (Print /
  Generate, Draft LE, Draft Schedule C, Profit & Loss, Income Report) ·
  Open (Documents & OCR, Contract & LE)
- **Loan tools** — Underwriting (Credit review, Rule tables,
  Recalculate) · Pricing & costs (PMI / FHA MIP, Renovation fees, Lock
  extension, Taxes & proration, Mortgage rates)
- **Compare** — opens the Scenarios page and its comparison
- **Live** — the live scenario comparison, directly
- **Actions** — everything, as before

## The rail — twice as long

Derived from the engine's outputs and plain arithmetic on them:

- **Amortization** — year-1 interest and principal, total interest over
  the term, balance after 5 and 10 years, the payoff date. Checked
  against the reference LE: the schedule reproduces its $4,043.92 P&I
  to the cent, and year-1 interest plus principal equals twelve payments.
- **Mortgage insurance over its life** — FHA MIP across the term plus
  the upfront; conventional PMI run month by month until the balance
  crosses 78% of the original value, with the years it takes.
- **Escrow account** — initial deposit at closing, monthly escrow,
  cushion, and any projected shortage.
- **Warnings** — the first four, each with its message.
- **Income by borrower** — when the calculator has it, plus liabilities.
- **Scenario** — name, as-of, closing date, last change.

Every row opens the edit popout or its workspace.

## Tests

`test/v43.test.js` — 21 assertions: all seventeen pages placed exactly
once, the four lost pages routed again, release 23's lists extended,
File holding only file-level actions with no fallback, Documents' three
sections, Live and Compare wired to the right targets, and the
amortisation on the reference loan.

**Not browser-verified.** Look first at the Underwriting group, which
now carries five tabs on one row, and the Loan tools menu at its
smaller type size.
