import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'
import type { RadioGroupProps } from '@base-ui/react/radio-group'
import type { RadioRootProps } from '@base-ui/react/radio'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon, type IconProps } from '../Icon'

/**
 * SegmentedControl — pick one of a small set of mutually exclusive options,
 * with all of them visible at once.
 *
 * Mirrors the Figma component sets "Segment Control" (node 40004127:14774,
 * `Appearance`: Secondary | Ghost) and "Segments" (node 40002016:7049,
 * `Active` x `State` x `Size`). The track carries no `Size` of its own — it
 * takes its height from the segments inside it.
 *
 * It is styled to sit beside a Button: the track uses the same
 * Action/Secondary and Action/Ghost tokens as Button's `secondary` and `ghost`
 * appearances, and its three heights are Button's — 24 / 32 / 40. The number
 * falls out of the parts rather than being set: a 20px segment inside 1px of
 * padding inside a 1px border is 24px, and the same holds for 28 -> 32 and
 * 36 -> 40. **Those three heights are the numbers to check** when this changes.
 *
 *     <SegmentedControl aria-label="View mode" value={view} onValueChange={setView}>
 *       <SegmentedControl.Item value="grid" startIcon={LayoutGrid}>Grid</SegmentedControl.Item>
 *       <SegmentedControl.Item value="list" startIcon={List}>List</SegmentedControl.Item>
 *     </SegmentedControl>
 *
 * **It is an input, not navigation.** Fourth Base UI component, and the first
 * built on `RadioGroup` + `Radio`: they supply `role="radiogroup"`,
 * `role="radio"`, `aria-checked`, roving tabindex and arrow-key movement. That
 * is the same DOM Meta's Astryx emits, and it is the reason a segmented control
 * is not a ToggleGroup — a group of `aria-pressed` toggles can be left with
 * nothing selected, while a segmented control always has exactly one. Tabs are
 * wrong for the opposite reason: they navigate between panels. This selects a
 * value.
 *
 * Figma models Hover / Focus / Disabled as a `State` property. In code those are
 * real CSS states, so there is no `state` prop; `disabled` is the native HTML
 * attribute, on the group or on one item.
 */

/**
 * Size and layout, set once on the group and read by every item, so the two can
 * never disagree — the same move as Breadcrumbs marking the current crumb and
 * Button deriving icon-only from the absence of a label. Deliberately not
 * exported: an item can't be a different size from the control it sits in.
 */
const SegmentedControlContext = createContext<{
  size: SegmentedControlSize
  layout: SegmentedControlLayout
}>({ size: 'default', layout: 'hug' })

const segmentedControl = tv({
  base: [
    'items-center gap-px',
    'rounded-md border p-px font-sans',
    // No `overflow-clip`, even though Figma has it. Figma draws focus as an
    // overlay *inside* the segment, so clipping costs it nothing. Here focus is
    // a ring 4px deep that paints outside the segment, and the segment sits only
    // 1px in from the track edge — clipping would slice the ring off the first
    // and last segments.
  ],

  variants: {
    /** Figma's `Appearance` property. Same token pairs as Button. */
    appearance: {
      secondary: 'bg-action-secondary-background border-action-secondary-border',
      ghost: 'bg-action-ghost-background border-action-ghost-border',
    },

    // Track heights are Button's. See the header for the arithmetic.
    size: {
      small: 'h-6', // 24px
      default: 'h-8', // 32px
      large: 'h-10', // 40px
    },

    /**
     * `hug` sizes segments to their labels; `fill` stretches them to equal
     * widths across the container. Astryx's `layout` prop, and the one thing
     * here that Figma does not draw — a gap in the file rather than an
     * invention, since it is the shape a fixed-width panel needs.
     *
     * Display lives here rather than in `base` so the two never fight: a hug
     * control is inline, a fill control is a block that takes the full width.
     */
    layout: {
      hug: 'inline-flex',
      fill: 'flex w-full',
    },
  },

  defaultVariants: {
    appearance: 'secondary',
    size: 'default',
    layout: 'hug',
  },
})

