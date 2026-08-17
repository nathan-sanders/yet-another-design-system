import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import type { RadioGroupProps as BaseRadioGroupProps } from '@base-ui/react/radio-group'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing, focusRingWithin } from '../../lib/focus'

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
 * a stack of labelled options with room for a sentence under each. Reach for
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
 * The row, the card and the label column are deliberately the same shapes
 * Checkbox draws, and the recipes below are deliberately a copy rather than a
 * shared module: Figma keeps the two as separate component sets that can drift,
 * and this library's precedent for sharing styles (Avatar/AvatarGroup) is a
 * `styles.ts` inside one folder, not a module spanning two. If a third control
 * needs this row, that is the point to extract it.
 *
 * Switch is that third control, and it copied them again rather than extracting:
 * a module spanning three folders would pin the three together in code while
 * Figma's three separate sets are free to drift. **A fourth is the point.**
 */

/**
 * The 20px dial. Focus is the shared ring (src/lib/focus.ts), drawn outside the
 * dial: the selected state is already a disc inside a ring, so anything painted
 * *inside* the circle competes with the indicator instead of framing it.
 */
const dial = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    // size-5 = width/w-5 (20px), rounded-full = border-radius/rounded-full.
    'size-5 rounded-full border',
    'cursor-pointer',
    // Unselected. The Input ramp, not the Action one: this is a form control.
    'bg-input-background border-input-border',
    'hover:border-input-border-hover',
    // Selected is a solid disc — Figma fills background and stroke with the
    // same token, which is what the exported SVG shows.
    'data-checked:bg-input-selected data-checked:border-input-selected',
    'outline-none',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    /**
     * Who draws the focus ring, as in Checkbox: standalone it is the dial,
     * inside a card it is the card. Two concentric rings on one control read as
     * a mistake rather than as emphasis.
     */
    inContainer: {
      false: focusRing,
      true: '',
    },

    /**
     * Figma's `State=Invalid`. Base UI publishes `data-invalid` only for a radio
     * inside a `Field`, and the library has no Field component yet, so this is a
     * plain prop. Swap it for `data-invalid:` when Field lands.
     */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { invalid: false, inContainer: false },
})

/**
 * The row, and — when `inContainer` is set — the card around it. The card's line
 * is an `inset-ring` rather than a `border` for the reason Checkbox's is: Figma
 * draws the container 40px tall, and a border would add its 2px on top of that.
 */
const field = tv({
  base: 'font-sans',

  variants: {
    inContainer: {
      false: 'inline-flex items-center gap-3',
      true: [
        'flex w-full items-center gap-3 px-3 py-2',
        'rounded-md bg-surface-card-primary inset-ring inset-ring-surface-border',
        'hover:bg-surface-card-subtle',
        ...focusRingWithin,
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
 * Inside a container the label is Content/Emphasized at semibold — the card is a
 * bigger target and Figma gives it more weight to match.
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
  const state: FieldVariants = { inContainer, disabled: Boolean(disabled), invalid }

  return (
    // A real <label> round the row, so clicking the text selects the option.
    // Base UI reaches for the wrapping label through the hidden input when
    // `nativeButton` is false, which is the default and what is used here —
    // the same call Checkbox makes, and the opposite of SegmentedControl's.
    <label className={cn(field(state), className)}>
      <RadioPrimitive.Root
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={dial({ invalid, inContainer })}
        {...props}
      >
        {/* r="4" in Figma's exported SVG, so 8px across. */}
        <RadioPrimitive.Indicator className="size-2 rounded-full bg-input-selected-foreground" />
      </RadioPrimitive.Root>

      {label != null && (
        <span
          className={cn(
            'flex flex-col items-start',
            // Inside the card the label column takes the leftover width so a
            // long description wraps rather than widening the card. Outside it
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
    </label>
  )
}

Radio.displayName = 'Radio'

export interface RadioGroupProps
  extends Omit<BaseRadioGroupProps<string>, 'className' | 'render'> {
  /** `Radio` elements. */
  children: ReactNode
  className?: string
  /**
   * Required: names the group, which screen readers announce as
   * "<label>, radio group". Base UI only fills `aria-labelledby` from a
   * surrounding Field or Fieldset, so without this the group is unnamed —
   * the same requirement SegmentedControl carries.
   */
  'aria-label'?: string
}

/**
 * The group. Base UI's `RadioGroup` is not optional scaffolding — it owns the
 * selected value, the roving tabindex and the arrow keys, so a `Radio` outside
 * one does nothing.
 *
 * **This is not Figma's "Radio Group" component set.** That set exists in the
 * file and has its own anatomy — a legend, a description, an orientation — and
 * it belongs in its own PR alongside `Field`. What is here is the minimum Base
 * UI requires, stacked at `gap-3`, and `className` overrides it.
 */
function RadioGroupComponent({ children, className, ...props }: RadioGroupProps) {
  return (
    <RadioGroup className={cn('flex flex-col gap-3 font-sans', className)} {...props}>
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
