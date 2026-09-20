import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import type { RadioGroupProps as BaseRadioGroupProps } from '@base-ui/react/radio-group'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import {
  controlDescription,
  controlLabel,
  controlLabelColumn,
  controlRow,
  radioDial,
  type ControlRowVariants,
} from '../Checkbox/styles'

/**
 * Radio — pick exactly one option from a list you can see all of.
 *
 * Mirrors the Figma component set "Radio" (node 40004007:4096):
 * `In Container` (False | True) x `State` (Default | Hover | Focus | Invalid |
 * Disabled) x `Selected State` (Default | Selected), plus the `Label` and
 * `Sub Label` booleans. Eighteen of the twenty combinations are drawn; the two
 * gaps are hover and invalid on an already-selected dial, which the CSS covers.
 *
 *     <Radio.Group aria-label="Sort by" value={sort} onValueChange={setSort}>
 *       <Radio value="date" label="Date" />
 *       <Radio value="name" label="Name" description="A to Z" />
 *     </Radio.Group>
 *
 * **Eighth Base UI component.** `Radio` and `RadioGroup` are the same pair
 * SegmentedControl is built on, and they supply `role="radiogroup"`,
 * `role="radio"`, `aria-checked`, roving tabindex and arrow-key movement.
 *
 * **This is a list; SegmentedControl is a control.** Both are one-of-many built
 * on the same primitive, and the difference is presentation, not semantics: a
 * segmented control is a compact strip you put beside a Button, a radio list is
 * a stack of labeled options with room for a sentence under each. Reach for
 * this when the options need explaining, and for SegmentedControl when they fit
 * in a word each.
 *
 * **Selection follows focus**, as it does in SegmentedControl and as a
 * radiogroup should: arrowing onto an option selects it. Don't fight it.
 *
 * **The dial's selected state is a flattened vector in Figma** with no bound
 * variables, so its geometry was read off the exported SVG rather than guessed:
 * a 20px circle filled with Input/Selected, and a `r="4"` — so 8px across —
 * glyph in Input/Selected Foreground. That is Base UI's `Radio.Indicator`.
 *
 * The dial, the row, the card and the label column are the shared control
 * shapes in `Checkbox/styles.ts`. They were a deliberate copy of Checkbox's
 * for a long time — Figma keeps the sets separate, and a shared module pins
 * them together — and this file said a third control would be the point to
 * extract, then Switch said a fourth. Questionnaire's answer row was the
 * fourth, and the four were extracted on 2026-09-20; the one thing Radio's
 * card does differently, laying the row out flat with no slot under it, is
 * the `layout: 'row'` variant there.
 */


export interface RadioProps
  extends Omit<
    ComponentPropsWithRef<typeof RadioPrimitive.Root>,
    'className' | 'render' | 'children' | 'nativeButton'
  > {
  /** The visible label. Figma's `Label` boolean plus its `Label Text`. */
  label?: ReactNode
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  /** Draws the card around the row. Maps to Figma's `In Container`. */
  inContainer?: boolean
  /** Maps to Figma's `State=Invalid`. Also sets `aria-invalid`. */
  invalid?: boolean
  /** Extra classes for the outermost element. */
  className?: string
}

export function Radio({
  label,
  description,
  inContainer = false,
  invalid = false,
  disabled,
  className,
  ...props
}: RadioProps) {
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`

  const state: ControlRowVariants = { inContainer, layout: 'row', disabled: Boolean(disabled), invalid }

  return (
    // A real <label> round the row, so clicking the text selects the option.
    // Base UI reaches for the wrapping label through the hidden input when
    // `nativeButton` is false, which is the default and what is used here —
    // the same call Checkbox makes, and the opposite of SegmentedControl's.
    <label className={cn(controlRow(state), className)}>
      <RadioPrimitive.Root
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={radioDial({ invalid, inContainer })}
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
        {/* r="4" in Figma's exported SVG, so 8px across. */}
        <RadioPrimitive.Indicator className="size-2 rounded-full bg-input-selected-foreground" />
      </RadioPrimitive.Root>

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
    </label>
  )
}

Radio.displayName = 'Radio'

/**
 * The group's stack or row. Figma wraps the options in a "Radio Items" frame
 * inside an outer one; with no select-all to sit beside — Checkbox Group's
 * reason for the split — the two are flattened into one element here.
 */
const group = tv({
  base: 'flex w-full gap-2 font-sans',

  variants: {
    orientation: {
      vertical: 'flex-col',
      // Figma gives each option `flex-1` + `min-w-px`, so a row divides the
      // width evenly rather than hugging the labels. Set from the parent so
      // `Radio` stays unaware of which direction it is in.
      horizontal: 'flex-wrap items-start [&>*]:min-w-px [&>*]:flex-1',
    },
  },

  defaultVariants: { orientation: 'vertical' },
})

export interface RadioGroupProps
  extends Omit<BaseRadioGroupProps<string>, 'className' | 'render'> {
  /** `Radio` elements. */
  children: ReactNode
  /**
   * Maps to Figma's `Layout`. Named for Divider's property rather than Figma's,
   * because `layout` already means hug-or-fill on SegmentedControl and Tabs.
   */
  orientation?: 'vertical' | 'horizontal'
  className?: string
  /**
   * Names the group, which screen readers announce as "<label>, radio group".
   * A surrounding `Field` does this for you and is the better route — it can
   * carry a sub-label and a validation message too — so reach for this only when
   * the group stands alone.
   */
  'aria-label'?: string
}

/**
 * The group. Base UI's `RadioGroup` is not optional scaffolding — it owns the
 * selected value, the roving tabindex and the arrow keys, so a `Radio` outside
 * one does nothing.
 *
 * Mirrors the Figma component set "Radio Group" (node 40004010:5003), whose only
 * property is `Layout` Vertical | Horizontal. This is Astryx's `RadioList`, and
 * its guidance applies: two to seven options, and don't go horizontal past four
 * because it wraps awkwardly.
 *
 * Everything Astryx builds into that component — the group's label, its
 * description, the required marker, the validation message — is `Field`'s job
 * here, which is what Figma says too by giving Field a `Type=Radio` variant.
 *
 * **`orientation` is presentation only, and deliberately not passed to Base
 * UI.** Its composite defaults to `orientation: 'both'`, so all four arrow keys
 * already move between options whichever way the row runs — read out of
 * `useCompositeRoot`, not assumed. Constraining it to one axis would take away
 * working keys for no gain.
 */
function RadioGroupComponent({
  children,
  orientation = 'vertical',
  className,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroup className={cn(group({ orientation }), className)} {...props}>
      {children}
    </RadioGroup>
  )
}

RadioGroupComponent.displayName = 'Radio.Group'

Radio.Group = RadioGroupComponent

/**
 * The raw Base UI parts, for a radio that needs a different shape than
 * "dial, label, sub-label" — a custom indicator, say, or a root that something
 * else already names.
 */
Radio.Root = RadioPrimitive.Root
Radio.Indicator = RadioPrimitive.Indicator
