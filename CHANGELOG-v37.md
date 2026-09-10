# Mortgage Suite LOS — Release 37

## Header and scrolling corrections

- Removed the competing sticky positions that caused Income Calculator fields and Loan Suite totals to show through the header while scrolling.
- The shared shell remains pinned at the top; each workspace now keeps only its primary and secondary navigation beneath it.
- Upper identity, scenario, KPI, and action rows scroll away normally, leaving more usable worksheet height.
- Sticky offsets are measured from the rendered shell and navigation heights, so wrapping or theme changes do not reintroduce overlap.
- Full-form navigation remains within the Loan Suite navigation stack, and direct links now land below the pinned rows.

## Quality-of-life polish

- Added a two-pixel scroll-progress indicator to the shared shell without introducing another button.
- Gave the long Live Summary a contained, thin scrollbar and predictable viewport height.
- Removed duplicate Property, Mortgage Rates, Advanced, and Documents links from the Loan Suite context row while retaining their primary navigation destinations.
- Standardized visible keyboard focus for fields and buttons.
- Mobile layouts release sticky positioning to preserve vertical space.

## Verification

- All 27 automated test files pass.
- Browser checks confirmed collision-free header geometry for both workspaces while scrolled, no horizontal overflow, and no console errors.
- The complete Loan Suite Full view exposes all 14 pages with 1,564 editable text/textarea controls and no native number, date, or range inputs.
