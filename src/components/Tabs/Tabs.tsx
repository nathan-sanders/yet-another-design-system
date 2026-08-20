import { createContext, useContext } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon, type IconProps } from '../Icon'

/**
 * Tabs — switch between panels of related content, one at a time.
 *
 * Mirrors the Figma component sets "Tab Item" (node `40002087:6609`,
 * `Size` × `Active` × `State`) and "Tabs" (node `40002087:6745`, the strip with
 * its bottom rule). Composed API, like Breadcrumbs and SegmentedControl:
 *
 *     <Tabs defaultValue="overview">
 *       <Tabs.List aria-label="Project sections">
 *         <Tabs.Tab value="overview">Overview</Tabs.Tab>
 *         <Tabs.Tab value="activity" endSlot={<Badge>12</Badge>}>Activity</Tabs.Tab>
 *       </Tabs.List>
 *       <Tabs.Panel value="overview">…</Tabs.Panel>
 *     </Tabs>
 *
 * **Fifth Base UI component, and the first that is really navigation.** Base UI
 * supplies `role="tablist"` → `role="tab"` → `role="tabpanel"`, `aria-selected`,
 * the id wiring between a tab and its panel, roving tabindex and arrow keys.
 * That is exactly the distinction SegmentedControl was careful to draw: a
 * segmented control is an *input* and always has one option checked; tabs move
 * you between panels.
 *
 * **Selection does not follow focus here** — the opposite of SegmentedControl,
 * and deliberately. Base UI's `activateOnFocus` defaults to `false`, so arrow
 * keys move focus and Enter or Space activates. With panels attached that is the
 * WAI-ARIA recommendation: following focus would swap the panel contents under
 * someone who is only arrowing past on their way to the tab they want. Pass
 * `activateOnFocus` on `Tabs.List` for the automatic behaviour.
 *
 * **The bold-weight reflow, and how it is dodged.** Figma draws an inactive
 * label at weight 400 and the active one at 600, which makes the selected tab
 * wider than it was a moment ago — so every tab after it slides sideways on each
 * click, and the indicator animates towards a target that is still moving. The
 * fix is Astryx's: render the label twice, the visible copy plus a hidden
 * semibold copy stacked in the same grid cell, so the cell is always as wide as
 * the bold text and the tab never changes size. `invisible` rather than
 * `hidden`, because a `display: none` twin reserves nothing.
 *
 * **The indicator slides, and it costs no JavaScript.** `CLAUDE.md` lists a
 * sliding Tabs indicator as one of the two things that would justify a JS
 * animation library. It no longer does: Base UI's `Tabs.Indicator` publishes the
 * active tab's geometry as `--active-tab-left` and `--active-tab-width`, so one
 * shared element transitions `translate` and `width` in plain CSS. Figma draws
 * the underline inside each tab and Astryx crossfades it per tab; the resting
 * pixels are identical either way, and this is the one that moves.
 *
 * Left out on purpose: `orientation="vertical"` (Base UI has it, Figma draws no
 * vertical variant, and the underline would have to become a side rule — so it
 * is omitted from the props rather than left to break quietly); Astryx's `href`
 * link tabs, which are a `<nav>` of anchors and a different accessibility
 * contract from `role="tab"`; and its overflow `TabMenu`, which is still to
 * build — `Menu` now exists, so that is a composition rather than a blocker.
 */

/**
 * Size and layout, set once on the root and read by the list and every tab, so
 * the three can never disagree. Same move as SegmentedControl. Deliberately not
 * exported: a tab cannot be a different size from the strip it sits in.
 */
const TabsContext = createContext<{ size: TabsSize; layout: TabsLayout }>({
  size: 'default',
  layout: 'hug',
})

