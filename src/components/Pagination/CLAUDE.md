# Pagination

A row that says where you are in a data set and moves you through it. Mirrors the Figma component
`Pagination` (`40004379:65925`) on the page `↪ Pagination` (`40004379:65701`).

**Asked for directly, like Calendar.** The roadmap's bar is that an entry earns its build when the
file draws it *and* something has been reinvented in its absence. Only the first half was true here.
That bar governs what to build next when nobody is asking; it was never a gate on what somebody
asks for.

**It takes counts, not rows.** `totalItems`, `page`, `pageSize` and three callbacks — nothing in the
component knows what is being paged, and the caller does the slicing. It was asked for to sit under
a `Table`, and it does, but the same bar pages a product grid or a page of search results without
changing. A `data` prop would have made it a table component with a table's problems.

**It is a sibling of `Table`, and that was already decided.** `Table`'s record had this under
*Deferred, deliberately* — "`rowCount`/`rowIndexStart` is the hook a paginated view would use; do not
invent the component here" — and those two props are still the entire join. There is no `pagination`
prop on `Table` and no slot for one. Figma draws the bar with no border, no background and no
padding, so it sits **outside** the table's rounded scroll region, and `Table.Footer` stays what it
was: a `<tfoot>` for a totals row, not a home for a Select.

**The four booleans are Figma's, by name and by nesting.** `Range of Items` → `hasRange`,
`Page Size Select` → `hasPageSize`, `Page Navigation` → `hasNavigation`, `Current Page Selection` →
`hasPageJump`. In the file the previous/next frame lives *inside* the frame that `Page Navigation`
hides, so `hasNavigation={false}` takes the arrows with it. That is kept rather than flattened into
four independent switches, because the two halves of the right-hand group are one thing — where you
are, and how you leave.

**`Range of Items Text` is not a prop, and the reason generalizes.** Figma exposes the string
because a canvas has no data behind it and somebody has to be able to type "1 – 10 of 100 items" in.
In code the numbers are right there, and a caller-supplied string is a string that can disagree with
them. A Figma TEXT property is a drawing mechanism; it is not automatically an API.

**The separator is an en dash, read off the node.** `characters` codepoint `8211`, spaced both
sides — not a hyphen, not an em dash. At 14px all three are the same three pixels, so `labels.test.ts`
asserts the codepoint rather than trusting the glyph.

**The arithmetic is a separate pure module, and it is the part that can be wrong.** Every way this
component fails renders perfectly: "91 – 100 of 95 items" is laid out correctly and is a lie. So
`labels.ts` holds `pageCount`, `clampPage`, `pageBounds` and the three strings, and it is tested in
the node project the way `Table/rows.ts` is. Three cases the file does not draw and nothing would
have caught: the last page is short (95 items ends at 95), a page holding one item collapses to
`91 of 91 items` rather than `91 – 91`, and an empty set still has a page 1 — because "page 0 of 0
pages" reads as a component that failed to load rather than as a table with nothing in it.

**The page jump is a Select at every page count**, which is what the file draws, and the cost is
worth stating rather than engineering around: 500 pages is 500 options in the popup. The alternative
considered and rejected was swapping to `NumberInput` past a threshold. A component that changes
shape depending on how much data it was handed cannot be documented, cannot be screenshotted, and
teaches a user one control and then another. `hasPageJump={false}` is the escape hatch, and it
leaves previous/next and the range.

**Changing the page size returns you to page 1.** The clever alternative is to keep the first
visible item in view — page 3 at 10 per page becomes page 1 at 50. It answers a question nobody
asked and moves the page number to a value the user did not choose. `onPageChange(1)` fires
alongside `onPageSizeChange`, so a controlled caller is told.

**`ml-auto`, not `flex-1`, and the difference is the narrow case.** Figma's `Page Navigation` frame
is FILL with `primaryAxisAlignItems: MAX`. Translated as `flex-1` that becomes `flex-basis: 0%`,
which lets the group squash below its own content before the row ever wraps — the buttons ride up
against "of 10 pages" and nothing moves to a second line. An auto margin absorbs the free space on
whichever line the group lands on, so it is flush right on row one and flush right on row two.

**Wrapping is the whole of the narrow-width answer.** The file draws one fixed 600px row and a side
panel does not have 600px. `flex-wrap` plus `gap-2` — which is Figma's `itemSpacing` *and* its
`counterAxisSpacing`, both `spacing/2`, so the row gap is specified rather than guessed — keeps every
control. Dropping the range text and then the page size was the alternative, and it hides
information to save a line. The `Narrow` story measures the wrap, because a screenshot of two rows
and a screenshot of one squashed row are both "it rendered".

**The text is not mono.** `Table` and `Metric` give a number `font-mono tabular-nums`; these two runs
stay `text-base` in Inter at `Content/Subtle`, as the file binds them. They are sentences containing
numbers, not a column of figures that has to line up with the figures above it.

**The range is a polite live region.** `aria-live="polite"` with `aria-atomic`, so paging announces
"11 – 20 of 100 items" rather than leaving a screen reader to go looking for what changed. Both
Selects name themselves — `Items per page` and `Page` — rather than borrowing "of 10 pages" through
`aria-labelledby`, which would name a control after the sentence that follows it.

## What was left out

- **A numbered page list** — 1 2 3 … 10 as buttons, with an ellipsis. Every other library has one;
  the file draws a Select instead, and the Select is the same affordance without the truncation
  algorithm nobody agrees on.
- **First / last buttons.** Not drawn. The page Select already jumps anywhere in one action, which
  is what a "last page" button is for.
- **A size prop.** There is no `Size` axis in the file. Every control in the bar is at its default
  32, and a 24px pagination bar is not a thing anybody has asked to draw.
- **Loading and disabled states.** Neither is drawn. A caller who is fetching can disable the bar's
  container; inventing a state here would put a new visual idea in the wrong place.
- **Slicing.** No `data` prop, no `items` prop, no render callback. The caller has the array.

## Best practices

Mirrored from the **Best practices** block on `↪ Pagination` in Figma. The two are one text in two
places — change one and change the other.

**Do**

- Put it directly under the thing it pages, outside that thing's border. It draws no chrome of its own so it reads as belonging to what is above it.
- Wire it to `Table` with `rowCount` and `rowIndexStart`. Without them a screen reader announces "row 3" on page 4, which is true of the page and false of the data.
- Give every bar on a page its own `aria-label`. Two landmarks called "Pagination" are indistinguishable in a landmark list.

**Don't**

- Do not use it for a set somebody would rather scroll. Under a screenful of rows, paging adds a decision without removing any work.
- Do not hide the range to save space. It is the only part that says how much there is, and the bar wraps rather than shrinking for exactly that reason.
- Do not leave the page jump on for thousands of pages. Past a few hundred the Select is a wall of numbers — turn it off and leave the arrows and the range.
