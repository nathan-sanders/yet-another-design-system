import { useMemo, useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Select } from '../Select'
import {
  clampPage,
  pageCount,
  pageCountLabel,
  pageSizeLabel,
  rangeLabel,
} from './labels'

/**
 * Pagination — move through a data set one page at a time.
 *
 * Mirrors the Figma component "Pagination" (node `40004379:65925`): a row of
 * four parts, each of which the file makes a boolean property.
 *
 *     <Pagination totalItems={100} defaultPageSize={10} />
 *
 * **It takes counts, not rows.** Nothing here knows what is being paged. The
 * component was asked for to sit under a `Table`, and that is what the
 * `WithTable` story shows, but a product grid or a list of search results pages
 * exactly the same way — so the API is `totalItems`, `page`, `pageSize` and
 * three callbacks, and slicing the data stays the caller's job.
 *
 * **It is a sibling of `Table`, not a part of it.** `Table`'s record parked this
 * under *Deferred, deliberately* — "`rowCount`/`rowIndexStart` is the hook a
 * paginated view would use; do not invent the component here" — and those two
 * props are still the whole of the wiring. The bar draws no border and no
 * background, exactly as Figma draws it, so it sits **outside** the table's
 * rounded scroll region rather than inside the `<tfoot>`, where a Select would
 * be a form control nested in a table cell.
 *
 * **The four booleans are Figma's, by name.** `Range of Items` → `hasRange`,
 * `Page Size Select` → `hasPageSize`, `Page Navigation` → `hasNavigation`,
 * `Current Page Selection` → `hasPageJump`. The nesting is the file's too:
 * turning off `hasNavigation` takes the previous/next buttons with it, because
 * in Figma they live inside the frame that property hides.
 *
 * **`Range of Items Text` is not a prop.** Figma exposes the string so a
 * designer can retype it on a canvas that has no data behind it. In code the
 * numbers are right there, and a caller-supplied string is a string that can
 * disagree with them — so it is derived. See `labels.ts`.
 *
 * **The page jump is a Select at every page count**, which is what the file
 * draws. It has a cost worth stating rather than engineering around: 500 pages
 * is 500 options in the popup. The alternative considered was swapping to
 * `NumberInput` past a threshold, and it was turned down because a component
 * that changes shape depending on how much data it was handed is a component
 * nobody can document, test or learn. If a caller genuinely pages through
 * thousands, `hasPageJump={false}` leaves previous/next and the range.
 */

/**
 * The bar.
 *
 * `gap-2` is Figma's `itemSpacing` **and** its `counterAxisSpacing`, both
 * `spacing/2` — so the gap between the wrapped rows is specified, not guessed.
 *
 * **`flex-wrap` is the whole of the narrow-width story.** The file draws one
 * fixed 600px row; in a side panel or on a phone that row has to go somewhere.
 * Wrapping keeps every control and hides nothing, which the alternative —
 * dropping the range text, then the page size — does not.
 */
const root = tv({
  base: 'flex flex-wrap items-center gap-2',
})

/**
 * The right-hand group. Figma's `Page Navigation` frame: FILL, `layoutGrow 1`,
 * `primaryAxisAlignItems: MAX`, `itemSpacing` `spacing/4`.
 *
 * **`ml-auto`, not `flex-1`.** `flex-1` sets `flex-basis: 0%`, which lets this
 * group squash below its own content before the row ever wraps — the buttons
 * ride up against the "of 10 pages" text and nothing moves to a second line.
 * An auto margin absorbs the free space on whichever line the group lands on,
 * so it is flush right on row one and still flush right on row two. That is
 * Figma's FILL + MAX in the one form that survives wrapping.
 */
const navGroup = tv({
  base: 'ml-auto flex items-center gap-4',
})

/** Figma's `Current Page` frame — the Select and the count beside it. */
const jumpGroup = tv({
  base: 'flex items-center gap-2',
})

/**
 * Figma's `Previous Next Page` frame, at `itemSpacing: 0`. The two ghost
 * buttons touch; their own padding is the space between the arrows.
 */
const stepGroup = tv({
  base: 'flex items-center',
})

/**
 * Both text runs. `text-base/normal` at `Content/Subtle`, as the file binds
 * them.
 *
 * **Not `font-mono tabular-nums`,** which is what `Table` and `Metric` give a
 * number. Figma sets these in Inter, and it is right to: these are sentences
 * that contain numbers, not a column of figures that has to line up with the
 * figures above it.
 */
const text = tv({
  base: 'text-base text-content-subtle',
})

