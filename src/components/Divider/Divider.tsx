import type { ComponentPropsWithRef } from 'react'
import { Separator } from '@base-ui/react/separator'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * Divider — a line that separates content into sections.
 *
 * Mirrors the Figma component set "Divider" (node 40002032:610) one-for-one: its
 * three properties — `Orientation` (Horizontal | Vertical), `Line Style` (Solid |
 * Dashed) and `Emphasis` (Default | Emphasized) — are the three props here, and
 * its eight variants are the eight combinations. The line is 1px in all of them.
 *
 * Behavior comes from **Base UI's `Separator`**, so the rendered element carries
 * `role="separator"` and `data-orientation` without us hand-writing ARIA. This is
 * the first Base UI primitive in the library; everything Base UI does not provide
 * — which here is all of the styling — is ours.
 *
 * Like Badge, Divider is static: Figma gives it no hover, focus or disabled
 * state, so there are no interactive classes and no `state` prop.
 *
 * `Emphasis` started as an idea borrowed from Meta's Astryx Divider (which calls
 * it subtle/strong) and was added to Figma afterwards to match. Astryx's `label`
 * and `isFullBleed` are deliberately left out: neither is in Figma, a label would
 * turn this from one line element into a three-part row, and full-bleed is the
 * caller's layout concern (reachable with `className`).
 */
const divider = tv({
  // shrink-0 so a flex parent never squeezes the line away entirely.
  base: 'shrink-0',

  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      // self-stretch is what makes a vertical divider match the height of the
      // row it sits in, which is nearly always what you want. But self-stretch
      // does nothing outside a flex container, and a 0-height div renders as
      // nothing at all — a silent failure that is miserable to debug. min-h-5
      // (20px, the height/h-5 token Figma draws the vertical variant at) is the
      // floor that keeps it visible either way.
      vertical: 'min-h-5 w-px self-stretch',
    },

    /**
     * The Figma `Line Style` property. It cannot be called `style`: that name is
     * taken by React's inline-style attribute on every DOM element, so the prop
     * would collide with it and shadow a useful escape hatch. Figma was renamed
     * from `Style` to `Line Style` to match.
     */
    lineStyle: {
      solid: 'bg-current',
      // Dashed is drawn by the compound variants below: the gradient has to run
      // along the line, so it depends on orientation as well as style.
      dashed: '',
    },

    /**
     * The Figma `Emphasis` property, originally Astryx's `variant` (subtle |
     * strong) — but named for the tokens it maps onto rather than for Astryx, so
     * the prop value and the token it reaches for are the same word.
     */
    emphasis: {
      default: 'text-surface-border',
      emphasized: 'text-surface-border-emphasized',
    },
  },

  // Color is set with a text utility above and picked up here as currentColor,
  // so `emphasis` is a single class swap that works for solid and dashed alike.
  //
  // The dashes are a gradient rather than `border-dashed` on purpose. Figma's
  // dashed variant is stroke-dasharray="4 4" — 4px on, 4px off — while CSS lets
  // the *browser* pick the dash length from the border width, which at 1px lands
  // near 2/2 and differs between engines. Hard-stopped gradient stops reproduce
  // Figma exactly. The `image:` hint keeps Tailwind from reading the value as a
  // background-color.
  compoundVariants: [
    {
      orientation: 'horizontal',
      lineStyle: 'dashed',
      class: 'bg-[image:repeating-linear-gradient(to_right,currentColor_0_4px,transparent_4px_8px)]',
    },
    {
      orientation: 'vertical',
      lineStyle: 'dashed',
      class:
        'bg-[image:repeating-linear-gradient(to_bottom,currentColor_0_4px,transparent_4px_8px)]',
    },
  ],

  defaultVariants: {
    orientation: 'horizontal',
    lineStyle: 'solid',
    emphasis: 'default',
  },
})

type DividerVariants = VariantProps<typeof divider>

export interface DividerProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Maps to the Figma `Orientation` property. Passed through to Base UI. */
  orientation?: 'horizontal' | 'vertical'
  /** Maps to the Figma `Style` property. Dashed is 4px on, 4px off. */
  lineStyle?: DividerVariants['lineStyle']
  /** Visual weight. `emphasized` swaps Surface/Border for Surface/Border/Emphasized. */
  emphasis?: DividerVariants['emphasis']
}

export function Divider({
  orientation = 'horizontal',
  lineStyle,
  emphasis,
  className,
  ...props
}: DividerProps) {
  return (
    <Separator
      orientation={orientation}
      className={cn(divider({ orientation, lineStyle, emphasis }), className)}
      {...props}
    />
  )
}

Divider.displayName = 'Divider'
