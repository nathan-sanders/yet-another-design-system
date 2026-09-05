import type { ComponentPropsWithRef, ReactNode } from 'react'
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { GripVertical, Minus, Plus } from 'lucide-react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon } from '../Icon'
import {
  ICON_SIZE,
  addonText,
  box,
  control,
  type InputAppearance,
  type InputSize,
} from '../Input/styles'

/**
 * The − and + cells at each end of the field.
 *
 * Square at the box's **inner** height — the box minus its two 1px borders —
 * which is the same 22 / 30 / 38 arithmetic `control` already uses, so the cell
 * fills the field's height exactly without pushing it taller.
 *
 * **No divider between the cell and the text.** `InputGroup.Addon` draws none,
 * and the ghost hover wash is what gives the button its shape; a hairline would
 * be a second mechanism doing the same job. (Astryx's stepper does draw one, but
 * its steppers are a stacked column flush at the trailing edge — a different
 * drawing, so none of its parts carry over.)
 *
 * The inner radius matches the box's own `rounded-md` so a hovered cell's wash
 * follows the corner instead of squaring it off.
 */
const stepper = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    'text-content-primary',
    'cursor-pointer select-none',
    'hover:bg-action-ghost-background-hover',
    // Its own ring, because the box's is scoped to the <input> — see `ring` in
    // Input/styles.ts. One ring at a time, always on the thing that has focus.
    //
    // **Measured: Base UI gives both buttons `tabindex="-1"`**, which is the
    // standard spinbutton arrangement — the keyboard path to the value is the
    // input's own arrow keys, not two extra tab stops. A mouse press does not
    // land focus here either; Base UI sends it to the input. So this ring is a
    // guard rather than a state anybody will see today, and it stays for the
    // same reason `ring: 'input'` does: the moment either of those changes, or
    // somebody reaches for the raw `NumberInput.Increment`, the alternative is
    // two rings on one control.
    ...focusRing,
    'disabled:pointer-events-none disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    size: {
      small: 'size-5.5', // 22px
      default: 'size-7.5', // 30px
      large: 'size-9.5', // 38px
    },

    align: {
      start: 'order-2 rounded-l-md',
      end: 'order-5 rounded-r-md',
    },
  },

  defaultVariants: { size: 'default', align: 'start' },
})

/** The grip you drag sideways. Ordered ahead of the − cell. */
const scrubHandle = tv({
  base: [
    'flex shrink-0 items-center justify-center self-stretch',
    'order-1 pl-3',
    'cursor-ew-resize select-none',
    'text-content-subtle',
  ],
})

export interface NumberInputProps
  extends Omit<
    ComponentPropsWithRef<typeof NumberFieldPrimitive.Root>,
    'className' | 'render' | 'children'
  > {
  /** Field size. Input's scale: 24 / 32 / 40px tall. */
  size?: InputSize
  /** `ghost` drops the fill and the stroke until you go near the field. */
  appearance?: InputAppearance
  /**
   * Maps to Figma's `State=Invalid`, for a NumberInput standing on its own.
   * Inside a `Field`, set it there instead.
   */
  invalid?: boolean
  /**
   * Show the flanking − and + buttons. **On by default**, unlike Astryx's
   * `hasNumberSteppers` — the steppers are what make this a NumberInput rather
   * than an `Input` with a numeric keyboard, so the default shows the component
   * being itself. Figma's `Steppers` boolean defaults the same way.
   */
  steppers?: boolean
  /** A trailing unit inside the field — `%`, `GB`. Astryx's `units`. */
  units?: ReactNode
  /** A leading grip that changes the value when dragged sideways. */
  scrubbable?: boolean
  /** Placeholder for the empty field. */
  placeholder?: string
  /** Accessible name, for a NumberInput with no `Field` around it. */
  'aria-label'?: string
  /** Accessible name by reference, for a NumberInput with no `Field` around it. */
  'aria-labelledby'?: string
  /** Extra classes for the bordered box. */
  className?: string
}