/** Figma draws `10 per page`; these are the sizes it is drawn with. */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export interface PaginationProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children' | 'onChange'> {
  /** How many items there are in total, across every page. */
  totalItems: number
  /** The current page, 1-based. Controlled when set. */
  page?: number
  /** The starting page when uncontrolled. */
  defaultPage?: number
  /** Fires with the new page. Also fires with `1` when the page size changes. */
  onPageChange?: (page: number) => void
  /** Items per page. Controlled when set. */
  pageSize?: number
  /** The starting page size when uncontrolled. */
  defaultPageSize?: number
  /** Fires with the new page size. */
  onPageSizeChange?: (pageSize: number) => void
  /** The choices in the page-size Select. */
  pageSizeOptions?: readonly number[]
  /** Figma's `Range of Items`: the "1 – 10 of 100 items" text. */
  hasRange?: boolean
  /** Figma's `Page Size Select`: the "10 per page" Select. */
  hasPageSize?: boolean
  /** Figma's `Page Navigation`: the whole right-hand group, buttons included. */
  hasNavigation?: boolean
  /** Figma's `Current Page Selection`: the page Select and "of 10 pages". */
  hasPageJump?: boolean
  /**
   * Names the landmark. Defaults to "Pagination"; give two bars on one page
   * distinct names, because that is what a landmark list is read by.
   */
  'aria-label'?: string
  className?: string
}

export function Pagination({
  totalItems,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  pageSize: pageSizeProp,
  defaultPageSize = 10,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  hasRange = true,
  hasPageSize = true,
  hasNavigation = true,
  hasPageJump = true,
  'aria-label': ariaLabel = 'Pagination',
  className,
  ...props
}: PaginationProps) {
  // `Table`'s arrangement, line for line: state seeded from the `default`, and
  // the prop winning when it is present.
  const [uncontrolledPage, setUncontrolledPage] = useState(defaultPage)
  const [uncontrolledPageSize, setUncontrolledPageSize] = useState(defaultPageSize)

  const pageSize = pageSizeProp ?? uncontrolledPageSize
  const count = pageCount(totalItems, pageSize)

  // Clamped on the way out rather than on the way in: a controlled `page` that
  // outlived its page size is the caller's stale value, not ours to write back.
  const page = clampPage(pageProp ?? uncontrolledPage, count)

  const pages = useMemo(() => Array.from({ length: count }, (_, index) => index + 1), [count])

  function goTo(next: number) {
    const clamped = clampPage(next, count)
    if (clamped === page) return
    if (pageProp === undefined) setUncontrolledPage(clamped)
    onPageChange?.(clamped)
  }

  /**
   * Changing the page size returns you to page 1.
   *
   * The clever alternative is to keep the first visible item in view — go from
   * page 3 at 10 per page to page 1 at 50. It is a nicer answer to a question
   * nobody asked, and it means the page number jumps to a value the user did
   * not choose and cannot predict. Page 1 is where "show me more at once"
   * obviously lands.
   */
  function changePageSize(next: number) {
    if (pageSizeProp === undefined) setUncontrolledPageSize(next)
    onPageSizeChange?.(next)

    if (pageProp === undefined) setUncontrolledPage(1)
    if (page !== 1) onPageChange?.(1)
  }

  return (
    <nav aria-label={ariaLabel} className={cn(root(), className)} {...props}>
      {hasRange && (
        // A polite live region, so paging announces the new range rather than
        // leaving a screen reader to go looking for what changed.
        <span aria-live="polite" aria-atomic="true" className={text()}>
          {rangeLabel(page, pageSize, totalItems)}
        </span>
      )}

      {hasPageSize && (
        <Select
          hug
          // Standalone, so it names itself. Not `aria-labelledby` pointed at
          // the range text, which would name the control after a sentence.
          aria-label="Items per page"
          value={pageSize}
          onValueChange={(value) => changePageSize(Number(value))}
        >
          {pageSizeOptions.map((size) => (
            <Select.Item key={size} value={size}>
              {pageSizeLabel(size)}
            </Select.Item>
          ))}
        </Select>
      )}

      {hasNavigation && (
        <div className={navGroup()}>
          {hasPageJump && (
            <div className={jumpGroup()}>
              <Select
                hug
                // "of 10 pages" sits after this control and would be a wrong
                // name for it, so the label is written rather than borrowed.
                aria-label="Page"
                value={page}
                onValueChange={(value) => goTo(Number(value))}
              >
                {pages.map((number) => (
                  <Select.Item key={number} value={number}>
                    {number}
                  </Select.Item>
                ))}
              </Select>
              <span className={text()}>{pageCountLabel(count)}</span>
            </div>
          )}

          <div className={stepGroup()}>
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => goTo(page - 1)}
            />
            <Button
              appearance="ghost"
              startIcon={ArrowRight}
              aria-label="Next page"
              disabled={page >= count}
              onClick={() => goTo(page + 1)}
            />
          </div>
        </div>
      )}
    </nav>
  )
}

Pagination.displayName = 'Pagination'
