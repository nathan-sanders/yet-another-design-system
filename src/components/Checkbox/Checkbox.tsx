import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckboxGroup as CheckboxGroupPrimitive } from '@base-ui/react/checkbox-group'
import { Check, Minus } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing, focusRingWithin } from '../../lib/focus'
import { Divider } from '../Divider'
import { Icon } from '../Icon'

/**
 * Checkbox — a box you tick to turn one thing on or off.
 *
 * Mirrors the Figma component set "Checkbox" (node 40004007:4067):
 * `In Container` (False | True) x `State` (Default | Hover | Focus | Invalid |
 * Disabled) x `Selected State` (Default | Indeterminate | Selected), plus the
 * `Label`, `Sub Label` and `Slot` booleans. Twenty-four of the thirty
 * combinations are drawn; the gaps are all "hover or invalid on an already-
 * ticked box", which the CSS covers anyway.
 *
 * Figma models Hover / Focus / Disabled as a `State` property. In code those are
 * real CSS states, so there is no `state` prop — hover and focus come from the
 * browser and `disabled` is passed through to Base UI. `Invalid` is the one
 * member of that axis that is not a browser state, so it stays a prop.
 *
 *     <Checkbox label="Email me about updates" defaultChecked />
 *
 * **Seventh Base UI component**, and the first built on `Checkbox`. Base UI
 * supplies `role="checkbox"`, `aria-checked` (including `"mixed"`), the hidden
 * `<input type="checkbox">` that makes it submit with a form, and the
 * `data-checked` / `data-unchecked` / `data-indeterminate` attributes the styles
 * below hang off. All the styling is ours.
 *
 * **Indeterminate is a prop, not a third checked value.** That matches the DOM —
 * `input.indeterminate` has always been separate from `input.checked` — and it
 * is why the glyph is chosen from the prop rather than from Base UI's state: a
 * box can be indeterminate whether or not it is also checked, and Figma draws
 * the dash for that case regardless.
 *
 * **The label is a real `<label>`.** Wrapping is what makes clicking the text
 * toggle the box, and it is the path Base UI supports for naming a checkbox
 * whose root is not a native button — `CheckboxRoot` reaches for the wrapping
 * label through its hidden input when `nativeButton` is false, which is the
 * default and what is used here. Note this is the *opposite* call from
 * SegmentedControl, which pairs `nativeButton` with `render={<button>}`: a
 * segment sits in a radiogroup with roving tabindex and no label element around
 * it, so it has to be a button to get `:focus-visible`. A checkbox already has
 * one wrapped around it.
 */

/**
 * The 20px box. Figma's Checkbox frame, and the only part that is not text.
 *
 * Focus is the shared ring (src/lib/focus.ts), and it matters more here than
 * most: the old inner border painted 2px of white *inside* the box, which on a
 * ticked box left a white gutter between the fill and the tick — focus made the
 * tick look broken rather than making the box look focused.
 */
const box = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    // size-5 = width/w-5 (20px), rounded-sm = border-radius/rounded-sm (6px).
    'size-5 rounded-sm border',
    'cursor-pointer',
    // Unticked. The Input ramp, not the Action one: this is a form control.
    'bg-input-background border-input-border',
    'hover:border-input-border-hover',
    // Ticked and indeterminate are the same fill; only the glyph differs.
    'data-checked:bg-input-selected data-checked:border-input-selected',
    'data-indeterminate:bg-input-selected data-indeterminate:border-input-selected',
    // The glyph inherits this as currentColor, the way Icon is built to.
    'text-input-selected-foreground',
    'outline-none',
    // Same crossfade SegmentedControl uses for the same reason: the fill and
    // border both change on tick, and 130ms is the shortest motion token.
    'transition-colors duration-fast-min ease-standard',
    // Inside a Field, validity arrives here as `data-invalid` rather than as the
    // prop below: Base UI's `fieldValidityMapping` puts it on this element when
    // the surrounding Field is invalid. The two compose — either lights the
    // border — so the prop stays as the standalone path Figma draws. The `hover`
    // copy is spelled out because both selectors otherwise land on equal
    // specificity, leaving the winner to the order Tailwind happens to emit.
    'data-invalid:border-feedback-danger-highlight',
    'data-invalid:hover:border-feedback-danger-highlight',
  ],

  variants: {
    /**
     * Who draws the focus ring. Standalone, it is the box; inside a card it is
     * the card, because the box is a descendant of it and two concentric rings
     * on one control read as a mistake rather than as emphasis.
     */
    inContainer: {
      false: focusRing,
      true: '',
    },

    /**
     * Figma's `State=Invalid`, for a checkbox standing on its own. Inside a
     * `Field`, validity comes from there instead, through the `data-invalid:`
     * rules in the base list above — and the Field is the only place that can
     * also carry the message explaining what is wrong, so prefer it.
     */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { invalid: false, inContainer: false },
})

