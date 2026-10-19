import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'

import { cn } from '../../lib/cn'
import { radioCard, type CardPadding, type ClickableCardEmphasis } from '../Card/styles'

/**
 * Radio.Card — one option of a radio group, drawn as a card you pick.
 *
 *     <Radio.Group aria-label="Visualization" value={viz} onValueChange={setViz}
 *       className="grid grid-cols-3">
 *       <Radio.Card value="line"><Icon icon={ChartLine} /> Line</Radio.Card>
 *       <Radio.Card value="bar"><Icon icon={ChartColumn} /> Bar</Radio.Card>
 *     </Radio.Group>
 *
 * **A part of Radio, not a `SelectableCard`.** The semantics are a radio
 * group's — one value, one tab stop, arrows move and select — and every one of
 * those lives in `Radio.Group`, which this has to sit inside anyway. What
 * changes is only what an option looks like, so it is a second option part
 * beside `Radio` rather than a component with a group of its own. A card you
 * tick on and off independently would be a checkbox, and nothing asks for one.
 *
 * **The surface is Clickable Card's, and that is the drawing.** Figma has no
 * selectable-card set. What it has is `Clickable Card` (`40004251:16237`) with
 * `State=Selected` — Surface/Background Subtle on Surface/Border Emphasized —
 * and the Pulse widget editor's `_Measure Viz Option` (`40005872:24935`), a
 * glyph over a word "dropped into a Clickable Card slot", wearing Selected on
 * the chosen chart. So this is that card with the state driven by the radio:
 * `radioCard` in `Card/styles.ts` extends `clickableCard` and restates its
 * selected surface under `data-checked:`. No dial: the file draws none, and
 * the first Yet Social tile that had one was sent back for it.
 *
 * **Not `aria-current`.** ClickableCard's `selected` is a navigation state;
 * this one is `aria-checked`, set by Base UI. Rendering `Radio.Root` onto a
 * `ClickableCard` — the workaround two Yet Social screens shipped — said both.
 *
 * **Named by its own content, said explicitly.** Base UI takes a surrounding
 * Field's label id ahead of the option's own text, so under a Field every card
 * was announced as the group's question. The card points `aria-labelledby` at
 * its content, Radio's fix for Radio's bug. Pass your own when the content is
 * long — a title's id — and the rest as `aria-describedby`.
 *
 * **It is a `<button>`**, Base UI's `nativeButton` path, as ClickableCard is.
 * So the children are phrasing content: spans, `Text render={<span />}`, icons.
 * A `<div>` or a heading inside is invalid HTML, though it would render.
 */
export interface RadioCardProps extends Omit<
  ComponentPropsWithRef<typeof RadioPrimitive.Root>,
  'className' | 'render' | 'children' | 'nativeButton'
> {
  /**
   * What the option is. Stacked with 8px between children, as a card's are,
   * and the option's accessible name unless `aria-labelledby` says otherwise.
   */
  children: ReactNode
  /**
   * Clickable Card's `Emphasis`. `ghost` has no visible edge until it is
   * picked; it disappears on a `surface-background-primary` parent and is a
   * white block on the canvas.
   */
  emphasis?: ClickableCardEmphasis
  /** Inner padding as a spacing token step — Card's prop. `3` is what Figma draws. */
  padding?: CardPadding
  /** Extra classes for the card — alignment, usually. */
  className?: string
}

export function RadioCard({
  children,
  emphasis = 'default',
  padding = 3,
  className,
  ...props
}: RadioCardProps) {
  const contentId = useId()

  return (
    <RadioPrimitive.Root
      nativeButton
      render={<button type="button" />}
      className={cn(radioCard({ emphasis, padding }), className)}
      // Only the default goes here, and the caller's spread after it wins. An
      // undefined aria-* prop deletes what Base UI computed, so the caller's
      // value is never forwarded as `undefined`.
      aria-labelledby={contentId}
      {...props}
    >
      {/* `contents`, so the children stay the card's flex items. */}
      <span id={contentId} className="contents">
        {children}
      </span>
    </RadioPrimitive.Root>
  )
}

RadioCard.displayName = 'Radio.Card'
