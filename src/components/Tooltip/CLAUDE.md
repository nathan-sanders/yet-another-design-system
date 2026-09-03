# Tooltip

A short label describing the thing you are pointing at. Mirrors Figma node
`40004073:20833`, which has **no variant set at all** — one look, no sizes, no colors, no arrow —
so there is not a single `tv()` variant. Everything interesting is behavior.
Third Base UI component and the **first that portals**, so it sets the pattern every later overlay
(Popover, Dialog, Select, Menu) will copy. Base UI supplies the lifecycle: hover/focus delays,
`role="tooltip"`, `aria-describedby`, Escape, collision flipping, and holding the node in the DOM
until the closing transition ends.
**API:** a wrapper, not a compound — `<Tooltip label="Copy link"><Button …/></Tooltip>`. `children`
goes to Base UI's `render`, so the caller's own element becomes the trigger instead of being
wrapped in a Base UI `<button>`; Button, Avatar and Badge all work unchanged. `Tooltip.Provider`
(shared hover delay across a toolbar) and the raw `Root`/`Trigger`/`Portal`/`Positioner`/`Popup`
are attached for controlled or externally-anchored tooltips.
`side`/`align`/`sideOffset` are **not** Figma variants and deliberately not `tv()` variants —
they are behavior, and they go to the positioner, which is what makes collision flipping work.
**First component to use the motion tokens:** `duration-fast` + `ease-standard`, fading and
scaling from `origin-(--transform-origin)` so it grows out of the edge nearest its trigger.
`data-[instant]:duration-0` covers the cases where animating is wrong — keyboard focus, dismissal,
and the second tooltip in a Provider group.
**A11y trap:** a tooltip *describes*, it does not name. It lands on `aria-describedby`, so an
icon-only Button still needs its own `aria-label` — which `ButtonProps` already requires at compile
time. A tooltip is never a substitute for a label.
**Wrapping trap:** Figma's text layer is `nowrap` because it is auto-width on canvas, but the frame
also carries `max-w-96` and `word-break: break-word`, which are dead properties unless the text can
wrap. It wraps.
**Height trap: 32px**, and the last 2px come from an inner Span frame with 1px of vertical padding.
Flattening it gives 30, and no round `py-*` splits the difference: 24 (line-height) + 2×1 (span) +
2×2 (popup) + 2×1 (border). **32px is the number to check** when this changes.

## Best practices

Mirrored from the **Best practices** block on `↪ Tooltip` (`40004242:15177`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it to describe what somebody is pointing at, in a few words.
- Give an icon-only control its own label as well. A tooltip describes; it never names.
- Share one delay across a toolbar with a Provider, so the second tooltip in a row does not make you wait again.

**Don't**

- Do not put anything somebody needs in order to finish the task in a tooltip. It cannot be reached by touch and it goes away.
- Do not put a link, a button or anything else interactive inside one.
- Do not repeat the label that is already on the control. A tooltip that says what you can already read is noise.
