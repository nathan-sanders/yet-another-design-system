import { createContext, useContext } from 'react'
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon } from '../Icon'

/**
 * Accordion — a stack of sections, each opening to reveal its own content.
 *
 * Mirrors the Figma component sets "Accordion" (node `40004084:2278`),
 * "Accordion Item" (`40004079:231`, the `Panel Open` axis) and "Accordion
 * Trigger" (`40004078:137`, `State` = Default / Hover / Focus / Disabled).
 * Composed API, like Tabs and Menu:
 *
 *     <Accordion defaultValue={['shipping']}>
 *       <Accordion.Item value="shipping">
 *         <Accordion.Trigger>When will it arrive?</Accordion.Trigger>
 *         <Accordion.Panel>Two to three working days.</Accordion.Panel>
 *       </Accordion.Item>
 *     </Accordion>
 *
 * **Eighteenth Base UI component, and the first whose animation is a
 * measurement.** `CLAUDE.md` says to check whether the headless primitive
 * already measures the thing before assuming an animation needs JavaScript —
 * the same lesson the Tabs indicator taught. It does: Base UI measures each
 * panel and publishes it as `--accordion-panel-height`, so the open and close
 * are one CSS transition on `height`. Toast animates height too, but off a
 * variable it sets itself; this one is handed over.
 *
 * **`Accordion.Trigger` swallows Base UI's `Header`.** Base UI's anatomy is
 * Root › Item › Header › Trigger, and Figma's Header is nothing but a 4px pad
 * around the trigger — a wrapper with no decisions in it. So the trigger
 * renders both, the way `Menu.Popup` renders the Portal and Positioner. The
 * `Header` is a real heading, which is what puts every section in the page
 * outline; `headingLevel` on the root sets which one.
 *
 * **Arrow keys deliberately do nothing.** Base UI 1.7.0 deprecated its
 * `orientation` and `loopFocus` props to no-ops after the
 * [APG guidance update](https://github.com/w3c/aria-practices/pull/3434)
 * removed roving focus from accordions: every trigger is now its own tab stop,
 * and Tab is how you move between them. Both props are omitted from this
 * wrapper rather than passed through, so nobody sets one and waits for
 * something to happen — the same call Tabs made on `orientation="vertical"`.
 *
 * **Only the Panel clips.** Figma's `overflow-clip` is not ported, for the
 * tenth time, because the focus ring paints outside the component and the card
 * would slice it off. The root does not need it anyway: items draw no
 * background of their own, and the trigger's hover fill nests exactly — the
 * root's 12px radius less the header's 4px pad is the trigger's 8px, which is
 * why Figma picked those three numbers. The Panel is the exception, and the
 * one place the clip is doing real work: without it the content is visible
 * outside a collapsing box and there is no animation to see.
 *
 * Left out: a standalone `Collapsible`. Base UI ships one and Astryx builds its
 * accordion out of it, but Figma draws only the accordion, and a disclosure
 * with no group around it is a different component rather than this one with a
 * prop off. Also left out are Astryx's `density` scale, and its habit of
 * disabling a trigger with `aria-disabled` and `tabIndex={-1}` rather than the
 * native attribute — a real improvement, but Base UI's `disabled` owns that
 * wiring and fighting it would mean rebuilding the item's state.
 */

/**
 * Set once on the root and read by every trigger, so two sections of one
 * accordion cannot land at different heading levels. Same move as Tabs' size.
 * Deliberately not exported.
 */
const AccordionContext = createContext<{ headingLevel: AccordionHeadingLevel }>({
  headingLevel: 3,
})

const accordion = tv({
  base: 'flex w-full flex-col font-sans',

  variants: {
    /**
     * Figma draws the accordion as a card, and that is the default. `false`
     * drops the border and the radius so the items sit flush on whatever is
     * already behind them — for an accordion inside a Card, or a settings page
     * that draws its own container. Tabs' `divider` is the same idea: the
     * component keeps its content and gives up its frame.
     */
    container: {
      true: 'rounded-lg border border-surface-border bg-surface-card-primary',
      false: '',
    },
  },

  defaultVariants: {
    container: true,
  },
})

const item = tv({
  // Figma's Accordion Item carries a bottom rule and the last one in the stack
  // does not — drawn there as a separate "Last No Border" variant, which here
  // is just `last:`. A real Divider is not used: it renders
  // `role="separator"`, and one between the sections of an accordion is noise
  // to a screen reader rather than structure. Tabs found the same thing from
  // the other direction, where axe rejected it outright.
  base: 'border-b border-surface-border last:border-b-0',
})

