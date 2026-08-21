import type { ComponentPropsWithRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

/**
 * Badge — a small, static status/label pill.
 *
 * Mirrors the Figma component set "Badge" (Yet Another Design System,
 * node 40002033:1215): a single `Color` property, plus the Start Icon / Label /
 * End Icon slots. Colour covers all 18 hues of the Decorative ramp.
 *
 * Unlike Button, Badge is **not interactive**: Figma gives it no hover, focus or
 * disabled state, so it renders as a `<span>` and carries no cursor, transition
 * or state classes. If you need something clickable that looks like this, wrap a
 * Badge in a Button rather than adding states here.
 *
 * Colour comes from the Decorative token ramp, which pairs a `Background` with a
 * matching `Foreground` tuned for contrast on it. The ramp also exposes a
 * `Highlight`, but Figma's Badge does not use it — there is no border.
 */
const badge = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center',
    // gap-1.5 = 6px (spacing/1-5), px-2 = 8px (spacing/2), no vertical padding.
    'gap-1.5 px-2',
    'rounded-full font-sans text-sm font-normal whitespace-nowrap',
    // Height is 20px in Figma, which is exactly the text-sm line-height, so the
    // pill gets there on its own. min-h-5 holds that height for an icon-only
    // badge, where the 12px glyph would otherwise shrink it.
    'min-h-5',
    'overflow-hidden',
  ],

  variants: {
    // All 18 hues of the Decorative ramp: the neutral first (as Figma lists
    // it), then the spectrum in ramp order.
    //
    // `neutral` is the one hue that is not fixed — it follows the ramp chosen
    // by <html data-neutral>, so a neutral badge sits in the same family as the
    // page around it instead of staying stone on a taupe canvas. Figma still
    // spells the role "Stone" for the ramp it aliases; the tier reinterprets it.
    //
    // Figma's component set currently ships 14 of these — Orange, Lime, Emerald
    // and Teal are missing there and are being added to the file to match. They
    // are included here because the tokens already exist for all 18, so leaving
    // them out was a gap in the design rather than a decision.
    color: {
      neutral: 'bg-decorative-neutral-background text-decorative-neutral-foreground',
      red: 'bg-decorative-red-background text-decorative-red-foreground',
      orange: 'bg-decorative-orange-background text-decorative-orange-foreground',
      amber: 'bg-decorative-amber-background text-decorative-amber-foreground',
      yellow: 'bg-decorative-yellow-background text-decorative-yellow-foreground',
      lime: 'bg-decorative-lime-background text-decorative-lime-foreground',
      green: 'bg-decorative-green-background text-decorative-green-foreground',
      emerald: 'bg-decorative-emerald-background text-decorative-emerald-foreground',
      teal: 'bg-decorative-teal-background text-decorative-teal-foreground',
      cyan: 'bg-decorative-cyan-background text-decorative-cyan-foreground',
      sky: 'bg-decorative-sky-background text-decorative-sky-foreground',
      blue: 'bg-decorative-blue-background text-decorative-blue-foreground',
      indigo: 'bg-decorative-indigo-background text-decorative-indigo-foreground',
      violet: 'bg-decorative-violet-background text-decorative-violet-foreground',
      purple: 'bg-decorative-purple-background text-decorative-purple-foreground',
      fuchsia: 'bg-decorative-fuchsia-background text-decorative-fuchsia-foreground',
      pink: 'bg-decorative-pink-background text-decorative-pink-foreground',
      rose: 'bg-decorative-rose-background text-decorative-rose-foreground',
    },
  },

  defaultVariants: {
    color: 'neutral',
  },
})

type BadgeVariants = VariantProps<typeof badge>

export interface BadgeProps extends Omit<ComponentPropsWithRef<'span'>, 'color'> {
  /** Colour of the pill. Maps to the Figma `Color` property. */
  color?: BadgeVariants['color']
  /**
   * Lucide icon rendered before the label (the Figma "Start Icon" slot).
   * Pass the component itself: `startIcon={Check}`, not `<Check />`. Badge
   * renders it through <Icon> at 12px, the size Figma uses.
   */
  startIcon?: LucideIcon
  /** Lucide icon rendered after the label (the Figma "End Icon" slot). */
  endIcon?: LucideIcon
}

export function Badge({ color, startIcon, endIcon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ color }), className)} {...props}>
      {startIcon && <Icon icon={startIcon} size="small" />}
      {children}
      {endIcon && <Icon icon={endIcon} size="small" />}
    </span>
  )
}

Badge.displayName = 'Badge'
