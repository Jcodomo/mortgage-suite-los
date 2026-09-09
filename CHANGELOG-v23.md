# Release 23

- Replaced the crowded Loan Suite tab wall with five workspace groups while retaining all fourteen original destinations as contextual tabs.
- Replaced the Income Calculator's nine equal-weight tabs with three workflow groups while retaining every original income, qualification, document, AUS, and summary screen.
- Consolidated Loan Suite toolbar controls into a compact Save action and one secondary Actions menu. Existing scenario, compare, import/export, printing, credit, LE, and document functions remain intact.
- Added two independent artistic appearance controls in the shared header: a four-palette page-theme control and a four-tone input-field control. Both work across the Income Calculator and Loan Suite.
- Collapsed duplicated Scenario Control Center inputs into an optional Quick Edit disclosure while keeping the linked calculation cards visible.
- Added off-screen rendering containment for long worksheet pages and removed nested scrolling from the Live Summary rail.
- Coalesced recurring presentation enhancement timers into one visible-page scheduler. Calculation handlers, validation, printing, and persistence logic remain unchanged.
- Stopped the legacy pay-statement decorators from repeatedly nesting the preview, eliminating a growing DOM/performance leak while preserving all four statement layouts.
- Retired duplicate theme and scenario controls after their replacement controls are installed, reducing action noise without removing the underlying functions.
- Tightened card, button, field, toolbar, and responsive spacing for a calmer desktop and mobile layout.
