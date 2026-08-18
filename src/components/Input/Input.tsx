import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { FieldShell } from './FieldShell'
import { control, type InputSize } from './styles'

/**
 * Input — a single line of free text.
 *
 * Mirrors the Figma component set "Input" (Yet Another Design System, node
 * 40004050:14183): 3 sizes x 5 states, each drawn as a label, a sub-label and a
 * bordered box.
 *
 *     <Input label="Email" description="We'll never share it" placeholder="you@example.com" />
 *
 * **Twelfth Base UI component**, and the first built on `Input` and `Field`.
 * Base UI supplies the native `<input>`, and Field supplies the wiring that
 * makes the label and sub-label actually reach a screen reader — see
 * `FieldShell`. All the styling is ours.
 *
 * **Reach for this when the answer is not from a known set** — a name, an email,
 * a URL. If the value has to come from a list, the control is a Select (short
 * list), a Combobox (long list, type to filter) or a Radio / SegmentedControl
 * (few enough to show at once). Autocomplete looks like a Combobox but differs
 * on the one thing that matters: it suggests without constraining, so a value
 * that is not on the list is still allowed.
 *
 * Figma models Hover / Focus / Disabled as a `State` property. In code those are
 * real CSS states rather than props, so there is no `state` prop: hover and
 * focus come from the browser, and `disabled` is the native HTML attribute.
 * `Invalid` is the one member of that axis that is not a browser state, so it
 * stays a prop.
 *
 * Addons — an icon in the field, a button at its trailing edge, a row of
 * controls underneath — are `InputGroup`, not a set of props here.
 */
export interface InputProps
  extends Omit<
    ComponentPropsWithRef<typeof InputPrimitive>,
    // `size` is omitted because the native one is a character count, and this
    // one is the Figma property. `render` is omitted the way it is on every
    // component here; `className` is re-declared below to point at the root.
    'className' | 'render' | 'children' | 'size'
  > {
  /** The visible label. Figma's `Label` boolean plus its `Label Text`. */
  label?: ReactNode
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  /**
   * A message shown below the field, in danger red. Providing one puts the field
   * in the invalid state on its own — a red message beside a neutral border
   * would read as a bug — so `invalid` is only needed to colour the border
   * without saying anything.
   */
  error?: ReactNode
  /** Maps to Figma's `State=Invalid`. Also sets `aria-invalid`. */
  invalid?: boolean
  /** Field size. Matches Button's scale: 24 / 32 / 40px tall. */
  size?: InputSize
  /** Extra classes for the outermost element. */
  className?: string
}

export function Input({
  label,
  description,
  error,
  invalid = false,
  size = 'default',
  disabled,
  className,
  ...props
}: InputProps) {
  return (
    <FieldShell
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      size={size}
      className={className}
    >
      <InputPrimitive disabled={disabled} className={control({ size })} {...props} />
    </FieldShell>
  )
}

Input.displayName = 'Input'