/**
 * The row, and — when `inContainer` is set — the card around it.
 *
 * The card's line is an `inset-ring` rather than a `border` because Figma draws
 * the container 40px tall: 24 of line-height plus 8 above and below. A border
 * would add its 2px on top of that and make it 42. `inset-ring` is a shadow, so
 * it costs no layout, which is the same reason Avatar uses one.
 *
 * The card keeps that 1px line unchanged when the control inside it takes
 * focus; the shared ring goes round the outside of the card instead.
 */
const field = tv({
  base: 'font-sans',

  variants: {
    inContainer: {
      // gap-3 = spacing/3 (12px).
      false: 'inline-flex items-center gap-3',
      true: [
        'flex w-full flex-col justify-center gap-2 px-3 py-2',
        'rounded-md bg-surface-card-primary inset-ring inset-ring-surface-border',
        'hover:bg-surface-card-subtle',
        ...focusRingWithin,
        // The card is a plain <label>, not a Base UI part, so it reads validity
        // off the control inside it — the same `has-` idiom as focusRingWithin
        // just above, and as Input's box.
        'has-[[data-invalid]]:inset-ring-feedback-danger-highlight',
        'has-[[data-invalid]]:hover:inset-ring-feedback-danger-highlight',
        'transition-colors duration-fast-min ease-standard',
      ],
    },

    /** Figma fades the whole row, label included, at opacity/opacity-40. */
    disabled: {
      true: 'pointer-events-none opacity-40',
      false: 'cursor-pointer',
    },

    invalid: { true: '', false: '' },
  },

  compoundVariants: [
    {
      inContainer: true,
      invalid: true,
      class: 'inset-ring-feedback-danger-highlight hover:inset-ring-feedback-danger-highlight',
    },
  ],

  defaultVariants: { inContainer: false, disabled: false, invalid: false },
})

/**
 * The label column. Inside a container the label is Content/Emphasized at
 * semibold — the card is a bigger target and Figma gives it more weight to
 * match. Outside one it is ordinary body text.
 */
const labelText = tv({
  base: 'text-base',
  variants: {
    inContainer: {
      false: 'font-normal text-content-primary',
      true: 'font-semibold text-content-emphasized',
    },
  },
  defaultVariants: { inContainer: false },
})

type FieldVariants = VariantProps<typeof field>

export interface CheckboxProps
  extends Omit<
    ComponentPropsWithRef<typeof CheckboxPrimitive.Root>,
    'className' | 'render' | 'children'
  > {
  /** The visible label. Figma's `Label` boolean plus its `Label Text`. */
  label?: ReactNode
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  /** Draws the card around the row. Maps to Figma's `In Container`. */
  inContainer?: boolean
  /** Maps to Figma's `State=Invalid`. Also sets `aria-invalid`. */
  invalid?: boolean
  /** Figma's `Slot` — extra content below the row. Container form only. */
  children?: ReactNode
  /** Extra classes for the outermost element. */
  className?: string
}

export function Checkbox({
  label,
  description,
  inContainer = false,
  invalid = false,
  disabled,
  indeterminate,
  children,
  className,
  ...props
}: CheckboxProps) {
  const control = (
    <>
      <CheckboxPrimitive.Root
        disabled={disabled}
        indeterminate={indeterminate}
        aria-invalid={invalid || undefined}
        className={box({ invalid, inContainer })}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="group flex">
          {/*
            Figma binds the glyph frame to width/w-3,5 (14px). Icon's own scale
            is 12/16/20/24, so there is no size for it — the className overrides
            the size utility, which is what `cn`'s tailwind-merge is for.

            **Both glyphs are rendered and one is hidden, rather than picking
            with `indeterminate ? Minus : Check`.** A `parent` checkbox inside a
            `Checkbox.Group` has its indeterminate state *computed* by Base UI
            from the values around it — `indeterminate = computedIndeterminate`
            in CheckboxRoot — so it never arrives as a prop, and a glyph chosen
            from the prop would show a tick on a half-selected parent. Reading it
            off `data-indeterminate` covers both the explicit and the computed
            case with one rule.
          */}
          <Icon icon={Check} className="size-3.5 group-data-indeterminate:hidden" />
          <Icon icon={Minus} className="hidden size-3.5 group-data-indeterminate:block" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {label != null && (
        <span
          className={cn(
            'flex flex-col items-start',
            // Inside the card the label column takes the leftover width, so a
            // long description wraps instead of widening the card. Outside it
            // the row hugs its content, as Figma draws it.
            inContainer ? 'min-w-px flex-1' : 'shrink-0',
          )}
        >
          <span className={labelText({ inContainer })}>{label}</span>
          {description != null && (
            <span className="text-sm font-normal text-content-subtle">{description}</span>
          )}
        </span>
      )}
    </>
  )

  const state: FieldVariants = { inContainer, disabled: Boolean(disabled), invalid }

  if (!inContainer) {
    return <label className={cn(field(state), className)}>{control}</label>
  }

  return (
    <label className={cn(field(state), className)}>
      <span className="flex w-full items-center gap-3">{control}</span>
      {children}
    </label>
  )
}

