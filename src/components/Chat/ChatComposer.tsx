import {
  useState,
  type ComponentPropsWithRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { ArrowUp, Square } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { box } from '../Input/styles'
import { Tooltip } from '../Tooltip'
import { composerActions, composerTextarea, type ChatComposerSize } from './styles'

/**
 * ChatComposer — where a message is written and sent.
 *
 * Mirrors the Figma component set "Chat Composer" (`40005219:44119`): `Size`
 * Default | Small × `Type` Send | Stop. A raised box with a growing text
 * field above a row of actions, the send button last.
 *
 *     <ChatComposer
 *       aria-label="Message"
 *       placeholder="How can I help today?"
 *       onSubmit={send}
 *       streaming={isReplying}
 *       onStop={cancel}
 *       actions={<Button appearance="ghost" startIcon={Plus} aria-label="Attach" />}
 *       endActions={<ModelPicker />}
 *     />
 *
 * **Input's box, stacked.** The border, its hover, the disabled fade and the
 * corner radius are `box` from `Input/styles.ts` — TextArea's, NumberInput's
 * and Autocomplete's arrangement — turned from a wrapping row into a column
 * and given Figma's `shadow-medium`. The field is Base UI's `Input` with a
 * `<textarea>` through `render`, exactly as `TextArea` does it. What differs
 * is the ring: the box holds a send button and a row of actions, so
 * `focusRingWithin` would ring it for every one of them, and it takes the new
 * `ring="textarea"` instead — NumberInput's reason, at a different tag.
 *
 * **Enter sends, Shift+Enter breaks the line.** Astryx's contract and every
 * chat app's; a composer that needs a click to send is a form. Enter with any
 * other modifier, or mid-composition in an IME, is left to the browser. Base
 * UI only intercepts Enter on an `<input>` tag, so nothing fights this.
 *
 * **Figma's `Type` axis is derived.** `streaming` swaps the send button for a
 * stop button while a reply is arriving — the one moment sending is not the
 * thing to do — and holds Enter back at the same time.
 *
 * **The send button is `aria-disabled`, never `disabled`.** `box` fades and
 * freezes on any `:disabled` descendant, so a natively disabled send button
 * would grey the whole composer every time the field was empty. Aria keeps
 * it in the tab order, which is also the shape WAI-ARIA prefers for "not
 * yet". The same rule reaches anything a caller puts in `actions`.
 *
 * **It grows.** `field-sizing: content` takes the field from one line to
 * eight and then scrolls — TextArea parked this as "one utility class the
 * day a design wants it", and a composer is that design. Firefox does not
 * have it yet and keeps to `rows`.
 *
 * **Both sizes are 14/24.** Figma binds `text/base/line-height` in all four
 * variants; the small composer tightens its chrome and keeps its type, unlike
 * Input's small. The record has the arithmetic.
 */
export interface ChatComposerProps
  extends Omit<ComponentPropsWithRef<'form'>, 'onSubmit' | 'children' | 'className'> {
  /**
   * Names the field. Required — there is no `Field` here to supply one, and a
   * placeholder is not a name.
   */
  'aria-label': string
  /** The text, when controlled. */
  value?: string
  /** The starting text, when uncontrolled. */
  defaultValue?: string
  /** Fires with the new text on every change. */
  onValueChange?: (value: string) => void
  /** Fires with the text on Enter or the send button. Never with blank text. */
  onSubmit?: (value: string) => void
  /** Fires when the stop button is pressed. Only shown while `streaming`. */
  onStop?: () => void
  /** A reply is arriving: the send button becomes a stop button. Figma's `Type=Stop`. */
  streaming?: boolean
  /** Turns the whole composer off. */
  disabled?: boolean
  /** Shown while the field is empty. Set in italics, as every placeholder here is. */
  placeholder?: string
  /** Figma's `Size`: 96px at default, 72 at small, with one line of text. */
  size?: ChatComposerSize
  /** Lines shown before anything is typed. The field grows from here. */
  rows?: number
  /** The start of the action row — attach, mention. Ghost icon buttons, sized to match. */
  actions?: ReactNode
  /** The end of the action row, before the send button — a model picker, dictation. */
  endActions?: ReactNode
  /** Passed to the field. */
  id?: string
  /** Passed to the field. */
  name?: string
  /** Passed to the field. */
  autoFocus?: boolean
  /** Extra classes for the outermost element — the box. */
  className?: string
}

export function ChatComposer({
  'aria-label': ariaLabel,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  onStop,
  streaming = false,
  disabled = false,
  placeholder,
  size = 'default',
  rows = 1,
  actions,
  endActions,
  id,
  name,
  autoFocus,
  className,
  ...props
}: ChatComposerProps) {
  // The send button needs to know whether there is anything to send, so the
  // uncontrolled value is mirrored here — TextArea's arrangement for its
  // counter. Unlike TextArea the field is always controlled underneath, so
  // that sending can clear it.
  const [innerValue, setInnerValue] = useState(defaultValue ?? '')
  const currentValue = value ?? innerValue
  const empty = currentValue.trim() === ''

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (streaming || disabled || empty) return
    onSubmit?.(currentValue)
    if (value === undefined) setInnerValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form
      className={cn(
        box({ size, ring: 'textarea' }),
        // The box is a wrapping row for Input's addons; here it is a column.
        'flex-col flex-nowrap items-stretch shadow-medium',
        className,
      )}
      onSubmit={handleSubmit}
      {...props}
    >
      <InputPrimitive
        // Textarea attributes ride on the render element, where they are
        // typed for a textarea; the three Base UI derives things from go
        // through the primitive. TextArea's arrangement, and its reasons.
        render={
          <textarea
            rows={rows}
            placeholder={placeholder}
            aria-label={ariaLabel}
            autoFocus={autoFocus}
            onKeyDown={handleKeyDown}
          />
        }
        id={id}
        name={name}
        disabled={disabled}
        className={composerTextarea({ size })}
        value={currentValue}
        onValueChange={(next) => {
          if (value === undefined) setInnerValue(next)
          onValueChange?.(next)
        }}
      />
      <Tooltip.Provider>
        <div className={composerActions({ size })}>
          {actions}
          <div className="ml-auto flex items-center gap-2">
            {endActions}
            {streaming ? (
              <Button
                type="button"
                appearance="secondary"
                size={size}
                startIcon={Square}
                aria-label="Stop"
                onClick={onStop}
              />
            ) : (
              <Button
                type="submit"
                size={size}
                startIcon={ArrowUp}
                aria-label="Send"
                aria-disabled={empty || undefined}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
              />
            )}
          </div>
        </div>
      </Tooltip.Provider>
    </form>
  )
}

ChatComposer.displayName = 'ChatComposer'
