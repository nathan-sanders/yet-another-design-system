import type { ComponentPropsWithRef } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '../../lib/cn'
import { box, control, type InputAppearance, type InputSize } from './styles'

/**
 * Input — a single line of free text.
 *
 * Mirrors the Figma component set "Input" (Yet Another Design System, node
 * 40004050:14183): 3 sizes x 5 states.
 *
 *     <Field label="Email" description="We'll only use it to sign you in">
 *       <Input type="email" placeholder="ada@example.com" />
 *     </Field>
 *
 * **The label belongs to `Field`, not here.** Figma's Field set nests this
 * component with its own `Label` boolean switched off, so a labelled field is a
 * Field wrapping an Input rather than an Input drawing its own text. Standalone
 * it still needs a name — either a Field around it or an `aria-label`.
 *
 * **Thirteenth Base UI component**, and the first built on `Input`. It supplies
 * the native `<input>`, the `data-*` state attributes a surrounding Field feeds
 * it, and the `aria-describedby` wiring back to Field's sub-label and message.
 * All the styling is ours.
 *
 * **Reach for this when the answer is not from a known set** — a name, an email,
 * a URL. If the value has to come from a list, the control is a Select (short
 * list), a Combobox (long list, type to filter) or a Radio / SegmentedControl
 * (few enough to show at once). Autocomplete looks like a Combobox but differs
 * on the one thing that matters: it suggests without constraining, so a value
 * that is not on the list is still allowed.
 *
 * Figma models Hover / Focus / Disabled as a `State` property. In code those are
 * real CSS states rather than props: hover and focus come from the browser, and
 * `disabled` is the native HTML attribute — which the box notices for itself, so
 * a disabled Input fades whether the attribute came from here or from a Field.
 *
 * Addons — an icon in the field, a button at its trailing edge, a row of
 * controls underneath — are `InputGroup`, not a set of props here.
 */
export interface InputProps
  extends Omit<
    ComponentPropsWithRef<typeof InputPrimitive>,
    // `size` is omitted because the native one is a character count, and this
    // one is the Figma property. `render` is omitted the way it is on every
    // component here; `className` is re-declared below to point at the box.
    'className' | 'render' | 'children' | 'size'
  > {
  /** Field size. Matches Button's scale: 24 / 32 / 40px tall. */
  size?: InputSize
  /**
   * `ghost` drops the fill and the stroke until you go near the field — a hover
   * wash, then the full chrome on focus. For a global search entry that should
   * sit quieter than a form field. Not a Figma property yet.
   *
   * Give it something to be found by: a leading icon (use `InputGroup`), a
   * `Field` label, or a placeholder. A ghost field with none of the three is
   * invisible.
   */
  appearance?: InputAppearance
  /**
   * Maps to Figma's `State=Invalid`, for an Input standing on its own. Inside a
   * `Field`, set it there instead — the border follows the Field's validity
   * automatically, and only a Field can carry the message explaining it.
   */
  invalid?: boolean
  /** Extra classes for the outermost element — the bordered box. */
  className?: string
}

export function Input({
  size = 'default',
  appearance = 'default',
  invalid = false,
  className,
  ...props
}: InputProps) {
  return (
    // The box is a wrapper rather than the <input> itself so that Input and
    // InputGroup are the same element with the same recipe, and so the focus
    // ring, the disabled fade and the invalid border can all be read off a
    // descendant with `has-`. It also means padding sits on the control, which
    // is what makes the whole width of the field a hit target.
    <div className={cn(box({ size, appearance, invalid }), className)}>
      <InputPrimitive
        aria-invalid={invalid || undefined}
        className={control({ size })}
        {...props}
      />
    </div>
  )
}

Input.displayName = 'Input'