const tabsList = tv({
  base: [
    // The anchor for the indicator and the bottom rule, both absolutely
    // positioned. Base UI measures the active tab with `offsetLeft`, so this
    // has to be their offset parent or the indicator lands somewhere else.
    'relative items-center',
    // py-1 = spacing/1 (4px). This is what makes the arithmetic work: a tab sits
    // 4px in from the top, and Figma hangs its 2px underline 4px *below* the tab,
    // which is precisely the bottom edge of this box. **40px at `default`
    // (4 + 32 + 4) is the number to check** when this changes.
    'py-1 font-sans',
  ],

  variants: {
    /**
     * Figma's `hasBottomStroke`, drawn there with a Divider instance — but the
     * real `Divider` cannot be used here. It renders `role="separator"`, and a
     * `role="tablist"` may only contain tabs: axe's `aria-required-children`
     * fails the build on "Element has children which are not allowed". Measured,
     * not assumed — it took the story test suite to catch it.
     *
     * A pseudo-element has no role, so it is invisible to that rule, and it
     * reaches for the same `surface-border` token the Divider would have. It
     * also keeps the strip 40px tall: a real `border-b` would sit *outside* the
     * padding box, adding a 41st pixel and leaving the 2px indicator hovering
     * above the line instead of painting over it.
     *
     * **`before:`, not `after:`, and that is the whole of it.** The rule and the
     * indicator both sit at `bottom-0`, both are positioned, and neither carries
     * a `z-index` — so painting order is tree order, and a `::after` is generated
     * *last*, after the indicator element. The rule was covering the bottom 1px
     * of the 2px indicator, which read as the active tab's underline sitting
     * behind the group's line and being half as thick as it should be. A
     * `::before` is generated first, so the indicator paints over it, as the 2px
     * over 1px was always meant to. No `z-index` is needed and none is added:
     * one would open a stacking context here for a problem tree order already
     * answers. Both are `absolute`, so which pseudo-element it is changes nothing
     * about the flex layout.
     */
    divider: {
      true: 'before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-surface-border',
      false: '',
    },

    /**
     * `hug` sizes tabs to their labels; `fill` stretches them to equal widths.
     * Astryx's `layout`, and the one thing here Figma does not draw — a gap in
     * the file rather than an invention, as with SegmentedControl.
     *
     * Display lives here rather than in `base` so the two can never fight.
     */
    layout: {
      hug: 'inline-flex',
      fill: 'flex w-full',
    },
  },

  defaultVariants: {
    layout: 'hug',
    divider: true,
  },
})

const tab = tv({
  base: [
    'inline-flex items-center justify-center',
    // gap-2 = 8px (spacing/2) at every size — Figma sets it unconditionally.
    'gap-2 rounded-md font-sans whitespace-nowrap select-none',
    // Inactive is the resting state, so it is the base: Content/Primary at
    // weight 400. Base UI marks the active tab with `data-active`, and there is
    // no matching inactive attribute, which is why this reads as a default plus
    // an override rather than as a pair.
    'cursor-pointer font-normal text-content-primary',
    'data-active:font-semibold data-active:text-content-emphasized',
    // Figma gives Active=Yes a Hover state too, so this is not scoped to
    // inactive tabs the way SegmentedControl's hover is.
    'hover:bg-surface-canvas-overlay',
    // Astryx crossfades its labels at 125ms on cubic-bezier(0.24, 1, 0.4, 1) —
    // `--ease-standard` exactly, and `duration-fast-min` (130ms) is the nearest
    // token. Same pairing SegmentedControl uses.
    'transition-[color,background-color] duration-fast-min ease-standard',
    // Focus is the library's shared ring — see src/lib/focus.ts. It paints
    // outside the tab, over the strip's bottom rule and into the 4px of padding
    // above and below; nothing clips it, because `Tabs.List` deliberately has no
    // `overflow-clip` (SegmentedControl's hazard).
    ...focusRing,
    // Disabled is a flat 40% opacity in Figma (opacity/opacity-40).
    //
    // **It has to hang off `data-disabled`, not `:disabled`.** Base UI builds
    // the tab with `focusableWhenDisabled`, so a disabled tab keeps its place in
    // the roving tabindex and is announced rather than skipped over — which
    // means it carries `aria-disabled="true"` and `data-disabled`, and never the
    // native `disabled` attribute. SegmentedControl's `disabled:` classes work
    // because its Radio takes the real attribute; the same classes here fire on
    // nothing at all, silently, which is how this was found: by measuring the
    // computed opacity rather than by looking at it.
    'data-disabled:pointer-events-none data-disabled:opacity-40',
  ],

  variants: {
    // Figma draws these as min-heights, and they stay min-heights here: the
    // focus ring is an outline, which paints without taking up space, so
    // nothing needs a fixed height to hold its size (SegmentedControl needs
    // one because its focus state adds a border).
    size: {
      small: 'min-h-6 px-3 text-sm', // 24px
      default: 'min-h-8 px-3 text-base', // 32px
      // Large is taller but no wider — px-3 at every size, as in Figma, which
      // is SegmentedControl's behaviour rather than Button's 8 / 12 / 16.
      large: 'min-h-10 px-3 text-base', // 40px
    },

    layout: {
      hug: 'shrink-0',
      // Equal widths. `min-w-0` lets a long label shrink the tab instead of
      // forcing the strip wider than its container.
      fill: 'min-w-0 flex-1',
    },

    /**
     * Icon-only: Figma's `Label` slot switched off. Not a prop — derived from
     * the absence of children, so a caller cannot set it and have the two
     * disagree. Square at each size, so a strip mixing labelled and icon-only
     * tabs still lines up.
     */
    iconOnly: {
      true: 'px-0',
    },
  },

  compoundVariants: [
    { iconOnly: true, size: 'small', class: 'w-6' },
    { iconOnly: true, size: 'default', class: 'w-8' },
    { iconOnly: true, size: 'large', class: 'w-10' },
  ],

  defaultVariants: {
    size: 'default',
    layout: 'hug',
  },
})

