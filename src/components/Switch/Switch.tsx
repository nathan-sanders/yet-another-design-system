import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import {
  controlDescription,
  controlLabel,
  controlLabelColumn,
  controlRow,
  controlRowInner,
  type ControlRowVariants,
} from '../Checkbox/styles'

/**
 * Switch — flip a setting on or off, and it takes effect straight away.
 *
 * Mirrors the Figma component set "Switch" (node 40004060:16435):
 * `In Container` (False | True) x `State` (Default | Hover | Focus | Disabled) x
 * `Selected State` (Default | Selected), plus the `Label`, `Sub Label` and
 * `Slot` booleans.
 *
 *     <Switch label="Aeroplane mode" defaultChecked />
 *
 * **Checkbox's immediate twin.** The two look alike in a settings panel and are
 * not interchangeable: a checkbox states an intention that a Save button later
 * commits, a switch *is* the commit. Reach for Checkbox inside a form, and for
 * this when the thing happens the moment you let go.
 *
 * **Tenth Base UI component**, and the first built on `Switch`. Base UI supplies
 * `role="switch"`, `aria-checked`, `aria-labelledby` resolved through the
 * wrapping label, the hidden `<input type="checkbox">` that makes it submit with
 * a form, and the `data-checked` / `data-unchecked` attributes both recipes
 * below hang off. Verified in `node_modules` rather than assumed — Tooltip
 * needed its ARIA patched by hand, Toast and Menu did not, and neither does
 * this. All the styling is ours.
 *
 * **The row is a real `<label>`**, so clicking the text flips the switch. That
 * is Checkbox's and Radio's call, and the opposite of SegmentedControl's: Base
 * UI reaches for the wrapping label through its hidden input when `nativeButton`
 * is false, which is the default and why the prop is not exposed here.
 *
 * The row, the card and the label column are the same shapes Checkbox and Radio
 * draw, and these recipes are **a third deliberate copy rather than a shared
 * module**. Radio's note said a third control was the point to extract them;
 * that was reconsidered here, because Figma keeps the three as separate
 * component sets that can drift apart, and a module spanning three folders would
 * pin them together in code while the file lets them move. **A fourth control is
 * the point to extract it** — at that count the duplication outweighs the drift.
 */

/**
 * The 32x20 track. Figma's Switch frame, and the whole of the control that is
 * not the knob.
 *
 * Focus is the shared ring (src/lib/focus.ts), drawn outside the pill, where it
 * picks up `rounded-full` for free.
 *
 * **Figma's `overflow-clip` is not ported** — the fifth component to leave it
 * off. The knob never reaches the track's edge, so it clips nothing, and the
 * focus ring paints *outside* the track: clipping would slice it away.
 */
