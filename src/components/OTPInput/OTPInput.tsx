import { useId, type ComponentPropsWithRef } from 'react'
import { OTPField as OTPFieldPrimitive } from '@base-ui/react/otp-field'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import type { InputSize } from '../Input/styles'

/**
 * One character box.
 *
 * **Not a share of `Input`'s `box`, and that is deliberate.** That recipe is
 * `w-full flex-wrap` with the focus ring baked in as `focusRingWithin` — none of
 * which a 32px square slot wants. It is the same tokens written for a different
 * shape, which is the line the sharing rule draws: reuse when it is the same
 * primitive underneath, not when it merely looks alike.
 *
 * **Square at the field's own height**, 24 / 32 / 40, so a row of slots lines up
 * with an `Input` beside it. Most systems draw the slot wider than it is tall;
 * this one keeps the library's scale instead, and the digit is centered in it.
 */
const slot = tv({
  base: [
    'flex items-center justify-center',
    'rounded-md border border-input-border bg-input-background',
    'text-center text-content-primary',
    'hover:border-input-border-hover',
    // The ring goes on the slot, not on the row. Every slot is a real focusable
    // <input>, so this is Combobox's tokenizer rule seen from the other end:
    // the thing that has focus draws the ring and the container draws nothing.
    ...focusRing,
    // `data-filled` is per slot — OTPFieldInputState redefines `filled` to mean
    // *this* box rather than the whole value, which is what lets a filled slot
    // read stronger with no per-slot props.
    'data-filled:border-input-border-hover',
    'data-invalid:border-feedback-danger-highlight',
    'data-invalid:hover:border-feedback-danger-highlight',
    'disabled:pointer-events-none disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    size: {
      small: 'size-6 text-sm', // 24px, text 12/20
      default: 'size-8 text-base', // 32px, text 14/24
      large: 'size-10 text-base', // 40px, text 14/24
    },
  },

  defaultVariants: { size: 'default' },
})

const row = tv({
  base: 'flex w-fit items-center gap-2 font-sans',
})

export interface OTPInputProps
  extends Omit<
    ComponentPropsWithRef<typeof OTPFieldPrimitive.Root>,
    'className' | 'render' | 'children'
  > {
  /** How many characters. Base UI's `length`, and required there too. */
  length: number
  /** Slot size. Input's scale: 24 / 32 / 40px square. */
  size?: InputSize
  /**
   * Maps to Figma's `State=Invalid`, for an OTPInput standing on its own.
   * Inside a `Field`, set it there instead.
   */
  invalid?: boolean
  /**
   * Accessible name, for an OTPInput with no `Field` around it.
   *
   * It reaches the first slot as an `aria-labelledby` pointing at a visually
   * hidden span, **not** as an `aria-label` — see the note on the component
   * about why Base UI throws that one away.
   */
  'aria-label'?: string
  /** Accessible name by reference. Lands on the first slot, as `aria-label` does. */
  'aria-labelledby'?: string
  /** Extra classes for the row. */
  className?: string
}

/**
 * OTPInput — a row of single-character boxes for a code somebody was just sent.
 *
 * **Sixteenth Base UI component**, first on `otp-field`; NumberInput was the
 * fifteenth. Three parts: Root, Input and Separator.
 *
 *     <Field label="Verification code" description="We sent it to your email">
 *       <OTPInput length={6} onValueComplete={submit} />
 *     </Field>
 *
 * **`length` renders the slots; it does not configure one input.** Base UI wants
 * one `OTPField.Input` per box *and* the count on the Root — the Root needs it to
 * clamp a pasted value and to know when the code is complete, before any slot has
 * hydrated. So `length` is passed twice, and the map is here rather than in
 * every caller.
 *
 * **Base UI's `Separator` is `@base-ui/react/separator`** — literally the same
 * component object the library already wraps as `Divider`. It is re-attached
 * below for a caller who wants `123-456` chunking, but there is no `groups`
 * prop: plain gapped slots are the component.
 *
 * **The first slot's name comes from the `Field`.** Base UI derives every other
 * slot's id from the Root's (`{id}-2`, `{id}-3`, …), so `Field.Label`'s `htmlFor`
 * lands on slot one and clicking the label puts the caret there. The rest carry
 * their own `aria-label`, or a screen reader would read six identically-named
 * boxes.
 *
 * **Standing alone, the name has to arrive as `aria-labelledby`, and that is
 * Base UI's rule rather than a choice here.** `OTPField.Input` reads
 * `aria-label` and then throws it away on index 0 — `index === 0 ? undefined :
 * slotAriaLabel`, with a dev-only warning telling you to use a `<label>` or a
 * `<Field.Label>` instead. So the ordinary `aria-label` route every other
 * control here takes is not available, and passing one produced six unnamed
 * inputs and an axe failure rather than an error. It is accepted anyway,
 * because a library where one control silently refuses the prop every other
 * control takes is worse than one that adapts: it becomes an `aria-labelledby`
 * pointing at a visually hidden span, which is what Base UI wanted all along.
 */
export function OTPInput({
  length,
  size = 'default',
  invalid = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...props
}: OTPInputProps) {
  const labelId = useId()
  const ownLabel = Boolean(ariaLabel) && !ariaLabelledBy

  // **Spread only when set.** Inside a Field, Base UI computes `aria-labelledby`
  // for the first slot from the field context, and writing the key with an
  // `undefined` value overrides that rather than deferring to it — which strips
  // the name off slot one and leaves the other five named. Select's bug, and the
  // shape of thing axe is there to find.
  //
  // Note there is no `aria-label` key here even when one was given: at index 0
  // Base UI discards it, so the name has to arrive by reference.
  const naming = ariaLabelledBy
    ? { 'aria-labelledby': ariaLabelledBy }
    : ownLabel
      ? { 'aria-labelledby': labelId }
      : {}

  return (
    <OTPFieldPrimitive.Root length={length} className={cn(row(), className)} {...props}>
      {/*
        `sr-only` is `position: absolute`, so it is not a flex item and does not
        eat one of the row's gaps.
      */}
      {ownLabel && (
        <span id={labelId} className="sr-only">
          {ariaLabel}
        </span>
      )}
      {Array.from({ length }, (_, index) => (
        <OTPFieldPrimitive.Input
          key={index}
          aria-invalid={invalid || undefined}
          // Slot one takes the field's name — from a `Field` around it, or from
          // `aria-label` here. The rest name their position, or a screen reader
          // reads six identically-named boxes. Base UI's own demo spells the
          // same split as `aria-label={index === 0 ? undefined : …}`, which is
          // the `undefined`-clobbers-ARIA bug written out; spread instead.
          {...(index === 0
            ? naming
            : { 'aria-label': `Character ${index + 1} of ${length}` })}
          className={slot({ size })}
        />
      ))}
    </OTPFieldPrimitive.Root>
  )
}

OTPInput.displayName = 'OTPInput'

/**
 * The raw Base UI parts, for a code presented in chunks — three slots, a
 * separator, three more. `Separator` is the same object as `Divider`'s
 * primitive, so it takes the same `orientation`.
 */
OTPInput.Root = OTPFieldPrimitive.Root
OTPInput.Slot = OTPFieldPrimitive.Input
OTPInput.Separator = OTPFieldPrimitive.Separator
