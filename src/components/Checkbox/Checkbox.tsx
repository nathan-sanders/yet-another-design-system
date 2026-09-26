import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckboxGroup as CheckboxGroupPrimitive } from '@base-ui/react/checkbox-group'
import { Check, Minus } from 'lucide-react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Divider } from '../Divider'
import { Icon } from '../Icon'
import {
  checkboxBox,
  controlDescription,
  controlLabel,
  controlLabelColumn,
  controlRow,
  controlRowInner,
  type ControlRowVariants,
} from './styles'

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
 * The box, the row, the card and the label column are the shared control
 * shapes in `./styles.ts` — drawn here first, and now imported by Radio,
 * Switch and Questionnaire rather than copied. See that file for the
 * measurements and the reasons.
 */

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
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`

  const control = (
    <>
      <CheckboxPrimitive.Root
        disabled={disabled}
        indeterminate={indeterminate}
        aria-invalid={invalid || undefined}
        className={checkboxBox({ invalid, inContainer })}
        // Named by its own text and described by its own sub-label, said out
        // loud. Base UI takes a surrounding Field's label id ahead of the
        // wrapping <label>, so inside `<Field label="Send me">` every box in a
        // group was announced as "Send me" and its own text was lost. An
        // explicit `aria-labelledby` comes first in that precedence, and the
        // Field's sub-label and message still reach `aria-describedby`, because
        // Base UI appends to that one rather than replacing it. Only spread when
        // there is text to point at — an undefined aria-* prop deletes what
        // Base UI computed.
        {...(label != null && { 'aria-labelledby': labelId })}
        {...(description != null && { 'aria-describedby': descriptionId })}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="group flex">
          {/*
            Figma binds the glyph frame to width/w-3,5 (14px), which is Icon's
            `small`.

            **Both glyphs are rendered and one is hidden, rather than picking
            with `indeterminate ? Minus : Check`.** A `parent` checkbox inside a
            `Checkbox.Group` has its indeterminate state *computed* by Base UI
            from the values around it — `indeterminate = computedIndeterminate`
            in CheckboxRoot — so it never arrives as a prop, and a glyph chosen
            from the prop would show a tick on a half-selected parent. Reading it
            off `data-indeterminate` covers both the explicit and the computed
            case with one rule.
          */}
          <Icon icon={Check} size="small" className="group-data-indeterminate:hidden" />
          <Icon icon={Minus} size="small" className="hidden group-data-indeterminate:block" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {label != null && (
        <span className={controlLabelColumn({ fill: inContainer })}>
          <span id={labelId} className={controlLabel({ emphasized: inContainer })}>
            {label}
          </span>
          {description != null && (
            <span id={descriptionId} className={controlDescription}>
              {description}
            </span>
          )}
        </span>
      )}
    </>
  )

  const state: ControlRowVariants = { inContainer, disabled: Boolean(disabled), invalid }

  if (!inContainer) {
    return <label className={cn(controlRow(state), className)}>{control}</label>
  }

  return (
    <label className={cn(controlRow(state), className)}>
      <span className={controlRowInner}>{control}</span>
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