const track = tv({
  base: [
    'relative inline-flex shrink-0',
    // h-5 = height/h-5 (20px), w-8 = width/w-8 (32px), rounded-full.
    'h-5 w-8 rounded-full border',
    'cursor-pointer',
    // Off. The Input ramp, not the Action one: this is a form control.
    'bg-input-background border-input-border',
    'hover:border-input-border-hover',
    // On. Figma fills the background and the stroke with the same token, and
    // this also covers hovering an already-on switch: Tailwind orders `data-*`
    // after `hover`, so it wins on equal specificity without a
    // `data-checked:hover:` guard. Measured in the browser, because the two
    // stones are close enough that the wrong one would not look wrong.
    'data-checked:bg-input-selected data-checked:border-input-selected',
    'outline-none',
    'transition-colors duration-fast-min ease-standard',
    // Inside a Field, validity arrives here as `data-invalid` rather than as the
    // prop below: Base UI's `fieldValidityMapping` puts it on this element when
    // the surrounding Field is invalid. The two compose — either lights the
    // border — so the prop stays as the standalone path Figma draws. The `hover`
    // copy is spelled out because both selectors otherwise land on equal
    // specificity, leaving the winner to the order Tailwind happens to emit.
    'data-invalid:border-feedback-danger-highlight',
    'data-invalid:hover:border-feedback-danger-highlight',
  ],

  variants: {
    /**
     * Who draws the focus ring. Standalone it is the track; inside a card it is
     * the card, because the track is a descendant of it and two concentric rings
     * on one control read as a mistake rather than as emphasis.
     */
    inContainer: {
      false: focusRing,
      true: '',
    },

    /**
     * **Not a Figma state.** Figma's Switch `State` axis is Default | Hover |
     * Focus | Disabled — it has no Invalid, where Checkbox's and Radio's do.
     * This is here so the three form controls carry the same prop, and wants
     * adding to the file: the same build-then-sync-back direction as Divider's
     * `emphasis` and SegmentedControl's `layout`.
     *
     * A Switch can also take its validity from a surrounding `Field`, through
     * the `data-invalid:` rules in the base list above — though Figma's Field
     * does not list Switch among the controls it wraps, so that is a composition
     * the code allows rather than one the file asks for.
     */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { invalid: false, inContainer: false },
})

/**
 * The knob, and the one genuinely surprising thing in this component:
 * **it grows as it slides.** Figma draws it 14px in Input/Border when off and
 * 16px in Input/Selected Foreground when on, so the insets are 2px at rest and
 * 1px once flipped. That is the file, not a rounding error, and it is built as
 * drawn.
 *
 * It is positioned from **one** origin — `left: 2px` in both states, with the
 * travel done by `translate` — because `left` in one state and `right` in the
 * other are different properties and the browser cannot transition between
 * them. The switch would jump.
 *
 * `top-1/2 -translate-y-1/2` then recenters the knob for free as it grows,
 * which is what lands Figma's 2px and 1px vertical insets without either number
 * being written down.
 */
const thumb = tv({
  base: [
    'absolute top-1/2 left-0.5 -translate-y-1/2 rounded-full',
    // size-3.5 = width/w-3,5 (14px).
    'size-3.5 bg-input-border',
    // size-4 = width/w-4 (16px). The travel: a 30px padding box, less the 1px
    // right inset, less the 16px knob, less the 2px the knob starts at, is 11.
    'data-checked:translate-x-[11px] data-checked:size-4',
    'data-checked:bg-input-selected-foreground',
    // Everything that moves, at the shortest motion token. The knob travels
    // 11px; anything longer reads as lag on a control this small.
    'transition-[translate,width,height,background-color] duration-fast-min ease-standard',
  ],
})

/**
 * The row, the card and the label column are the shared control shapes in
 * `Checkbox/styles.ts`, extracted on 2026-09-20 once Questionnaire made a
 * fourth copy. Only the track and the knob are Switch's own.
 */

export interface SwitchProps
  extends Omit<
    ComponentPropsWithRef<typeof SwitchPrimitive.Root>,
    'className' | 'render' | 'children' | 'nativeButton'
  > {
  /** The visible label. Figma's `Label` boolean plus its `Label Text`. */
  label?: ReactNode
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  /** Draws the card around the row. Maps to Figma's `In Container`. */
  inContainer?: boolean
  /** Not a Figma state; matches Checkbox and Radio. Also sets `aria-invalid`. */
  invalid?: boolean
  /** Figma's `Slot` — extra content below the row. Container form only. */
  children?: ReactNode
  /** Extra classes for the outermost element. */
  className?: string
}

export function Switch({
  label,
  description,
  inContainer = false,
  invalid = false,
  disabled,
  children,
  className,
  ...props
}: SwitchProps) {
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`

  const control = (
    <>
      <SwitchPrimitive.Root
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={track({ invalid, inContainer })}
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
        <SwitchPrimitive.Thumb className={thumb()} />
      </SwitchPrimitive.Root>

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
    </>
  )

  const state: ControlRowVariants = { inContainer, disabled: Boolean(disabled), invalid }

  if (!inContainer) {
    return <label className={cn(controlRow(state), className)}>{control}</label>
  }

  return (
    <label className={cn(controlRow(state), className)}>
      <span className={controlRowInner}>{control}</span>
      {children}
    </label>
  )
}

Switch.displayName = 'Switch'

/**
 * The raw Base UI parts, for a switch that needs a different shape than
 * "track, label, sub-label" — a custom knob, say, or a root that is not wrapped
 * in a label because something else already names it.
 */
Switch.Root = SwitchPrimitive.Root
Switch.Thumb = SwitchPrimitive.Thumb
