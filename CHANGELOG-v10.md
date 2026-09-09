# v10 — rounding-out pass: agency strip, free-form everywhere, ZIP estimates,
#       live tax sync, condensed stips

Adds `src/patch-v10.js` + `patch-v10.css`. Neither engine touched.

## New

- **Agency strip on the W-2 tab.** The engine already runs the file under
  all four agencies (`agencySnapshot`) and picks the strongest — but only
  on the UW Summary. A compact strip now sits under the worksheets:
  qualifying income and back-ratio per agency, pass/fail, the strongest
  flagged with the snapshot's own reasons (gross-up caps, K-1
  distribution rule, asset depletion), and one-click Use. Repaints only
  when a figure moves.
- **Free-form numbers, everywhere.** `type="number"` rejects "$550,000"
  at the browser level, so free-form cannot be bolted on without changing
  the type. Every numeric input in both shells becomes text +
  `inputMode=decimal` (mobile keyboard stays numeric). A capture-phase
  listener strips `$`, commas and spaces before the engines' own inline
  handlers read the value; shorthand expands at commit — `550k`, `1.2m`,
  a trailing `%` — not per keystroke, because expanding mid-typing makes
  live figures lurch. Spinner arrows are the cost; in a sheet of dollar
  amounts they did nothing.
- **"Estimate from ZIP" on Property.** Uses the engine's own offline ZIP
  table through the store (`applyZipLookup`) — the module is sealed in
  the AMD closure, so the store is the honest way in. Fills only empty
  fields, labels everything an area estimate, never overwrites.
- **The annual tax figure syncs live, all directions.** Typed on the
  Escrow proration panel it now lands in the suite's
  `propertyTaxAmount`, the calculator's `S.loan.taxAnnual`, and the
  Property tab — payment, escrow aggregate and capacity card move
  together instead of on the next full sync.
- **Condensed stipulations.** Same conditions, fewer words — each line
  cut to the noun phrase a processor reads. The gift-letter stip is now
  conditional on gift funds actually existing.

## Defects found while verifying the draft, and fixed

- **The stip wrap never installed**: it checked `window.STIP`; the global
  is `window.STIPS`.
- **The gift filter read `S.assets.gift`, which does not exist** — assets
  live at `S.assets.rows` as typed records — so `N()` returned 0 and the
  gift-letter stip vanished on every file, including ones with gift
  funds. It now requires positive evidence (a gift-typed row with a
  balance) before dropping the line, and keeps it when it cannot tell.
- **Two dollar-stripping gaps with earlier layers**: v5's live-calc
  executor registers its capture listener before v10's stripper, so the
  first keystroke of "$550,000" would have committed as 0 until the next
  key; v5 now strips before executing. And v9's tax-panel fields were
  already `type=text`, invisible to v10's converter; `V9.setTaxNum`
  strips its own input now.

## Verification

`test/v10.test.js` — 12 assertions on the strip/shorthand pipeline
(including the motivating case: `N("$550,000")` really is 0 unstripped)
and the gift-row detection shape. Full suite now 81 assertions, all
passing. Bundle clean, rebuild idempotent.

**Browser check owed**, as with every DOM pass. First things to try: type
`$550,000` and `550k` into a price field, the agency strip on a file with
mixed income, and Condensed/Full on stipulations.

## v10.1 — theme parity across both shells

The four skins existed but the Loan Suite only half-received them, and
could not change them at all:

- **OLED on the suite was neither theme.** The suite runs on its own
  `#suite-root` variable set — 47 tokens. OLED had overridden four
  backgrounds and left the rest on the engine's dark values, so cards
  floated in `#131c2e` grey on a `#000` page. A complete token-for-token
  OLED block now exists; verified programmatically that all 47 tokens
  the engine's dark block defines are covered (navy's three missing
  shadow tokens inherit dark's, which is correct for a dark theme, and
  were left alone).
- **The theme control was calculator-only.** The toolbar button lives in
  the calculator's app bar, so from the Loan Suite there was no way to
  change theme. A second copy of the same control now sits on
  `#shellbar` — the mode-switch bar visible from BOTH shells — wired to
  the same `LOS.setSkin` and painted by the same painter, so the two
  buttons cannot drift. One `data-skin` attribute on `<html>` drives
  both shells, which is what keeps the skins synced by construction.

## v10.2 — Dark is now actually black

Two of the four skins were reading as the same theme at slightly
different brightness. The engine's dark palette is blue-tinted
throughout — `--bg:#0b1220`, `--surface:#131c2e`, an entire `--navy-*`
ramp — which put it within a few degrees of hue of the Navy skin.