const trigger = tv({
  base: [
    // `group` so the chevron can read the open state off this element — Base
    // UI puts `data-panel-open` on the trigger, not on the icon.
    'group flex w-full items-center gap-2',
    // min-h-10 = height/h-10 (40px), px-3 = spacing/3 (12px). A min-height
    // rather than a height, so a label that wraps grows the row instead of
    // spilling. The whole item is 48 with the header's 4px either side — the
    // same row Tabs uses for its large size.
    //
    // This was 32 (height/h-8) when the component first landed, went to 40 here
    // at Nathan's request, and Figma has since been updated to match: the
    // trigger's variants are 40 tall and bind height/h-10.
    'min-h-10 rounded-md px-3',
    'cursor-pointer text-left font-sans text-base font-semibold text-content-emphasized select-none',
    'hover:bg-surface-card-subtle',
    'transition-colors duration-fast-min ease-standard',
    // The library's shared ring. It paints outside the trigger, into the 4px of
    // header padding — which is exactly why nothing here clips.
    ...focusRing,
    // Figma's Disabled is a flat 40% on the whole trigger, label and chevron
    // together. On `data-disabled` rather than `:disabled`, per the house rule:
    // Base UI sets both today, and the data attribute keeps working if it ever
    // moves to `aria-disabled` the way its Tabs already have.
    'data-disabled:pointer-events-none data-disabled:opacity-40',
  ],
})

const panel = tv({
  base: [
    // The whole animation. Base UI measures the panel and publishes the result
    // as --accordion-panel-height; this transitions to it, and collapses to
    // zero for the frame before opening and the frame before closing.
    'h-(--accordion-panel-height) overflow-hidden',
    'transition-[height] duration-fast ease-standard',
    'data-[starting-style]:h-0 data-[ending-style]:h-0',
    // Base UI's own demo adds a rule here turning off a panel that is `hidden`
    // but not `hidden="until-found"`. It is not needed and is deliberately not
    // copied: that rule exists because their panel sets `display: flex`, which
    // beats the browser's `[hidden] { display: none }`. This one sets no
    // display at all, so the browser already does it — measured both ways, and
    // a bare `hidden` computes to `none` while `until-found` stays `block`.
  ],
})

type AccordionVariants = VariantProps<typeof accordion>

/**
 * Which heading the trigger sits in. An accordion is a set of sections, so its
 * triggers belong in the page outline — but only the page knows at what depth,
 * and getting it wrong is an axe `heading-order` failure rather than a matter
 * of taste.
 */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * Base UI's Header renders an `<h3>`; anything else is a `render` swap. An
 * explicit map rather than a computed tag, because Tailwind and TypeScript can
 * both see the whole set this way.
 */
const HEADING: Record<AccordionHeadingLevel, ReactElement> = {
  2: <h2 />,
  3: <h3 />,
  4: <h4 />,
  5: <h5 />,
  6: <h6 />,
}

export interface AccordionProps
  extends Omit<
    ComponentPropsWithRef<typeof AccordionPrimitive.Root>,
    'className' | 'render' | 'orientation' | 'loopFocus'
  > {
  /** `Accordion.Item` elements. */
  children: ReactNode
  /**
   * The card around the stack. Figma's look, and on by default. Turn it off for
   * an accordion that already sits inside a container.
   */
  container?: AccordionVariants['container']
  /**
   * The heading each trigger sits in. Pick the level below whatever heading
   * introduces the accordion on the page.
   */
  headingLevel?: AccordionHeadingLevel
  className?: string
}

export function Accordion({
  children,
  container = true,
  headingLevel = 3,
  className,
  ...props
}: AccordionProps) {
  return (
    <AccordionPrimitive.Root className={cn(accordion({ container }), className)} {...props}>
      <AccordionContext.Provider value={{ headingLevel }}>{children}</AccordionContext.Provider>
    </AccordionPrimitive.Root>
  )
}

export interface AccordionItemProps
  extends Omit<ComponentPropsWithRef<typeof AccordionPrimitive.Item>, 'className' | 'render'> {
  /** An `Accordion.Trigger` and its `Accordion.Panel`. */
  children: ReactNode
  className?: string
}

/**
 * One section. `value` identifies it to the root's `value` / `defaultValue`;
 * leave it off and Base UI generates one, which is fine for an accordion nobody
 * needs to open programmatically.
 */
