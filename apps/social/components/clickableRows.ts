/**
 * The classes for a table whose whole row is a click target (the wrapper
 * that forwards a row click to the row's own link or button, FINDINGS 48).
 * The rows take the pointer. Their hover comes from `Table`'s `hasHover`,
 * which on a table that is not striped is Surface/Background Subtle, the same
 * fill as `ClickableCard`'s (FINDINGS 83).
 */
export const clickableRows = '[&_tbody_tr]:cursor-pointer'
