/**
 * The rule that decides whether a cell's contents are a number.
 *
 * ## Why this is derived and not a prop
 *
 * The root record's rule is to derive a variant instead of adding a prop where
 * the value already says it — and a cell holding `42` already said it. A
 * `numeric` prop on every cell would be a prop that can contradict its own
 * children, and in a table of a thousand cells it is a prop somebody will
 * forget on one of them. So `Table.Cell` asks this function instead.
 *
 * ## Why `typeof`, and not a regex over the text
 *
 * React hands a single numeric child through as a `number`, and two children
 * arrive as an array — so `{42}` is a number and `{['$', 42]}` is not. That is
 * a precise line, and precise is what this needs to be: the tempting version
 * sniffs the rendered text for digits, which also catches order ids, years in a
 * sentence, "3 of 5", and a phone number, with no way to opt any of them out.
 *
 * A value that *is* digits but arrives as a string — `"$1.2M"`, `"82%"`,
 * `"12,400"` — is what the column's `numeric` flag is for. The column knows it
 * is a money column; the cell only sees a string.
 */

/**
 * Whether a cell's children are a real, finite number.
 *
 * `Number.isFinite` and not a bare `typeof`: `NaN` and `Infinity` both render
 * as *words*, and setting a word in tabular figures is wrong for the same
 * reason setting a name in them would be. Same guard, for the same reason, as
 * `HeatMap`'s `scale.ts` — a non-finite number is not a measurement.
 */
export function isNumericChild(children: unknown): boolean {
  return typeof children === 'number' && Number.isFinite(children)
}

/**
 * What a cell actually asks: the column's flag if it set one, the derivation
 * otherwise.
 *
 * `??` and not `||`, so a column can say `numeric={false}` and mean it — an
 * explicit override loses to nothing, including to a cell holding a number.
 */
export function resolveNumeric(columnNumeric: boolean | undefined, children: unknown): boolean {
  return columnNumeric ?? isNumericChild(children)
}
