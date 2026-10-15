import type { CSSProperties } from 'react'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { typography } from './styles'

type TypographyVariants = VariantProps<typeof typography>

/**
 * Text — a run of body copy on one of the Figma text styles.
 *
 * There is no Figma component behind it, and there should not be: in the file
 * a piece of text is a TEXT node with a text style applied, `text-base/normal`
 * or `text-sm/semibold`. This is the same thing in code. `size` and `weight`
 * are the two halves of the style's name, so a designer saying
 * `text-sm/semibold` and a caller writing `size="sm" weight="semibold"` are
 * saying one thing.
 *
 * It exists because that pairing was being hand-written everywhere —
 * `text-sm text-content-subtle` alone appeared in 14 places — and the hand
 * version has one way to go wrong that nothing catches: `font-medium` is not a
 * weight in this theme and renders at 400. Here only the real ones are offered.
 *
 * **A `<p>` by default.** Text inside a sentence, a label or a flex row wants
 * `render={<span />}`; Base UI's `render` is the library's one spelling for
 * "same component, different element", so it is used here too. Lists, `<dt>`,
 * `<label>` — anything that holds text — go the same way.
 *
 * **`color` defaults to `primary`**, Figma's body color. On something that has
 * already chosen its own — a Banner, an inverse surface, the label inside a
 * button — pass `color="inherit"` and the token is left off.
 */
export interface TextProps
  extends Omit<useRender.ComponentProps<'p'>, 'color'>,
    Omit<TypographyVariants, 'truncate'> {
  /**
   * Cut the text off with an ellipsis instead of letting it wrap. `true` is one
   * line; a number is that many lines, then an ellipsis. Either way the full
   * text is still in the DOM, so a screen reader reads all of it — give a
   * sighted reader a way to see the rest too, a tooltip or a detail view.
   */
  truncate?: boolean | number
}

export function Text({
  size = 'base',
  weight = 'normal',
  color = 'primary',
  mono,
  italic,
  truncate,
  render,
  className,
  style,
  ...props
}: TextProps) {
  const lines = typeof truncate === 'number' && truncate > 1 ? truncate : undefined

  return useRender({
    defaultTagName: 'p',
    render,
    props: {
      ...props,
      className: cn(
        typography({
          size,
          weight,
          color,
          mono,
          italic,
          truncate: lines ? 'lines' : truncate ? 'line' : undefined,
        }),
        className,
      ),
      // The count goes in as a custom property for `line-clamp-(--lines)` to
      // read back, rather than as an inline `-webkit-line-clamp`, so a caller's
      // own class can still replace it.
      style: lines ? ({ '--lines': lines, ...style } as CSSProperties) : style,
    },
  })
}

Text.displayName = 'Text'
