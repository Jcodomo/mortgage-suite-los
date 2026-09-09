# v9 — four themes, the stuck proration dates, suite-side OCR

Adds `src/patch-v9.js` + `patch-v9.css`. Neither engine touched.

## The prorated escrow section was stuck — here is why

v8 converted the seller-paid-through field from a date picker to text by
rewriting the DOM on a 500ms poll. Two things made that unusable:

1. `TAX.set()` ends in `TAX.render()`, which rewrites the panel's entire
   `innerHTML`. Every commit destroyed the field, and for up to half a
   second afterwards it was a date input again — so a typed date could
   land back in a picker mid-edit.
2. `mountTaxesInEscrow()` re-created the host and re-rendered the panel
   on any poll where the previous host had been detached by a screen
   re-render, which on the Escrow tab happens constantly.

Both are fixed properly: conversion now happens **synchronously inside a
wrap of `TAX.render`**, so the field is never briefly the wrong type, and
the re-render is **held while the caret is inside the panel** and flushed
on focusout. Dates parse tolerantly (`9/17/26`, `Sep 17 2026`); an
unreadable entry says so instead of being silently discarded.

Everything on the panel is free-form except the billing cycle and the
closing date, as specified.

**Seller-paid-through now seeds to closing + 1 day** — the normal opening
position, the seller having covered through the day before the buyer
takes over. Written once, only when blank, so it never overwrites a real
figure.

## Four themes

Navy → Dark → OLED → Light. `LOS.setSkin` already treated anything that
isn't `light` as dark, so the fourth skin needed only a cycle entry, an
icon and a token block.

OLED is **true #000**, not a near-black grey — an OLED panel spends no
power on a black pixel and `#0b0b0b` throws that away for nothing. Text
is stepped down from pure white, which smears on OLED at small sizes.

## Documents & OCR on the suite side

Its own tab and panel, deliberately **not its own engine**. The
calculator already loads pdf.js and a Tesseract worker; a second worker
would double the memory and run two recognisers over the same page for no
benefit. This reuses the loaded engine through `pdfText` /
`pdfPageImages` / `ocrImages`, **one file at a time** — the worker is
single-threaded, so queueing several at once only makes all of them
slower and the progress meaningless.

Each extracted figure gets a dropdown to assign it to a suite input, an
Apply button, and the surrounding text so you can check it. "Apply all
assigned" does the lot.

**AI prompt path**: no API key, because there should not be one in a
`file://` page. It builds a precise prompt from the document text, copies
it, and takes the JSON back — the same shape as the calculator's existing
extraction flow. Unknown keys in the returned JSON are ignored rather
than written blindly.

## A 100x bug caught before it shipped

`interestRate` is stored as a **fraction** (0.06875) while every document
prints **6.875**. The first draft of the OCR mapping wrote the printed
number straight through, which would have set a 687.5% note rate and
quietly poisoned every payment on the file. There is now a `SCALE` table
and a regression test.

Three field keys in that first draft were also invented rather than
checked: the engine has `propertyTaxAmount` (not `annualPropertyTax`),
`insuranceAmount` (not `annualHazardInsurance`), and splits the
concession into `sellerConcessionPct` / `sellerConcessionAmount` rather
than a single `sellerConcession`. All corrected against the engine's own
input defaults. `pushField` also stopped reimplementing dotted-path
walking badly — `setField(path, value, label)` already does it.

## Verification

`test/v9.test.js` — 15 assertions covering the unit scaling, the
corrected key names, and the closing+1 seed across month, year and leap
boundaries. Full suite passes; bundle syntax clean; rebuild idempotent.

**Not verified in a browser.** The theme tokens, the tax panel focus
handling and the whole OCR panel are DOM work. Two things to watch:
the OLED contrast at small sizes, and whether holding `TAX.render` during
focus leaves any figure visibly stale until blur — if so, the computed
boxes want repainting in place rather than the whole panel being held.