/**
 * NumberInput — a field that only takes numbers, with optional − and + buttons.
 *
 * **Fifteenth Base UI component**, first on `number-field`; Field was the
 * fourteenth. Base UI supplies all seven parts — Root, Group, Decrement, Input,
 * Increment, ScrubArea and ScrubAreaCursor — so the only thing written here is
 * the chrome.
 *
 *     <Field label="Team size" description="People on the team">
 *       <NumberInput steppers min={1} max={50} defaultValue={3} />
 *     </Field>
 *
 * **It borrows Input's box rather than copying it**, which is Autocomplete's
 * arrangement: `box`, `control`, `addonText` and `ICON_SIZE` all come from
 * `Input/styles.ts`, so the field is the same 24 / 32 / 40 with the same
 * padding, the same placeholder and the same invalid border. Only the stepper
 * cell is new.
 *
 * **`NumberField.Group` is the box, not `Root`.** Root renders a bare `<div>`
 * that carries no styling at all — Group is the element that actually contains
 * the input and the two buttons, and it is what Base UI gives `role="group"`.
 *
 * **The alignment is derived, not declared.** With steppers the field is a
 * quantity picker and the value centers between the two buttons; without them it
 * is an Input and reads left-aligned like one. That follows from what you
 * passed, so it is not a prop — the same rule as Avatar's `Content` and Button's
 * icon-only form.
 *
 * **Formatting is `format` and `locale`, straight through to Base UI.** The
 * primitive already shows the formatted value at rest and the raw number on
 * focus, and exposes the formatted one through `aria-valuetext`. Astryx models
 * this as a `formatValue` callback; `Intl.NumberFormatOptions` is the same idea
 * with a shared vocabulary, so there is nothing to write.
 *
 * **The name comes from a `Field`, or from `aria-label`.** Base UI puts
 * `aria-roledescription="Number field"` on the input, which is a role
 * description and not a name — an unnamed NumberInput is as unnamed as an
 * unnamed Input.
 */
export function NumberInput({
  size = 'default',
  appearance = 'default',
  invalid = false,
  steppers = true,
  units,
  scrubbable = false,
  placeholder,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...props
}: NumberInputProps) {
  // **Spread only when set.** Inside a Field, Base UI computes `aria-labelledby`
  // from the field context, and writing the key with an `undefined` value
  // overrides that rather than deferring to it — which silently strips the name
  // off the control. Select's bug, and the shape of thing axe is there to find.
  const naming = {
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
    ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
  }

  return (
    <NumberFieldPrimitive.Root {...props}>
      {/*
        `ring: 'input'` rather than the default `within`, because the box has
        more than one candidate inside it and `has-focus-visible:` does not care
        which one matched. Combobox's tokenizer settled the same question the
        same way — scope the box's ring to the caret.

        Measured afterwards, and the finding is worth keeping: Base UI holds both
        steppers at `tabindex="-1"`, so today the two spellings paint
        identically. The scoped one is still the right one — it says what should
        fire the ring rather than what happens to.
      */}
      <NumberFieldPrimitive.Group
        className={cn(box({ size, appearance, invalid, ring: 'input' }), className)}
      >
        {scrubbable && (
          <NumberFieldPrimitive.ScrubArea className={scrubHandle()}>
            <Icon icon={GripVertical} size={ICON_SIZE[size]} />
            <NumberFieldPrimitive.ScrubAreaCursor />
          </NumberFieldPrimitive.ScrubArea>
        )}

        {steppers && (
          <NumberFieldPrimitive.Decrement
            aria-label="Decrease"
            className={stepper({ size, align: 'start' })}
          >
            <Icon icon={Minus} size={ICON_SIZE[size]} />
          </NumberFieldPrimitive.Decrement>
        )}

        <NumberFieldPrimitive.Input
          aria-invalid={invalid || undefined}
          placeholder={placeholder}
          {...naming}
          className={cn(control({ size }), steppers && 'text-center')}
        />

        {units != null && (
          <span className={cn(addonText(), 'order-4 shrink-0 pr-3')}>{units}</span>
        )}

        {steppers && (
          <NumberFieldPrimitive.Increment
            aria-label="Increase"
            className={stepper({ size, align: 'end' })}
          >
            <Icon icon={Plus} size={ICON_SIZE[size]} />
          </NumberFieldPrimitive.Increment>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

NumberInput.displayName = 'NumberInput'

/**
 * The raw Base UI parts, for a number field that needs a different shape than
 * this one — the stacked stepper column Astryx draws, or Base UI's own scrub
 * area wrapped round a label rather than round a grip inside the field.
 */
NumberInput.Root = NumberFieldPrimitive.Root
NumberInput.Group = NumberFieldPrimitive.Group
NumberInput.RawInput = NumberFieldPrimitive.Input
NumberInput.Increment = NumberFieldPrimitive.Increment
NumberInput.Decrement = NumberFieldPrimitive.Decrement
NumberInput.ScrubArea = NumberFieldPrimitive.ScrubArea
NumberInput.ScrubAreaCursor = NumberFieldPrimitive.ScrubAreaCursor