const indicator = tv({
  base: [
    // bottom-0 of the list, which is 4px below the tab — Figma's bottom-[-4px].
    // h-0.5 = 2px (border-width/border-2), and it paints over the 1px rule.
    'absolute bottom-0 left-0 h-0.5 bg-surface-border-emphasized',
    // Base UI hands us the active tab's geometry as CSS variables, measured
    // against the list. `left-0` plus a translate rather than `left:` so the
    // move is a composited transform.
    'w-(--active-tab-width) translate-x-(--active-tab-left)',
    // Tailwind v4 compiles translate-x-* to the `translate` property, not to
    // `transform`, so that is the property named here. 175ms is what Astryx
    // transitions its own indicator at.
    'transition-[translate,width] duration-fast ease-standard',
  ],
})

type TabsVariants = VariantProps<typeof tab>
export type TabsSize = NonNullable<TabsVariants['size']>
export type TabsLayout = NonNullable<TabsVariants['layout']>

/**
 * Which Icon size each tab size reaches for. An explicit map rather than a
 * derivation, matching Button and SegmentedControl — the two scales are
 * independent, and Figma steps this one only once.
 */
const ICON_SIZE: Record<TabsSize, IconProps['size']> = {
  small: 'small', // 12px
  default: 'base', // 16px
  large: 'base', // 16px
}

export interface TabsProps
  extends Omit<
    ComponentPropsWithRef<typeof TabsPrimitive.Root>,
    'className' | 'render' | 'orientation'
  > {
  /** `Tabs.List` and `Tabs.Panel` elements. */
  children: ReactNode
  /** Tab size. Matches Button's scale: 24 / 32 / 40px tall. */
  size?: TabsSize
  /** `hug` sizes tabs to their labels, `fill` stretches them equally. */
  layout?: TabsLayout
  className?: string
}

export function Tabs({ children, size = 'default', layout = 'hug', className, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root className={className} {...props}>
      <TabsContext.Provider value={{ size, layout }}>{children}</TabsContext.Provider>
    </TabsPrimitive.Root>
  )
}

