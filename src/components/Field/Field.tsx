import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * Field — the label, sub-label and validation message around a form control.
 *
 * Mirrors the Figma component set "Field" (node 40004051:15082), whose `Type`
 * property swaps the control it wraps: Input, Input Group, Autocomplete, Select,
 * Combobox, Checkbox, Checkbox Group, Radio.
 *
 *     <Field label="Email" description="We'll only use it to sign you in">
 *       <Input type="email" placeholder="ada@example.com" />
 *     </Field>
 *
 * **The file is explicit that the label belongs here and not to the control.**
 * Every variant nests its control with the control's own `Label` boolean
 * switched *off* — so Input draws a label when it stands alone and hands it over
 * the moment it sits in a Field. The code follows: `Input` and `InputGroup` are
 * the control and nothing else, and this owns the text around them.
 *
 * **`Type` is derived, not a prop.** What you pass as children decides it, the
 * way Avatar's `Content` follows from `src`/`name`/`count` and Button's
 * icon-only form follows from having no label. A Field cannot be wrong about
 * which control is inside it.
 *
 * **Fourteenth Base UI component.** `Field.Root` supplies the wiring that is the
 * whole reason not to hand-roll this: `Field.Label` gets `htmlFor` pointed at
 * the control automatically, and `Field.Description` and `Field.Error` are both
 * folded into its `aria-describedby`. There is no `useId` here, unlike Tooltip,
 * which had to patch its own ARIA by hand.
 *
 * Base UI's `validate` / `validationMode` / `validationDebounceTime` are
 * deliberately not surfaced. This is presentational; deciding *when* a value is
 * wrong belongs to a Form component that does not exist yet, and `invalid` and
 * `error` are the external-control path Base UI documents for exactly that.
 *
 * **It labels a group as readily as a control.** Figma's `Type=Checkbox` and
 * `Type=Radio` put this label *above* a control that already has its own — the
 * legend over a set, not a second name for one box. That is why Checkbox, Radio
 * and Switch keep their own wrapping `<label>`, which is what makes their text a
 * hit target, and take a Field around the outside rather than instead.
 */
const field = tv({
  base: 'flex w-full flex-col gap-2 font-sans',
})

/**
 * Figma's `Label Text` — Content/Emphasized at text-base **semibold**.
 *
 * The weight is the one place the file disagreed with itself: the Input set drew
 * its own label at 400 and this draws it at 600. Field won, being both the newer
 * set and the one that now owns the label everywhere; the Input set is being
 * updated to match rather than the other way round.
 */
const labelText = tv({
  base: 'text-base font-semibold text-content-emphasized data-disabled:opacity-40',
})

/**
 * Figma's `Sub Label`, hard against the label at gap-0. It defaults **off** here
 * as it does in the file — the label is the requirement, this is the extra.
 */
const descriptionText = tv({
  base: 'text-sm font-normal text-content-subtle data-disabled:opacity-40',
})

/**
 * Figma's `Validation Message` — Content/Danger at text-sm, and **italic**.
 * Italic is this system's mark for text that is not content the person entered:
 * the placeholder inside a field is italic for the same reason.
 */
const errorText = tv({
  base: 'text-sm font-normal italic text-content-danger data-disabled:opacity-40',
})

export interface FieldProps
  extends Omit<
    ComponentPropsWithRef<typeof FieldPrimitive.Root>,
    'className' | 'render' | 'children' | 'validate' | 'validationMode' | 'validationDebounceTime'
  > {
  /**
   * The control this labels — an `Input`, an `InputGroup`, or a group of
   * Checkboxes or Radios. Figma's `Type` property, derived from what you pass.
   */
  children: ReactNode
  /** The visible label. Figma's `Label Text`. */
  label: ReactNode
  /** Secondary line under the label. Figma's `Sub Label`, off unless given. */
  description?: ReactNode
  /**
   * Figma's `Validation Message`. Providing one puts the field in the invalid
   * state on its own — a danger-red message beside a neutral border would read
   * as a bug — so `invalid` is only needed to color the control without saying
   * anything.
   */
  error?: ReactNode
  /** Maps to the control's `State=Invalid`. Also sets `aria-invalid` on it. */
  invalid?: boolean
  /**
   * Whether the label is a real `<label>`. Leave it alone for anything built on
   * an `<input>`; set it **false** when the control is a button, which is what
   * `Select`, and later Combobox and Autocomplete, put inside a Field.
   *
   * A `<button>` is a labelable element, so `htmlFor` really does reach it — and
   * clicking the label would then fire on the button and open the popup, and
   * hovering the label would put the trigger in its hover state. Base UI ships
   * this switch for exactly that case and names `<Select.Trigger>` in the
   * warning it logs. Turning it off keeps the accessible name (which comes from
   * `aria-labelledby`, not from `htmlFor`) and drops only the click-through.
   */
  nativeLabel?: boolean
  /** Extra classes for the outermost element. */
  className?: string
}

export function Field({
  children,
  label,
  description,
  error,
  invalid = false,
  nativeLabel = true,
  disabled = false,
  className,
  ...props
}: FieldProps) {
  const isInvalid = invalid || Boolean(error)

  return (
    <FieldPrimitive.Root
      disabled={disabled}
      // `invalid` on Field.Root is Base UI's documented path for a field whose
      // validity is decided outside it. It is what puts `aria-invalid` on the
      // control and `data-invalid` on every part, which is what the control's
      // own border color hangs off.
      invalid={isInvalid}
      // Not decoration. Disabled is a flat opacity-40, which measures about 2:1
      // against the canvas, and axe only exempts disabled text by walking up
      // from it looking for a disabled control or `aria-disabled="true"`. The
      // label gets that exemption free — it is a <label> for a disabled input —
      // but the sub-label and the message are not labels and fail
      // `color-contrast` without this. Slider and Link both carry the same line,
      // and `a11y.test` is 'error' in .storybook, so missing it breaks the build
      // rather than merely looking wrong.
      aria-disabled={disabled || undefined}
      className={cn(field(), className)}
      {...props}
    >
      {/*
        The two hug at gap-0 inside their own box — Figma draws them as a single
        block, 24px of label then 20px of sub-label, with the root's gap-2 below
        it. Without the wrapper the root's gap would push them apart.
      */}
      <span className="flex flex-col">
        {/*
          Both halves have to move together: Base UI logs an error if
          `nativeLabel` is false while a real <label> is still rendered, because
          the two would disagree about whether native label behavior applies.
        */}
        <FieldPrimitive.Label
          nativeLabel={nativeLabel}
          render={nativeLabel ? undefined : <div />}
          className={labelText()}
        >
          {label}
        </FieldPrimitive.Label>
        {description != null && (
          <FieldPrimitive.Description className={descriptionText()}>
            {description}
          </FieldPrimitive.Description>
        )}
      </span>

      {children}

      {error != null && (
        // `match` (i.e. always) rather than a ValidityState key: the message
        // shows because the caller said so, not because the browser found a
        // native constraint violation.
        <FieldPrimitive.Error match className={errorText()}>
          {error}
        </FieldPrimitive.Error>
      )}
    </FieldPrimitive.Root>
  )
}

Field.displayName = 'Field'

/**
 * The raw Base UI parts, for a field that needs a different shape than
 * "label, sub-label, control, message" — a label beside the control rather than
 * above it, or a message that reads native `ValidityState` instead of a string.
 */
Field.Root = FieldPrimitive.Root
Field.Label = FieldPrimitive.Label
Field.Description = FieldPrimitive.Description
Field.Error = FieldPrimitive.Error
Field.Validity = FieldPrimitive.Validity
