# Mortgage Suite LOS — Release 53.1

The square beside the glyph.

## What it was

Not a failed icon — a failed `<use>` renders nothing at all. A square
means an element with a border, and release 23 draws one:

    .v23-nav-icon.i-full:before { inset:2px; border:1.5px solid currentColor; border-radius:3px }

So a leftover `.v23-nav-icon` span was still sitting in the tab, drawing
its pseudo-element art beside the new SVG.

## Why 53.0 did not catch it

53.0 cleared foreign icons, but only on the branch that runs when the
symbol **changes**:

    var have = t.querySelector('svg.icon.v53-ic');
    if (have && have.dataset.sym === want) return;   // settled — returns first
    ...clear foreign icons...

Once a tab was settled the function returned before reaching the
cleanup. That is fine for an icon present at first paint, and useless
against one added afterwards — which is exactly what happens: release 36
rebuilds the Assets tab on its own timer and re-inserts
`<span class="v23-nav-icon i-coins">` each time. The sweep ran once,
release 36 put the span back, and nothing removed it again.

## The fix

The sweep is now unconditional and runs **before** the settled check, so
anything re-added later is cleared on the next pass. A CSS backstop
hides foreign icon elements and their pseudo-art inside tab rows
outright, with borders, backgrounds and shadows zeroed — the new glyph
exempted by `:not(.v53-ic)`. Either mechanism alone would fix it; both
together mean a layer that re-adds an icon between passes cannot flash
a square in the gap.

## Tests

53 assertions on this layer. The ones that matter here assert ordering
rather than presence: that the clear happens, and that its index in the
function is **before** the early return — because a cleanup placed after
it is dead code that still reads as correct.

One assertion of mine was stale and was updated rather than the code: it
checked for the old reuse-one-slot line, which the sweep replaced.

**Not browser-verified.** The Assets tab in the calculator is the one to
check — it is the tab that re-adds its own icon, so it is where a
regression would appear first.

## Follow-up: blank Loan Suite workspace recovery

The retained Full-form layers hide the normal workspace while their
continuous worksheet is open. A browser session could restore the hiding
classes after the worksheet was gone, leaving the suite chrome on screen and
the workspace empty. Release 53.1 now clears only that impossible stale state
and reopens the Quote workspace. A real, visible Full worksheet is left
untouched.