Checkbox.displayName = 'Checkbox'

/**
 * The group's own stack, and the row of items inside it.
 *
 * Figma draws the group as two frames: the Select All row and its Divider sit in
 * the outer one, and the options sit in an inner "Checkbox Items" frame that is
 * the part which turns into a row. Keeping that split is what lets the divider
 * stay full-width while the options beside it share the width between them.
 */
const group = tv({
  base: 'flex w-full flex-col gap-2 font-sans',
})

const groupItems = tv({
  base: 'flex w-full gap-2',

  variants: {
    orientation: {
      vertical: 'flex-col',
      // Figma gives each option `flex-1` + `min-w-px`, so a row divides the
      // width evenly rather than hugging the labels. Setting that from the
      // parent keeps `Checkbox` itself unaware of which direction it is in — the
      // alternative was a context for one class.
      //
      // `flex-wrap` is here and *not* in Figma's checkbox row, which only draws
      // the three-item case. Astryx's rule for the same component is not to go
      // horizontal past four options because it wraps awkwardly; wrapping badly
      // still beats overflowing the container, which is what the file's version
      // would do.
      horizontal: 'flex-wrap items-start [&>*]:min-w-px [&>*]:flex-1',
    },
  },

  defaultVariants: { orientation: 'vertical' },
})

export interface CheckboxGroupProps
  extends Omit<ComponentPropsWithRef<typeof CheckboxGroupPrimitive>, 'className' | 'render'> {
  /** `Checkbox` elements. */
  children: ReactNode
  /**
   * Maps to Figma's `Layout`. Named for Divider's property rather than Figma's,
   * because `layout` already means hug-or-fill on SegmentedControl and Tabs.
   */
  orientation?: 'vertical' | 'horizontal'
  /**
   * The label for a "select all" checkbox above the options, with a Divider
   * under it — Figma's `Select All Option` boolean plus its text. Omit it for a
   * plain group.
   *
   * **It needs `allValues`.** Base UI derives the parent's checked and
   * indeterminate states by comparing `value` against every value in the group,
   * and cannot know the ones nobody has ticked without being told.
   */
  selectAll?: ReactNode
  /** Extra classes for the outermost element. */
  className?: string
  /**
   * Names the group. A surrounding `Field` does this for you and is the better
   * route — it can carry a sub-label and a validation message too — so reach for
   * this only when the group stands alone.
   */
  'aria-label'?: string
}

/**
 * A set of checkboxes that share one value, optionally with a "select all" above
 * them.
 *
 * Mirrors the Figma component set "Checkbox Group" (node 40004010:5118):
 * `Layout` Vertical | Horizontal, plus the `Select All Option` boolean.
 *
 *     <Checkbox.Group
 *       allValues={['email', 'sms', 'push']}
 *       value={value}
 *       onValueChange={setValue}
 *       selectAll="Select all"
 *     >
 *       <Checkbox name="email" label="Email" />
 *       <Checkbox name="sms" label="SMS" />
 *       <Checkbox name="push" label="Push" />
 *     </Checkbox.Group>
 *
 * **Fifteenth Base UI component.** `CheckboxGroup` owns the array value and the
 * parent checkbox's arithmetic — which the `Parent` story used to do by hand,
 * and no longer does. It renders `role="group"`, which is also why the Divider
 * is safe here: unlike `tablist`, a group has no required-children rule for a
 * `role="separator"` to violate. Verified with axe, not assumed — that family of
 * bug has bitten Tabs and Menu.
 *
 * **Options are named by `name`, not `value`.** Base UI's CheckboxGroup matches
 * each checkbox to the group's array by its `name`, which is the one thing about
 * this API that reads wrong next to `Radio.Group`, where options carry `value`.
 */
function CheckboxGroupComponent({
  children,
  orientation = 'vertical',
  selectAll,
  className,
  ...props
}: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive className={cn(group(), className)} {...props}>
      {selectAll != null && (
        <>
          <Checkbox parent label={selectAll} />
          {/*
            A real Divider instance, as Figma draws it — the same component, not
            a hand-rolled line. Full width, and outside the items frame so a
            horizontal row does not push it into a column.
          */}
          <Divider />
        </>
      )}

      <div className={groupItems({ orientation })}>{children}</div>
    </CheckboxGroupPrimitive>
  )
}

CheckboxGroupComponent.displayName = 'Checkbox.Group'

Checkbox.Group = CheckboxGroupComponent


/**
 * The raw Base UI parts, for a checkbox that needs a different shape than
 * "box, label, sub-label" — a custom indicator, say, or a root that is not
 * wrapped in a label because something else already names it.
 */
Checkbox.Root = CheckboxPrimitive.Root
Checkbox.Indicator = CheckboxPrimitive.Indicator