export interface TabsListProps
  extends Omit<ComponentPropsWithRef<typeof TabsPrimitive.List>, 'className' | 'render'> {
  /** `Tabs.Tab` elements. */
  children: ReactNode
  /**
   * The rule under the strip. Figma's `hasBottomStroke`, on by default — it is
   * what separates the tabs from the panel below them. Turn it off when the
   * strip already sits on a border, or inside a card that draws its own.
   */
  divider?: boolean
  className?: string
  /**
   * Required: names the strip for screen readers, which announce it as
   * "<label>, tab list". Base UI cannot infer it.
   */
  'aria-label'?: string
}

function TabsList({ children, divider = true, className, ...props }: TabsListProps) {
  const { layout } = useContext(TabsContext)

  return (
    <TabsPrimitive.List className={cn(tabsList({ layout, divider }), className)} {...props}>
      {children}
      {/* Base UI gives the indicator role="presentation", so it is allowed
          inside a tablist where a real element with a role would not be. */}
      <TabsPrimitive.Indicator className={indicator()} />
    </TabsPrimitive.List>
  )
}

TabsList.displayName = 'Tabs.List'

interface TabsTabBaseProps
  extends Omit<ComponentPropsWithRef<typeof TabsPrimitive.Tab>, 'children' | 'className' | 'render'> {
  /**
   * Lucide icon before the label (the Figma "Start Icon" slot). Pass the
   * component itself: `startIcon={LayoutGrid}`, not `<LayoutGrid />`.
   */
  startIcon?: LucideIcon
  /**
   * Figma's "End Slot Items" frame. Anything that belongs after the label — a
   * count Badge, a status dot — rather than a `LucideIcon`, because a count is
   * the common case and an icon is not.
   */
  endSlot?: ReactNode
  className?: string
}

/**
 * A tab is either labelled or icon-only, and the two have different rules, so
 * the props are a union rather than "everything optional". With no visible text,
 * `aria-label` is required — TypeScript will not let an unlabelled icon tab
 * compile, which is the accessibility mistake the shape invites.
 */
export type TabsTabProps = TabsTabBaseProps &
  (
    | { children: ReactNode; 'aria-label'?: string }
    | { children?: never; startIcon: LucideIcon; 'aria-label': string }
  )

function TabsTab({ children, startIcon, endSlot, className, ...props }: TabsTabProps) {
  const { size, layout } = useContext(TabsContext)
  // No label to sit beside means the square, icon-only shape.
  const iconOnly = children == null || children === false

  return (
    <TabsPrimitive.Tab className={cn(tab({ size, layout, iconOnly }), className)} {...props}>
      {startIcon && <Icon icon={startIcon} size={ICON_SIZE[size]} />}
      {!iconOnly && (
        // The width reservation. Both copies share one grid cell, so the cell is
        // as wide as the semibold twin whether or not this tab is active — which
        // is what stops the strip shuffling every time the selection moves.
        <span className="grid">
          <span className="col-start-1 row-start-1">{children}</span>
          <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
            {children}
          </span>
        </span>
      )}
      {endSlot}
    </TabsPrimitive.Tab>
  )
}

TabsTab.displayName = 'Tabs.Tab'

export interface TabsPanelProps
  extends Omit<ComponentPropsWithRef<typeof TabsPrimitive.Panel>, 'className' | 'render'> {
  className?: string
}

/**
 * The content a tab switches to. Figma draws no panel, so there is nothing to
 * style here beyond the focus ring: Base UI makes the panel focusable so that
 * Tab from the strip lands inside the content, and an element that takes focus
 * has to show it.
 */
function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <TabsPrimitive.Panel
      className={cn(
        'rounded-md',
        ...focusRing,
        className,
      )}
      {...props}
    />
  )
}

TabsPanel.displayName = 'Tabs.Panel'

Tabs.List = TabsList
Tabs.Tab = TabsTab
Tabs.Panel = TabsPanel

/**
 * The raw Base UI indicator, for a strip assembled by hand from the parts. The
 * styled one is rendered by `Tabs.List` already — reach for this only when
 * building a list that does not use it.
 */
Tabs.Indicator = TabsPrimitive.Indicator

Tabs.displayName = 'Tabs'
