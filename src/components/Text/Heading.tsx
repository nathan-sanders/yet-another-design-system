import { createElement, type ComponentPropsWithRef } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { typography } from './styles'

type TypographyVariants = VariantProps<typeof typography>

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingSize = NonNullable<TypographyVariants['size']>

/**
 * The size each level draws at when nothing else is said. Tuned for an
 * application at a 14px body, not a document at 16: a page title is 24, and by
 * level 4 a heading is the body size made semibold, which is how Dialog,
 * Popover and Panel already title themselves.
 */
const SIZE_FOR_LEVEL: Record<HeadingLevel, HeadingSize> = {
  1: '2xl',
  2: 'xl',
  3: 'lg',
  4: 'base',
  5: 'base',
  6: 'sm',
}

/**
 * Heading — `<h1>` to `<h6>`, on a Figma text style.
 *
 * **`level` is the outline and `size` is the look, and they are separate on
 * purpose.** The level is what a screen reader lists and jumps between, and it
 * has to follow the page — an `<h2>` under an `<h1>`, never skipping to an
 * `<h4>` because it looked the right size. `size` is free to say anything, and
 * defaults to a step per level so most headings need only `level`.
 *
 * `level` is required, because a heading has no sensible default rank: the
 * right one depends on what is above it, which only the caller knows.
 *
 * No `render` prop, unlike Text. The element *is* the level, and an
 * `<h2 render={<div />}>` would be a heading that is not one.
 *
 * Semibold on `Content/Emphasized` by default — the darkest text token, which
 * is what the hand-written headings across the stories had already settled on.
 */
export interface HeadingProps
  extends Omit<ComponentPropsWithRef<'h2'>, 'color'>,
    Pick<TypographyVariants, 'weight' | 'color'> {
  /** Its rank in the page outline. Decides the element: `level={2}` is an `<h2>`. */
  level: HeadingLevel
  /** How big it draws. Defaults by level — 1 is `2xl`, 2 is `xl`, 3 is `lg`, 4 and 5 `base`, 6 `sm`. */
  size?: HeadingSize
  /** One line with an ellipsis, for a heading in a fixed-width header. */
  truncate?: boolean
}

export function Heading({
  level,
  size,
  weight = 'semibold',
  color = 'emphasized',
  truncate,
  className,
  ...props
}: HeadingProps) {
  return createElement(`h${level}`, {
    ...props,
    className: cn(
      typography({
        size: size ?? SIZE_FOR_LEVEL[level],
        weight,
        color,
        truncate: truncate ? 'line' : undefined,
      }),
      className,
    ),
  })
}

Heading.displayName = 'Heading'