function AccordionItem({ children, className, ...props }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item className={cn(item(), className)} {...props}>
      {children}
    </AccordionPrimitive.Item>
  )
}

AccordionItem.displayName = 'Accordion.Item'

export interface AccordionTriggerProps
  extends Omit<ComponentPropsWithRef<typeof AccordionPrimitive.Trigger>, 'className' | 'render'> {
  /** The section's label. */
  children: ReactNode
  /**
   * Lucide icon before the label — Figma's `icon` toggle, off by default. Pass
   * the component itself: `startIcon={Truck}`, not `<Truck />`.
   */
  startIcon?: LucideIcon
  className?: string
}

/**
 * The row you click, and the heading it lives in. Base UI gives it
 * `aria-expanded` and `aria-controls` pointing at the panel, and Space and
 * Enter come free with the native `<button>` — there is no ARIA to patch here,
 * unlike Tooltip.
 */
function AccordionTrigger({ children, startIcon, className, ...props }: AccordionTriggerProps) {
  const { headingLevel } = useContext(AccordionContext)

  return (
    // Figma's Header frame: 4px of padding, which is what insets the trigger's
    // hover fill from the card edge. `m-0` because an <h3> arrives with a
    // browser margin that would push every row apart.
    <AccordionPrimitive.Header className="m-0 flex w-full p-1" render={HEADING[headingLevel]}>
      <AccordionPrimitive.Trigger className={cn(trigger(), className)} {...props}>
        {startIcon && <Icon icon={startIcon} />}
        {/* min-w-px lets a long label wrap rather than forcing the row wider. */}
        <span className="min-w-px flex-1">{children}</span>
        {/*
          Figma swaps chevron-down for chevron-up; a 180° rotation is the same
          two pictures with a transition between them, and it is what Astryx
          does. Same duration and curve as the panel, so they finish together.
        */}
        <Icon
          icon={ChevronDown}
          className="transition-transform duration-fast ease-standard group-data-[panel-open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

AccordionTrigger.displayName = 'Accordion.Trigger'

export interface AccordionPanelProps
  extends Omit<ComponentPropsWithRef<typeof AccordionPrimitive.Panel>, 'className' | 'render'> {
  /** The section's content. */
  children: ReactNode
  /** Extra classes for the inner content box, where the padding lives. */
  contentClassName?: string
  className?: string
}

/**
 * The content a trigger reveals.
 *
 * **The padding is on the inner box, not on the panel.** The panel's height is
 * the animated property, so anything that adds to it has to be inside the
 * measured element — padding on the panel itself makes the open jerk as the
 * transition starts from a box that is already 24px tall.
 *
 * Nothing is said here about type. Figma leaves the panel an empty slot, and
 * `Tabs.Panel` sets no typography either: what goes in a panel is the caller's
 * content, not the component's.
 */
function AccordionPanel({ children, contentClassName, className, ...props }: AccordionPanelProps) {
  return (
    <AccordionPrimitive.Panel className={cn(panel(), className)} {...props}>
      {/*
        px-4 pb-4 = spacing/4 — Figma's Panel frame, minus its top padding.
        Figma draws spacing/2 (8px) at the top and Nathan asked for none: the
        header already leaves 4px under the trigger, so the panel's own 8 read
        as a gap between the label and its content rather than as one block.

        **The cost is at the top edge, and it is real.** The panel is the one
        element here that clips, so a focusable child on the first line loses
        the top of its ring — 5px of gap-plus-ring against 0px of padding.
        Anything below the first line is fine, and the sides and bottom keep
        their 16. Worth knowing before putting a Link or a Button first.
      */}
      <div className={cn('flex flex-col gap-2 px-4 pb-4', contentClassName)}>{children}</div>
    </AccordionPrimitive.Panel>
  )
}

AccordionPanel.displayName = 'Accordion.Panel'

Accordion.Item = AccordionItem
Accordion.Trigger = AccordionTrigger
Accordion.Panel = AccordionPanel

/**
 * The raw Base UI parts, for the one shape the wrappers cannot express: a
 * trigger that is not a heading — a row inside a toolbar, say — which needs
 * `Accordion.RawTrigger` without the `Accordion.Header` around it.
 */
Accordion.Root = AccordionPrimitive.Root
Accordion.Header = AccordionPrimitive.Header
Accordion.RawTrigger = AccordionPrimitive.Trigger

Accordion.displayName = 'Accordion'
