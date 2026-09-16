import { useId, useState, type ComponentPropsWithRef } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '../../lib/cn'
import { box, type InputSize } from '../Input/styles'
import { counter as counterStyle, textarea, type TextAreaResize } from './styles'

/**
 * TextArea — more than one line of free text.
 *
 * Mirrors the Figma component set "Text Area" (Yet Another Design System, page
 * `↪ Text Area`): 3 sizes × 5 states, plus a `Counter` switch.
 *
 *     <Field label="Description" description="What should reviewers know?">
 *       <TextArea placeholder="Describe the change…" maxLength={280} />
 *     </Field>
 *
 * **Input's box, one row taller.** The bordered box, its hover, its invalid
 * border, its disabled fade and its focus ring are all `Input`'s `box`, imported
 * rather than copied. Only the control inside is different: a `<textarea>` whose
 * height comes from `rows` rather than from the size, which — as in Astryx —
 * only changes the padding and the type.
 *
 * **Built on Base UI's `Input` with `render={<textarea />}`.** There is no
 * Textarea primitive, but `Input` *is* `Field.Control`, and `Field.Control`
 * checks the element's tag before it treats Enter as a commit — a textarea is
 * the case it is checking for. So this is the second component on that
 * primitive rather than a new one, and it gets a surrounding `Field`'s label,
 * description and error wiring, and `data-invalid`, for free.
 *
 * **The label belongs to `Field`, not here**, as it does for Input. Standalone,
 * a TextArea still needs a name — an `aria-label`.
 *
 * **`maxLength` shows a counter and does not stop typing.** Astryx's rule: the
 * native attribute silently truncates a paste, and a person who pasted three
 * paragraphs into a 280-character field needs to see that they did. Past the
 * limit the counter turns danger, the box takes its invalid border and the
 * textarea reports `aria-invalid`; validation proper still belongs to whatever
 * submits the form.
 *
 * **Not here, on purpose:** Input's `appearance="ghost"` — its record says a
 * borderless field is only safe beside something identifying it, and a textarea
 * has no `InputGroup` to put an icon in. Astryx's `startIcon`, `isLoading`,
 * `status` and `disabledMessage` are left out for the reasons Input's record
 * gives. An auto-growing height (`field-sizing: content`) is parked: neither
 * Astryx nor the file has it.
 */
export interface TextAreaProps
  extends Omit<
    ComponentPropsWithRef<'textarea'>,
    // `className` is re-declared below to point at the box; `children` is what a
    // textarea's markup uses for its value, and `defaultValue` is the prop here.
    // `maxLength` is re-declared so the doc comment can say it is not native.
    'className' | 'children' | 'maxLength' | 'value' | 'defaultValue' | 'onChange'
  > {
  /** Field size. Matches Input's scale: 12/20 type at small, 14/24 above. */
  size?: InputSize
  /**
   * Visible lines of text. Astryx's default of three; the native default is two.
   * Height is `rows`, never `size`.
   */
  rows?: number
  /** Whether the person can pull the field taller. `none` for a fixed-height slot. */
  resize?: TextAreaResize
  /**
   * Shows an `n/max` counter under the text. **Not enforced** — see above. The
   * count is in user-perceived characters, so an emoji or a flag is one.
   */
  maxLength?: number
  /**
   * Maps to Figma's `State=Invalid`, for a TextArea standing on its own. Inside
   * a `Field`, set it there instead — the border follows the Field's validity
   * automatically, and only a Field can carry the message explaining it.
   */
  invalid?: boolean
  /** The value, when controlled. */
  value?: string
  /** The initial value, when uncontrolled. */
  defaultValue?: string
  /** Fires with the new value. Base UI's spelling; the native `onChange` is not forwarded. */
  onValueChange?: ComponentPropsWithRef<typeof InputPrimitive>['onValueChange']
  /** Extra classes for the outermost element — the bordered box. */
  className?: string
}

/**
 * User-perceived characters, Astryx's unit for the counter. `String.length`
 * counts UTF-16 code units, so "🇬🇧" would be 4 and "👨‍👩‍👧" would be 8.
 */
function countGraphemes(text: string): number {
  if (typeof Intl === 'undefined' || !('Segmenter' in Intl)) return [...text].length
  let n = 0
  for (const _ of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) n++
  return n
}

export function TextArea({
  size = 'default',
  rows = 3,
  resize = 'vertical',
  maxLength,
  invalid = false,
  value,
  defaultValue,
  onValueChange,
  className,
  'aria-describedby': ariaDescribedBy,
  id,
  name,
  disabled,
  ...props
}: TextAreaProps) {
  // The counter needs the current value, and in the uncontrolled case nobody
  // else has it — so it is mirrored here, Slider's and DatePicker's arrangement.
  // The mirror is only read when there is a counter to feed.
  const [innerValue, setInnerValue] = useState(defaultValue ?? '')
  const currentValue = value ?? innerValue

  const counterId = useId()
  const hasCounter = maxLength !== undefined
  const count = hasCounter ? countGraphemes(currentValue) : 0
  const over = hasCounter && count > maxLength

  const isInvalid = invalid || over
  // Base UI appends the Field's description and error ids to whatever arrives
  // here, so the counter and the Field's own messages coexist. Only spread it
  // when set — a forwarded `undefined` would delete what Base UI computed.
  const describedBy = [ariaDescribedBy, hasCounter ? counterId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    // The same box as Input, for the same reasons: the ring, the fade and the
    // invalid border are all read off the descendant with `has-`, and padding
    // sits on the control so the whole field is a hit target.
    <div className={cn(box({ size, invalid: isInvalid }), className)}>
      <InputPrimitive
        // Every textarea attribute rides on the render element, where it is
        // typed for a textarea — Base UI's `Input` props are typed for an
        // `<input>`, and `onClick`'s event target is the first thing that
        // disagrees. Base UI merges the element's props over its own, chains
        // the handlers and merges the ref, so nothing is lost on the way.
        render={<textarea rows={rows} {...props} />}
        // Except the three Base UI derives things from: `id` is what a Field's
        // label points its `htmlFor` at, `name` is what the Field registers for
        // the form, and `disabled` is what sets `data-disabled` on every part.
        id={id}
        name={name}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        className={textarea({ size, resize })}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          if (value === undefined) setInnerValue(next)
          onValueChange?.(next, details)
        }}
      />
      {hasCounter && (
        <span
          id={counterId}
          className={counterStyle({ over })}
          // Announcing every keystroke is noise; the limit being crossed is the
          // news. A polite region that only exists while over says exactly that,
          // and going back under falls silent again.
          aria-live={over ? 'polite' : undefined}
        >
          {count}/{maxLength}
        </span>
      )}
    </div>
  )
}

TextArea.displayName = 'TextArea'
