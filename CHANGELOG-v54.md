# Release 54 (from 53.1)

Every item below was reproduced in Chromium before it was changed and re-verified after.

## Defects fixed
- **Page freeze on `tab=w2`.** `refresh()` and `renderScreen()` in the engine called each other forever when the store held a mode with no screen. The engine now compares the *resolved* screen id, routers send calculator tab ids to the calculator, and a persisted unknown mode is reset. This was the target of the shipped Income Calculator launcher, so a first-time visitor got a frozen tab.
- **Launchers led nowhere.** The old package's landing page redirected into a `dist/` folder that wasn't in the archive, and the archive held `mortgage-suite-los-v53.1.html` twice. Launchers are now the app itself; there are no redirects.
- **Tabbing through Renovation Budget switched Renovation back on** and added its amount to the loan (one case: $490,944 to $603,910).
- **Stale displayed values overwrote auto-synced ones.** After entering a down payment, the as-is value reverted to its old figure and stopped following the price, giving LTV 96% instead of 80%. Focus-out now commits only fields the user edited.
- **Clicking a tab shortly after a group button was overridden** (QUOTE landed on SETUP at a normal click pace). A real click now cancels pending re-assertions.
- **Blank paystub-end date produced `Infinity` qualifying income.**
- **Default scenario name began with "Unnamed".** With no borrower it is now `$Loan - LTV% - Rate% - Program`.
- **Deep links** `?app=income&tab=<calculator tab>` now land on that tab instead of W-2.
- **Visuals:** oversized black icon on Taxes & Escrow; Appearance control with a stacked duplicate and a clipped "Look" label; Rates button floating over the rail; unreadable Income Used figure.

## Performance (medians of 3 runs, same harness, original vs this build)
| | Loan Suite | Income Calculator |
|---|---|---|
| Ready | 1068 -> 945 ms (-12%) | 728 -> 652 ms (-10%) |
| First contentful paint | 528 -> 284 ms (-46%, range 228-476) | 456 -> 440 ms (-4%) |
| Startup main-thread task | 2102 -> 1974 ms (-6%) | 943 -> 877 ms (-7%) |
| Idle, left open (ms per 6 s) | 283 -> 228 ms (-20%, range 143-232) | 187 -> 93 ms (-50%, range 90-93) |
| File size | 2.82 MB -> 2.07 MB (-27%) | same file |

What changed: the shared scheduler slows its polling to an 8 s heartbeat after 10 s of load plus 4 s without user events or state changes, and snaps back within ~70 ms on any activity; JS and CSS are minified; the three CDN libraries (html2canvas, jsPDF, pdf.js) load after first paint or on first interaction instead of blocking the parser; the fonts stylesheet no longer blocks rendering. Network savings depend on the connection and were not measured.

What did not change: startup is dominated by ~200 style recalculations caused by layers interleaving DOM writes and layout reads. Only 124 of ~3,900 CSS rules are provably dead, so pruning was not worth the cascade risk and is not applied.

## Not changed on purpose
Documents & Worksheets, Draft LE and Documents & OCR live under the **Results** group (the v50 design). The metric figures still appear in several places on Quote; those cards are clickable navigation, so removing them is a design decision.
