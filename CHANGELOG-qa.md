# QA pass — cross-layer audit of v5-v9

No new features. Ten JS layers now interact through wraps and shared DOM;
this pass audited every unverified assumption between them and fixed what
was actually broken. Verdicts on things checked and found sound are
listed too, so the next session does not re-litigate them.

## Broken and fixed

1. **The report window's Save/Load .json buttons never existed.** v7
   targeted `.rpt-actions` / `.rpt-foot` / `.modal-foot`; the real bar is
   `.rpt-modal-bar`. The injection returned false on every poll since the
   day it shipped — the exact failure mode a guessed selector produces.
   They now sit before the Close button.
2. **v5 and v9 fought over the theme button.** v5's paint loop still ran
   its three-theme table every 650ms, so on OLED the icon snapped back to
   the sun twice a second and the tooltip read "undefined — click to
   cycle". v5 now hands paint to `V9.paintTheme` when v9 is loaded.
3. **Files dropped while OCR was busy were silently discarded.** v9's
   first draft kept the pending list in a closure and bailed when the
   worker was busy — and feeding several files one after another is
   exactly how the panel gets used. One shared queue now; the status line
   shows how many are waiting.
4. **Lock-extension dates had the same half-second picker window the tax
   panel had.** Conversion to free-form text ran on the poll, so after
   every commit the fields were date pickers again until the next tick.
   `LOCKEXT.render` is now wrapped and converts synchronously — the same
   cure v9 applied to `TAX.render`.
5. **The capacity card rewrote its innerHTML twice a second**, changed or
   not, killing hover states and wasting layout work on every tick. It
   now rebuilds only when a figure actually moved (and never while the
   cushion box holds the caret — the dead `__v7pending` path that
   deferred forever is gone).
6. **"deposit" matched the wrong money.** The earnest-money OCR pattern
   accepted the bare word, which hits "Initial Escrow ... deposit" and
   "security deposit" long before it means earnest money. Only explicit
   phrasings count now.
7. **Escape now closes things** — the report modal first, then whichever
   toolbar menu is open.

## Checked and sound (no change needed)

- `TAX === TAXPRO` (one object), so v9's wrap of `TAXPRO.render`
  intercepts patch-v2's internal `TAX.render()` calls too.
- v7's STRUCTURAL list matches the calculator's real select keys —
  `program`, `txn`, `occ` confirmed in the card markup, so program
  switching still gets its full re-render.
- v8's overflow-menu dedupe signatures match the real `moreMenu` markup
  (`closeMenu();importReno()` contains the signature).
- `DOCP.readFiles` exists for the v6 drop handler; `#i-up`/`#i-down`
  exist for the v7 buttons.
- No element id is created by more than one layer.
- v9's engine-reuse chain (`pdfText` → `pdfPageImages` → `ocrImages`) —
  all three are real globals.

## The polling load, measured rather than guessed

Thirteen `setInterval` sites across eleven files; the long-lived ones run
at 500-700ms. Each tick is now cheap — every recurring function either
early-returns on a marker or, after this pass, skips identical repaints —
so consolidation into one scheduler was considered and deliberately not
done: it would touch every file for a saving that no longer exists, in a
codebase where each layer owning its own loop is the established pattern.

## Verification

Full rebuild clean, bundle `node --check` clean, `inject.py` byte-
identical on re-run, all 54 unit assertions pass. Browser verification
still owed (Playwright blocked in this sandbox) — the report-bar buttons,
the theme hand-off and the OCR queue are the three to try first.
