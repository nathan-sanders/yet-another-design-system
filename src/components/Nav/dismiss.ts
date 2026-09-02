import type { MouseEvent } from 'react'

/**
 * Whether a click inside a nav overlay should close it.
 *
 * Both overlays in this family — `MobileNav`'s sheet and `SideNav.Group`'s
 * flyout — dismiss themselves when you pick a row, because one still standing
 * over the page after you have followed a link out of it is what makes the
 * pattern feel broken.
 *
 * **But not every click inside is a departure.** A `SideNav.Group` inside the
 * surface is a disclosure: pressing it expands the group *in place*, and the
 * first version of both overlays closed on it instead — so a parent section
 * could not be collapsed at all, only dismissed. Nathan found it in the sheet.
 *
 * `aria-expanded` is the test, and it is the right one rather than a
 * convenience: it is precisely the attribute that marks a control as toggling
 * something rather than going somewhere. Anything carrying it stays; everything
 * else is navigation and dismisses.
 */
export function dismissesOverlay(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target
  if (!(target instanceof Element)) return true
  return target.closest('[aria-expanded]') === null
}
