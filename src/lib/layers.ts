/**
 * The library's one stacking layer.
 *
 * ## What it is for
 *
 * A portalled popup — Tooltip's, Menu's, Select's, Combobox's — is appended to
 * `<body>` *after* the page it covers, and it is tempting to think that settles
 * it. It does not. Painting order puts every positioned element with a
 * **positive `z-index`** above every positioned element with `z-index: auto`,
 * whatever the document order, so a popup left on `auto` is punched through by
 * any `z-10` on the page.
 *
 * That is not hypothetical. It was found on 2026-08-19 with the library's own
 * parts: `Token.Remove` is `relative z-10` — it has to be, to sit above the
 * clickable overlay inside a Token — so the `x` on every token in the fields
 * *below* an open Combobox floated on top of its menu. One screenshot, three
 * crosses hanging in mid-air over the list.
 *
 * ## Why 40, and not 50
 *
 * `Toast`'s viewport is `z-50`, and it should stay the top of the library: a
 * toast is a system message, and a menu that hides one is worse than a menu
 * behind one. Putting popups at 40 makes that ordering deliberate rather than a
 * question of which element happened to mount last.
 *
 * ## Where it goes
 *
 * On the **Positioner**, not the Popup. The Positioner is the element Base UI
 * actually positions; a z-index on the Popup inside it would be scoped to a
 * stacking context the Positioner never establishes.
 *
 * One constant rather than a number written out in four components, for the
 * reason `focus.ts` exists: a value that has to agree across the library agrees
 * more reliably when there is only one of it.
 */
export const overlayLayer = 'z-40'

/**
 * The layer a viewport-pinned navigation bar sits on.
 *
 * `MobileNav` fixes itself to the top or bottom edge of the screen, which puts
 * it in the same argument this file exists for: a `fixed` element left on
 * `z-index: auto` is punched through by any positioned `z-10` on the page.
 *
 * **30, and the gap below 40 is the point.** The bar has to sit *under* the
 * scrim of its own bottom sheet — Figma's bottom placement draws the open sheet
 * covering the bar completely — so it cannot share `overlayLayer`. Below the
 * popups, above the page: 30 says both at once.
 */
export const navLayer = 'z-30'
