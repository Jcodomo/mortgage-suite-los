# Mortgage Suite LOS — Release 41

Additive over 40, plus two source edits (noted). All 31 test files pass.
Layers V5–V41 present, build idempotent.

## The washed-out third row — found

The "All sections · Scenario control center · Quote · EXPAND ALL" strip
in the screenshots is release 3's section sub-strip. Release 4 removes
it on a poll; release 3 re-renders it on every mode change. The two
alternate, so it flickers in, unthemed — that is the broken-looking row.
It duplicates the context tabs above it. It is removed on sight and
hidden in CSS, so the suite is exactly two rows: the group nav and the
context tabs.

## The crushed icon bar — found

Release 40 appended its icon bar into whichever of two earlier
containers existed, both governed by other layers' flex and band rules.
Under the wrong one it collapsed to slivers. The bar now lives as the
last child of the masthead with every dimension declared on its own
elements with `!important`, so no ancestor can size it. The appearance
panel additionally closes with the `hidden` attribute, so an unloaded
stylesheet can never leave its swatches painted inline.

## The old nav icons — found

Release 23 draws its icons with `::before` and `::after` on the icon
span. Release 40's SVGs were inside that span, underneath them. The
pseudo-elements are off on redrawn spans, so only the octicon shows.

## Icons that stay

Nothing in the header hides its icon or label at any width. The small
bands from release 33 that dropped labels are overridden for the header
bar and the nav icons specifically.

## The suite at the calculator's dimensions

The calculator's canvas is **1560px**. Release 35 had pinned the suite
to 1320px — the "too narrow" body. Matched exactly, with the same
gutters, a 360px rail (400px above 1700px wide), and 22px between.

## The calculator's File actions — found

**Source edit, `patch-v26.css`.** A rule that hides nested menus inside
an actions grid was written without a `#suite-root` scope and so also
hit the calculator's File actions panel, leaving its nested Load menu
permanently `display:none`. Scoped to the suite. The calculator's panel
behaves as it did before release 26.

## Live summary — longer

The More-detail disclosure now opens by default (a stored preference
still wins). Added to release 40's sections: a **Status** block
(blocking and total warnings, appraisal state, value fit, rate-lock
expiry) and **Income needed** under FHA 31/43, Conventional 36/50 and VA
41 for the current payment and debts — the number people most often
have to back into. Every row opens the edit popout.

## Six colourways

**Source edit, `patch-v24.js`**: registered, with the dark ones added to
the dark-base test. Two neutral surfaces as asked — **Light gray** and
**Cloud grey** — and four from well-known palettes: **Nord**, **Dracula**,
**Solarized** (light) and **Linear**. All thirteen show as swatches in
the Look panel.

## Readability — measured

Every colourway's body text was checked against its page colour and
every one clears **7:1 (AAA)**; muted text clears **4.5:1 (AA)**. The
audit caught a pre-existing failure: Ledger's muted text was **3.92:1**,
under AA. Pulled to #56677A (5.16:1), same hue, one step darker. Rail
and chrome type sizes go up one step across the board.

"Return to Quote" is styled to the theme rather than left as a bare
button.

## Tests

`test/v41.test.js` — 37 assertions, including the contrast audit of all
nine themes, the strip flicker modelled, the width match, the icon
sizing, base classification for every theme, and the income-needed
arithmetic. The `v24-ui` theme-list test is updated for the longer list.

**Not browser-verified.** Look first at the group nav at 1024px, where
the redrawn icons and full labels have to fit on one row.
