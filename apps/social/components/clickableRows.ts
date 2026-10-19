/**
 * The classes for a table whose whole row is a click target (the wrapper
 * that forwards a row click to the row's own link or button, FINDINGS 48).
 * The rows take the pointer and the hover every other clickable thing in the
 * app takes: `ClickableCard`'s Surface/Background Subtle, rather than the
 * Table's translucent `surface-overlay-subtle`, which is tuned for zebra
 * striping these tables do not use (FINDINGS 83).
 *
 * The descendant selector outweighs Table's own `hover:` class (0,2,2
 * against 0,2,0), so no `!important` is needed.
 */
export const clickableRows =
  '[&_tbody_tr]:cursor-pointer [&_tbody_tr:hover]:bg-surface-background-subtle'
