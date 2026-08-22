/**
 * The library's one focus indicator.
 *
 * ## What it draws
 *
 * Two concentric strokes, **both outside the component**: a 2px gap in
 * `focus/focus-inner-border` (white in light mode, stone-900 in dark — the
 * canvas colour, so it reads as a gap), then a 3px ring in
 * `focus/focus-outer-border`. Nothing is drawn on or inside the component
 * itself, so the thing you focused looks exactly the same as it did before.
 *
 * ## Why it is not a border
 *
 * This started life as `focus-visible:border-2` on a 1px border, which grew
 * every hug-width component by 2px the moment it took focus — the button grid
 * visibly re-flowed as you tabbed through it. Every component then invented its
 * own way round that (`inset-ring`, an inset `outline`, a transparent 1px border
 * at rest), which is why five components had five different focus idioms.
 *
 * A ring and its offset are both `box-shadow`, so they cost no layout at all and
 * the problem cannot come back. They also follow `border-radius`, so a pill, a
 * circle and a 6px-rounded box each get the right shape for free.
 *
 * ## Why `outline` is left alone
 *
 * `outline` is spoken for elsewhere — Avatar draws the canvas ring that
 * separates overlapping avatars with it — and `outline-none` here would fight
 * that. Keeping focus on `ring` keeps the two independent.
 *
 * ## Why the classes are written out twice
 *
 * Tailwind finds classes by scanning source text, so a variant cannot be
 * composed at runtime: `` `focus-visible:${ring}` `` produces a class that is
 * never generated and silently paints nothing. Both lists are spelled out in
 * full for that reason — keep them in step.
 */

/** The ring on the focused element itself, keyboard-only. */
export const focusRing = [
  'outline-none',
  'focus-visible:ring-3 focus-visible:ring-focus-focus-outer-border',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-focus-focus-inner-border',
]

/**
 * The same ring, suppressed on the element the pointer is resting on.
 *
 * For a list whose rows **take focus because you pointed at them** — a menu, and
 * anything else built on Base UI's `highlightItemOnHover`. There, `:focus-visible`
 * alone is not a safe proxy for "the keyboard put you here".
 *
 * ## The bug this exists to stop
 *
 * Chrome decides `:focus-visible` for a *scripted* `.focus()` by asking what the
 * last user interaction was. Hovering a menu row calls `.focus()` on it, so the
 * answer is whatever happened before the mouse moved — and if that was a
 * keypress, the row lights up with a full keyboard focus ring under the cursor.
 * Measured in both menus: open a `Menu` with Tab then ArrowDown and hover a row,
 * and the ring follows the mouse.
 *
 * `ContextMenu` has it on *every* hover rather than only after a keypress,
 * because its trigger is a plain `<div>` that never takes focus — so a
 * right-click leaves focus on `<body>`, no pointer interaction ever moves it,
 * and every scripted focus afterwards reads as keyboard.
 *
 * ## Why `:not(:hover)` is the rule and not a workaround
 *
 * The ring means "the keyboard put you here". On the row the pointer is already
 * on, that is not what it means, and the row is not left unmarked either — the
 * hover background says where you are. Arrow away from a parked mouse and the
 * ring appears on the row you moved to, correctly, because that row is not the
 * hovered one.
 *
 * Do not fold this into `focusRing`. On a Button the two are independent: a mouse
 * that happens to rest over a button you tabbed to should not swallow its ring,
 * because the hover did not cause the focus. Here it did.
 */
export const focusRingUnhovered = [
  'outline-none',
  'focus-visible:not-hover:ring-3 focus-visible:not-hover:ring-focus-focus-outer-border',
  'focus-visible:not-hover:ring-offset-2 focus-visible:not-hover:ring-offset-focus-focus-inner-border',
]

/**
 * The ring on an ancestor — the card round a Checkbox or Radio — when the
 * control inside it takes focus.
 */
export const focusRingWithin = [
  'has-focus-visible:ring-3 has-focus-visible:ring-focus-focus-outer-border',
  'has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-focus-focus-inner-border',
]
