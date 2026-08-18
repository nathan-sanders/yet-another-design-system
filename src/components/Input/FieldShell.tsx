import type { ReactNode } from 'react'
import { Field } from '@base-ui/react/field'

import { cn } from '../../lib/cn'
import { box, descriptionText, errorText, field, labelText, type InputSize } from './styles'

/**
 * The label block, the bordered box and the error message — everything an
 * `Input` and an `InputGroup` have in common, which is everything except what
 * goes inside the box.
 *
 * It exists as one component rather than as JSX copied into both files because
 * of the `aria-disabled` line below: that is a mistake this repo has already
 * made twice, it fails the build rather than showing up visually, and it is
 * exactly the kind of thing that gets fixed in one copy and not the other.
 * Internal — not exported from the package.
 *
 * **Base UI's Field does the wiring.** `Field.Label` gets `htmlFor` pointed at
 * the control automatically, and `Field.Description` and `Field.Error` are both
 * folded into its `aria-describedby`. That is why there is no `useId` here, and
 * why this is a much shorter file than Tooltip, which had to patch its own ARIA
 * by hand. Verified in `node_modules`, not assumed.
 *
 * Field's own `validate` / `validationMode` / `validationDebounceTime` are
 * deliberately not surfaced. This is a presentational field; deciding *when* a
 * value is wrong belongs to a Form component that does not exist yet.
 */
export interface FieldShellProps {
  label?: ReactNode
  description?: ReactNode
  error?: ReactNode
  invalid?: boolean
  disabled?: boolean
  size?: InputSize
  className?: string
  /** The contents of the bordered box. */
  children: ReactNode
}

export function FieldShell({
  label,
  description,
  error,
  invalid = false,
  disabled = false,
  size = 'default',
  className,
  children,
}: FieldShellProps) {
  // A danger-red message beside a neutral border would read as a bug, so an
  // error puts the field in the invalid state on its own.
  const isInvalid = invalid || Boolean(error)

  return (
    <Field.Root
      disabled={disabled}
      // `invalid` on Field.Root exists for exactly this: "useful when the field
      // state is controlled by an external library". It is what puts
      // `aria-invalid` on the control and `data-invalid` on the parts.
      invalid={isInvalid}
      // Not decoration. Disabled is a flat opacity-40, which measures about 2:1
      // against the canvas, and axe only exempts disabled text by walking up
      // from it looking for a disabled control or `aria-disabled="true"`. The
      // label gets that exemption free — it is a <label> for a disabled input —
      // but the description and the error message are not labels and fail
      // `color-contrast` without this. Slider and Link both carry the same line
      // for the same reason, and `a11y.test` is 'error' in .storybook, so
      // missing it breaks the build rather than merely looking wrong.
      aria-disabled={disabled || undefined}
      className={cn(field({ disabled }), className)}
    >
      {(label != null || description != null) && (
        // The two hug at gap-0 inside their own box — Figma draws them as a
        // single 44px block (24 + 20) with the root's gap-2 below it.
        <span className="flex flex-col">
          {label != null && <Field.Label className={labelText()}>{label}</Field.Label>}
          {description != null && (
            <Field.Description className={descriptionText()}>{description}</Field.Description>
          )}
        </span>
      )}

      <div className={box({ size, invalid: isInvalid })}>{children}</div>

      {error != null && (
        // `match` (i.e. always) rather than a ValidityState key: the message
        // shows because the caller said so, not because the browser found a
        // native constraint violation.
        <Field.Error match className={errorText()}>
          {error}
        </Field.Error>
      )}
    </Field.Root>
  )
}

FieldShell.displayName = 'FieldShell'