const segment = tv({
  base: [
    'inline-flex items-center justify-center',
    // gap-2 = 8px (spacing/2) at every size — Figma sets it unconditionally, so
    // this does not tighten to gap-1 at small the way Button does.
    'gap-2 rounded-sm font-sans whitespace-nowrap select-none',
    // Labels come from the Content ramp, not the Action one: an unselected
    // segment is `content-primary` and the selected one darkens to
    // `content-emphasized`, so selection is carried by colour as well as by
    // weight and the card. In dark mode that reads as stone-100 -> white.
    // Hover does not change the colour — only the background does.
    'cursor-pointer text-content-primary',
    // A 1px border at rest, transparent until selected. Without it, selecting a
    // segment would add a border and grow it by 2px, shoving the whole row.
    'border border-transparent',
    // Astryx crossfades the selected segment rather than sliding an indicator,
    // at 125ms on cubic-bezier(0.24, 1, 0.4, 1) — which is `--ease-standard`
    // exactly. `duration-fast-min` (130ms) is the closest token. Second
    // component to use the motion tier, after Tooltip.
    'transition-[color,background-color,border-color,box-shadow]',
    'duration-fast-min ease-standard',
    // Hover belongs to unselected segments only: Figma gives Active=On no hover
    // state at all. `data-unchecked` comes from Base UI.
    'data-unchecked:hover:bg-surface-canvas-overlay',
    // Selected: the raised white card. Weight goes 400 -> 600, as in Figma.
    'data-checked:bg-surface-background-primary data-checked:border-action-secondary-border',
    'data-checked:shadow-low data-checked:font-semibold data-checked:text-content-emphasized',
    // Focusing an unselected segment darkens its label to the selected colour.
    // Figma sets this on every Focus variant; it costs nothing on a selected
    // segment, which is already emphasized.
    'focus-visible:text-content-emphasized',
    // Focus is the library's shared ring — see src/lib/focus.ts. Figma draws it
    // at rounded-xs (4px) on a rounded-sm (6px) segment, an artefact of it being
    // a separate inset overlay layer; the segment's own radius is used instead,
    // as in Button.
    ...focusRing,
    // Disabled is a flat 40% opacity in Figma (opacity/opacity-40).
    'disabled:pointer-events-none disabled:opacity-40',
  ],

  variants: {
    // Heights are fixed, not min-heights, so a segment is the same height
    // whatever state it is in.
    size: {
      small: 'h-5 px-2 text-sm', // 20px
      default: 'h-7 px-3 text-base', // 28px
      // Large is taller but no wider: Figma gives it the same px-3 as default,
      // unlike Button, which steps 8 / 12 / 16.
      large: 'h-9 px-3 text-base', // 36px
    },

    layout: {
      hug: 'shrink-0',
      // Equal widths. `min-w-0` lets a long label shrink instead of forcing the
      // track wider than its container.
      fill: 'min-w-0 flex-1',
    },

    /**
     * Icon-only: the start icon with no label (Figma's `label` slot switched
     * off). Not a prop — derived from the absence of children, so a caller can
     * never set it and have the two disagree. Square at each size, so a row
     * mixing labelled and icon-only segments still lines up.
     */
    iconOnly: {
      true: 'px-0',
    },
  },

  compoundVariants: [
    { iconOnly: true, size: 'small', class: 'w-5' },
    { iconOnly: true, size: 'default', class: 'w-7' },
    { iconOnly: true, size: 'large', class: 'w-9' },
  ],

  defaultVariants: {
    size: 'default',
    layout: 'hug',
  },
})

type SegmentedControlVariants = VariantProps<typeof segmentedControl>
export type SegmentedControlSize = NonNullable<SegmentedControlVariants['size']>
export type SegmentedControlLayout = NonNullable<SegmentedControlVariants['layout']>
export type SegmentedControlAppearance = NonNullable<SegmentedControlVariants['appearance']>

/**
 * Which Icon size each control size reaches for. An explicit map rather than a
 * derivation, matching Button — the two scales are independent.
 */
const ICON_SIZE: Record<SegmentedControlSize, IconProps['size']> = {
  small: 'small', // 12px
  default: 'base', // 16px
  large: 'base', // 16px
}

export interface SegmentedControlProps
  extends Omit<RadioGroupProps<string>, 'className' | 'render'> {
  /** `SegmentedControl.Item` elements — two to five of them. */
  children: ReactNode
  /** Visual appearance. Maps to the Figma `Appearance` property. */
  appearance?: SegmentedControlAppearance
  /** Control size. Matches Button's scale: 24 / 32 / 40px tall. */
  size?: SegmentedControlSize
  /** `hug` sizes segments to their labels, `fill` stretches them equally. */
  layout?: SegmentedControlLayout
  className?: string
  /**
   * Required: names the group for screen readers, which announce it as
   * "<label>, radio group". Base UI only fills `aria-labelledby` from a
   * surrounding Field or Fieldset, so without this the group is unnamed.
   */
  'aria-label'?: string
}

interface SegmentedControlItemBaseProps
  extends Omit<RadioRootProps<string>, 'children' | 'className' | 'render' | 'nativeButton'> {
  /**
   * Lucide icon before the label (the Figma `icon` slot). Pass the component
   * itself: `startIcon={LayoutGrid}`, not `<LayoutGrid />`.
   */
  startIcon?: LucideIcon
  className?: string
}

/**
 * A segment is either labelled or icon-only, and the two have different rules,
 * so the props are a union rather than "everything optional". With no visible
 * text, `aria-label` is required — TypeScript will not let an unlabelled icon
 * segment compile, which is the accessibility mistake the shape invites.
 */
export type SegmentedControlItemProps = SegmentedControlItemBaseProps &
  (
    | { children: ReactNode; 'aria-label'?: string }
    | { children?: never; startIcon: LucideIcon; 'aria-label': string }
  )

function SegmentedControlItem({
  children,
  startIcon,
  className,
  ...props
}: SegmentedControlItemProps) {
  const { size, layout } = useContext(SegmentedControlContext)
  // No label to sit beside means the square, icon-only shape.
  const iconOnly = children == null || children === false

  return (
    <Radio.Root
      // Base UI's Radio renders a <span> by default, and inside a group it goes
      // through CompositeItem with `tag: "span"`. `render` swaps in a real
      // <button>, and `nativeButton` tells Base UI it no longer has to emulate
      // one — that pairing is what gives :focus-visible, the native `disabled`
      // attribute, and the same DOM Astryx ships.
      nativeButton
      render={<button type="button" />}
      className={cn(segment({ size, layout, iconOnly }), className)}
      {...props}
    >
      {startIcon && <Icon icon={startIcon} size={ICON_SIZE[size]} />}
      {children}
    </Radio.Root>
  )
}

SegmentedControlItem.displayName = 'SegmentedControl.Item'

export function SegmentedControl({
  children,
  appearance,
  size = 'default',
  layout = 'hug',
  className,
  ...props
}: SegmentedControlProps) {
  return (
    <RadioGroup className={cn(segmentedControl({ appearance, size, layout }), className)} {...props}>
      <SegmentedControlContext.Provider value={{ size, layout }}>
        {children}
      </SegmentedControlContext.Provider>
    </RadioGroup>
  )
}

SegmentedControl.Item = SegmentedControlItem
SegmentedControl.displayName = 'SegmentedControl'
