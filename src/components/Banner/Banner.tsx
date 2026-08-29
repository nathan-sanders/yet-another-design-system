import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Icon } from '../Icon'

/**
 * Banner — a persistent message about the page or section it sits in.
 *
 * Mirrors the Figma component set "Banner" (Yet Another Design System,
 * node 40004135:15894): `Type` Info | Success | Warning | Danger x `Floating`
 * false | true, plus the Title / Description / Action / Dismiss slots that
 * Figma models as booleans.
 *
 * **The first component to use the `feedback-*` tokens.** Every other component
 * draws on the Action, Content or Decorative ramps; the four feedback pairs have
 * existed since the first token export waiting for exactly this. Each pair is a
 * `Background` with a `Foreground` already tuned for contrast on it in both
 * themes, so there is nothing to solve here and no `dark:` variant to write.
 * The ramp's `Highlight` goes unused — Figma's Banner has no border, the same
 * call Badge makes.
 *
 * Not a Base UI component: there is no headless Banner or Alert primitive, so
 * this is a native `<div>`, like Badge. What it borrows from Meta's Astryx is
 * the composition and the accessibility model.
 *
 * **Dismissal is the caller's.** Passing `onDismiss` renders the close button;
 * the Banner never hides itself. That is derived-from-what-you-pass, as Button
 * derives icon-only from having no label — and it keeps Banner stateless, which
 * every component in this library so far is. Astryx self-hides instead; a banner
 * that quietly comes back on the next render is the worse surprise.
 *
 * Left out of Astryx's version: `container="section"` (full-bleed, no radius),
 * the collapsible `children` / `defaultIsExpanded` detail area, and the
 * four-step `elevation` scale — Figma draws one raised state, so that is the
 * `floating` boolean.
 */
const banner = tv({
  base: [
    'flex w-full items-start',
    // gap-1 = 4px (spacing/1), px-4 = 16px, py-3 = 12px.
    'gap-1 px-4 py-3',
    'rounded-lg',
    // 14/24 body type. Set here so the icon rail can centre against a known
    // line-height, and so both text rows inherit it.
    'font-sans text-base [word-break:break-word]',
    // Figma has overflow-clip on the frame. Deliberately not ported: nothing
    // overflows, and it is the hazard SegmentedControl documents — a focus ring
    // paints outside its button, and clipping the container slices it off.
  ],

  variants: {
    /**
     * Which feedback pair the banner draws from. The foreground lands on the
     * root rather than on the text, so the status glyph inherits it as
     * `currentColor` — Icon never carries a color of its own.
     */
    type: {
      info: 'bg-feedback-info-background text-feedback-info-foreground',
      success: 'bg-feedback-success-background text-feedback-success-foreground',
      warning: 'bg-feedback-warning-background text-feedback-warning-foreground',
      danger: 'bg-feedback-danger-background text-feedback-danger-foreground',
    },

    /** Figma's `Floating` — Elevation/Drop Shadow/Medium, 0 8 16 0. */
    floating: {
      true: 'shadow-medium',
    },
  },

  defaultVariants: {
    type: 'info',
  },
})

type BannerVariants = VariantProps<typeof banner>
export type BannerType = NonNullable<BannerVariants['type']>

/** The status glyph each type reaches for, at 16px. */
const TYPE_ICON: Record<BannerType, LucideIcon> = {
  info: Info,
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: CircleAlert,
}

/**
 * The live-region role each type announces with. `status` is polite — it waits
 * for a pause; `alert` interrupts. Warning and danger interrupt because they are
 * about something the reader has to act on, and info and success do not because
 * they are not. This is the split Astryx's own DOM makes.
 */
const TYPE_ROLE: Record<BannerType, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  danger: 'alert',
}

/**
 * `title` is a native DOM attribute — `ComponentPropsWithRef<'div'>` already has
 * it, typed `string`, as the browser's hover tooltip. Retyping it as a ReactNode
 * means omitting the native one, which also stops a title ever leaking out as a
 * tooltip. Same collision Divider hit with `style`, resolved the other way: here
 * the prop name is the right one, so the attribute is what gives way.
 */
export interface BannerProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Which feedback pair to draw from. Maps to the Figma `Type` property. */
  type?: BannerType
  /** Raise the banner above the page with the medium drop shadow. */
  floating?: boolean
  /** The semibold first line. Keep it short: "Payment failed", not a sentence. */
  title: ReactNode
  /** The description, rendered under the title at regular weight. */
  children?: ReactNode
  /**
   * Replaces the status glyph. Pass the component itself: `icon={Rocket}`, not
   * `<Rocket />`. Not a Figma property — Astryx's, for the case where the four
   * status glyphs all say the wrong thing.
   */
  icon?: LucideIcon
  /**
   * The Figma "Has Action" slot. Takes any node rather than a label, because
   * what belongs here varies — usually a small overlay Button, sometimes a link.
   * Same reasoning as Tabs' `endSlot`.
   */
  action?: ReactNode
  /** Passing this renders the dismiss button. The caller hides the banner. */
  onDismiss?: () => void
  /** Accessible name for the dismiss button. */
  dismissLabel?: string
}

export function Banner({
  type = 'info',
  floating,
  title,
  children,
  icon,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  ...props
}: BannerProps) {
  return (
    <div
      // Before the spread, so a caller can override it — a banner rendered into
      // a region that already announces itself should not announce twice.
      role={TYPE_ROLE[type]}
      className={cn(banner({ type, floating }), className)}
      {...props}
    >
      {/*
       * The py-1 is load-bearing: 4px above a 16px glyph centres it on the 24px
       * line-height of the title beside it. Without it the icon top-aligns and
       * sits visibly high against the text.
       */}
      <div className="flex items-center py-1">
        <Icon icon={icon ?? TYPE_ICON[type]} size="base" />
      </div>

      {/* min-w-0 lets a long unbroken word wrap instead of pushing the buttons out. */}
      <div className="flex min-w-0 flex-1 flex-col px-2">
        <p className="font-semibold">{title}</p>
        {children && <p className="font-normal">{children}</p>}
      </div>

      {action}

      {onDismiss && (
        <Button
          appearance="overlay"
          size="small"
          startIcon={X}
          aria-label={dismissLabel}
          onClick={onDismiss}
        />
      )}
    </div>
  )
}

Banner.displayName = 'Banner'
