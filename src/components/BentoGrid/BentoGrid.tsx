import type { ComponentPropsWithRef, ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * BentoGrid — the mosaic a set of `ContentBlock`s sits in.
 *
 * A bento layout is a grid of compartments of deliberately unequal size: a
 * large anchor cell carrying the primary message, smaller tiles around it, all
 * on one set of gutters so the varied sizes still line up. This component owns
 * that geometry — the columns, the gutter, the spans, and the collapse to a
 * single column on a phone — and nothing else. What goes in the cells is a
 * `ContentBlock`, or anything.
 *
 * **Not in Figma.** Code goes first here, which the library allows and has done
 * before (Badge's extra hues, Divider's `emphasis`, Accordion's row height);
 * what is not allowed is leaving the file behind, so the grid belongs in Figma
 * next, as an auto-layout wrapper or a set of frame sizes.
 *
 * **The spans belong to the cell, not to the block.** `ContentBlock` should not
 * know how wide it is any more than a paragraph knows its column width — and a
 * block outside a grid would carry a `colSpan` that means nothing.
 *
 * ## The rules this encodes
 *
 * - **Balanced proportions** — one gutter for both axes, from the spacing
 *   scale, so a 2-wide tile is exactly two tiles plus one gap.
 * - **Responsive scaling** — every column count and every span is written
 *   behind `md:`, so below 768px the grid is one column and the spans stop
 *   applying together. A caller writes no breakpoint of their own.
 * - **Restraint in count** — nine cells or fewer per view. That is guidance and
 *   stays guidance: it is a judgement about a whole page, and a component that
 *   threw at ten children would be wrong about the tenth as often as it was
 *   right.
 */
const bentoGrid = tv({
  base: [
    'grid w-full',
    // One column until md. This is the whole of the mobile story: the spans
    // below are md-prefixed too, so they arrive at the same moment the columns
    // do and there is never a 2-wide cell in a 1-wide grid.
    'grid-cols-1',
    // Rows are content-sized on purpose (no `auto-rows-fr`). A dashboard's rows
    // are genuinely different heights — a row of stat tiles over a row of
    // charts — and forcing them equal would stretch the short row to match the
    // tall one. A `rowSpan` still works: the tile covers both rows plus the
    // gutter between them.
  ],

  variants: {
    /**
     * How many columns from `md` up. Four is the default because it is the one
     * that divides: halves and quarters both land, which is what lets an anchor
     * cell sit beside two tiles without a leftover.
     */
    columns: {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
    },

    /** The gutter, on both axes. spacing/4 and spacing/6. */
    gap: {
      default: 'gap-4',
      loose: 'gap-6',
    },
  },

  defaultVariants: {
    columns: 4,
    gap: 'default',
  },
})

type BentoGridVariants = VariantProps<typeof bentoGrid>
export type BentoGridColumns = NonNullable<BentoGridVariants['columns']>
export type BentoGridGap = NonNullable<BentoGridVariants['gap']>

export interface BentoGridProps extends ComponentPropsWithRef<'div'> {
  /** `BentoGrid.Cell`s, or blocks that need no span of their own. */
  children: ReactNode
  /** Columns from `md` up. Below that the grid is always one column. */
  columns?: BentoGridColumns
  /** The gutter between cells, on both axes. */
  gap?: BentoGridGap
}

export function BentoGrid({ children, columns = 4, gap = 'default', className, ...props }: BentoGridProps) {
  return (
    <div className={cn(bentoGrid({ columns, gap }), className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Both maps are written out in full, and that is not stylistic. Tailwind finds
 * classes by scanning source text, so a class assembled at runtime —
 * `` `md:col-span-${colSpan}` `` — is never generated, and the failure is
 * silent: the cell simply lays out one column wide and looks like a design
 * mistake rather than a missing class. `src/lib/focus.ts` carries the same
 * warning for the same reason.
 */
const COL_SPAN = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
} as const

const ROW_SPAN = {
  1: 'md:row-span-1',
  2: 'md:row-span-2',
  3: 'md:row-span-3',
} as const

export type BentoCellColSpan = keyof typeof COL_SPAN
export type BentoCellRowSpan = keyof typeof ROW_SPAN

export interface BentoGridCellProps extends ComponentPropsWithRef<'div'> {
  /** Usually one `ContentBlock`. */
  children: ReactNode
  /**
   * Columns to cover, from `md` up. Keep it at or under the grid's `columns`:
   * a cell wider than the grid is clamped by CSS to the full width, which looks
   * like a layout bug rather than a span.
   */
  colSpan?: BentoCellColSpan
  /** Rows to cover, from `md` up. Two is the usual anchor cell. */
  rowSpan?: BentoCellRowSpan
}

/**
 * One compartment. A plain grid item: it stretches to its row's height, and a
 * `ContentBlock` inside is `h-full`, so tiles in a row end level however much
 * text each of them holds.
 *
 * A block that spans one column needs no cell at all — put it straight in the
 * grid.
 */
function BentoGridCell({ children, colSpan = 1, rowSpan = 1, className, ...props }: BentoGridCellProps) {
  return (
    <div className={cn('flex min-w-0 flex-col', COL_SPAN[colSpan], ROW_SPAN[rowSpan], className)} {...props}>
      {children}
    </div>
  )
}

BentoGridCell.displayName = 'BentoGrid.Cell'

BentoGrid.Cell = BentoGridCell

BentoGrid.displayName = 'BentoGrid'