Dark is now a neutral charcoal on both shells, so the set separates
cleanly by both hue and brightness:

| Skin | Suite background |
|------|------------------|
| Light | `#f4f6fa` |
| Dark  | `#121212` neutral, no hue |
| Navy  | `#0B1B33` blue |
| OLED  | `#000000` true black |

Only structural greys were neutralised. The amber input fields, green
pass states, warn reds and the blue accent are hue-carrying by design —
desaturating those would cost the colour-coding the sheet relies on.

Cycle order is Light → Dark → Navy → OLED, and the tooltips now name
them plainly ("Dark (black)", "Navy blue", "OLED true black") so the
current skin is identifiable without cycling through to find out.

## v10.3 — the Loan Suite gets all four skins in full

The suite renders from its own `#suite-root` variable set — 47 tokens,
separate from the calculator's. Coverage was uneven:

| Skin | before | after |
|------|--------|-------|
| Dark | 24/47 | 47/47 |
| Navy | 44/47 | 47/47 |
| OLED | 47/47 | 47/47 |

Dark was the visible problem: the 23 uncovered tokens fell through to
the engine's blue-tinted dark values, so a Dark file showed charcoal
chrome wrapped around navy-blue input, pass, warn and final panels —
two palettes in one screen. Those tokens are now re-based on the
charcoal ramp. The hues are kept (green still means pass, amber still
means an input cell); only the blue cast underneath them is gone, along
with the blue tint in the shadows.

Navy's three shadow tokens were inherited from the engine's dark block
rather than declared. They are stated explicitly now, so no skin depends
on inheriting from another skin's palette — the failure mode that made
Dark look half-themed in the first place.

Verified in the built file rather than assumed: the skin blocks land
after the engine's block *and* carry higher specificity
(`html[data-skin] #suite-root` = 1,1,1 against `[data-theme] #suite-root`
= 1,1,0), so they win on both order and specificity.

## v10.4 — enterable cells read as lighter than the surface

The sheet leans on the spreadsheet convention the suite's own legend
states: a tinted cell is one you type into, a flat one is calculated.
That only works if the input tint is visibly lighter than its panel. It
was not. Measured lift (perceptual luminance, input surface minus panel):

| skin | before | after |
|------|--------|-------|
| dark suite | +4.8 (invisible) | +28.8 |
| dark calc | +12.5 (faint) | +28.8 |
| navy both | +13.6 (faint) | +27.4 |

Checked rather than eyeballed. Typed text on the new surfaces is 11.1:1
(dark) and 9.3:1 (navy) — comfortably AAA. The borders were then raised
to clear the 3:1 WCAG floor for non-text boundaries against their panel
(dark 2.83 → 3.70, navy 3.19 → 3.80), because the fill is a low-contrast
cue on its own and the border is what carries the field edge on a busy
screen.

Two skins deliberately untouched:

- **OLED**, as asked — its point is minimum emission on black, and a
  lifted input surface would become the brightest thing on screen.
- **Light**, because its input is a warm cream *darker* than the white
  panel. On white there is nowhere lighter to go, so the convention
  inverts and the tint carries the signal by itself. Lifting it toward
  white would erase the distinction rather than strengthen it.

## v10.5 — the theme button on every piece of chrome

The control now exists in three places, because there are three pieces of
chrome and none of them is on screen at all times:

| mount | id | shell |
|-------|----|-------|
| calculator app bar | `v5ThemeBtn` | Income Calculator |
| mode switch bar | `v9ShellTheme` | both |
| Loan Suite toolbar | `v9SuiteTheme` | Loan Suite |

Previously only the first two existed, and the calculator's own bar
(`#losBar`) is mounted inside `#calc-root .appbar` — so with the suite
open there was no theme control in the suite's own chrome at all.

**Sync is structural, not messaged.** No button holds state: each reads
the current skin, computes the next from one shared `NEXT` map, and
commits through `LOS.setSkin`, which writes a single `data-skin`
attribute on `<html>`. Both shells' CSS keys off that one attribute, so
pressing any button repaints everything at once and the three buttons
cannot disagree — there is nothing for them to disagree with. The
existing MutationObserver still re-asserts the skin if either engine
flips `data-theme` on its own.

`test/theme.test.js` — 14 assertions pinning the cycle order
(Light → Dark → Navy → OLED), that every skin has a label and a
successor with no dead ends, that all three dark skins carry
`data-theme=dark` so the engine's dark rules still apply beneath the
skin overrides, and that pressing any of the three mount points leaves
both shells reading the same skin.
