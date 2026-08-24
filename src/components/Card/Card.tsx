import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { card, type CardEmphasis, type CardPadding } from './styles'

/**
 * Card — the plain container. A bordered, padded surface holding one discrete
 * thing.
 *
 * Mirrors the Figma component set `Card` (`40004237:14594`), whose axes are
 * `Emphasis` default | subtle | accent × `Floating` false | true, and whose
 * anatomy is a single `Content` slot. There is no header, no footer and no
 * compound part here, because there is none in the file.
 *
 * **This is not a headerless `ContentBlock`, and the roadmap entry that asked
 * the question is answered by the geometry.** A card is `rounded-md` (8px) with
 * 12px of padding; a block is `rounded-lg` (12px) with 16. They are drawn to
 * nest — the compositions at `40004220:13045` put four of these inside one
 * block as a KPI row — and an 8px corner inside a 12px one is the right way
 * round.
 *
 * **What belongs in a card**, borrowing Astryx's test, which is a good one:
 * could you reorder or remove this independently? A single metric, one message,
 * one product in a grid. If the answer is no, it is a region of a page and wants
 * `ContentBlock`, or nothing at all — whitespace and a heading group content
 * perfectly well, and a library that makes cards cheap is a library that ends up
 * with borders around everything.
 *
 * **Not a Base UI component.** There is no headless card primitive, so this is a
 * native `<div>`, like Badge, Banner and ContentBlock. The Base UI count stands
 * where it was.
 *
 * **Not focusable, and deliberately without a focus ring.** A container that
 * rings identically wherever focus lands inside it says nothing — the rule
 * `src/lib/focus.ts` records and ContentBlock follows. A card that is itself a
 * hit target is `ClickableCard`.
 */
export interface CardProps extends ComponentPropsWithRef<'div'> {
  /** Whatever the card is about. Stacked, with 8px between children. */
  children: ReactNode
  /**
   * Which surface the card draws. `subtle` is a recessed well and wants a
   * non-canvas parent to read against; `accent` is the loud one.
   */
  emphasis?: CardEmphasis
  /** Raise the card off its surface with the low drop shadow. Figma's `Floating`. */
  floating?: boolean
  /**
   * Inner padding. `default` is Figma's 12px. Use `none` for content that has to
   * reach the border — an image, a chart.
   */
  padding?: CardPadding
}

export function Card({
  children,
  emphasis = 'default',
  floating = false,
  padding = 'default',
  className,
  ...props
}: CardProps) {
  return (
    <div className={cn(card({ emphasis, floating, padding }), className)} {...props}>
      {children}
    </div>
  )
}

Card.displayName = 'Card'
