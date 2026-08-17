import { useMemo } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRingWithin } from '../../lib/focus'
import { Tooltip } from '../Tooltip'

/**
 * Slider — drag a handle along a track to pick a number, or a pair of them to
 * pick a range.
 *
 * Mirrors the Figma component set "Slider" (node `40004155:14437`): `Type`
 * Default | Range x `State` Default | Disabled, plus the `Label`, `Sub Label`,
 * `Min Value`, `Max Value`, `Marks` and `Max Number Input` booleans. Built from
 * two private sub-components, `_Slider Track` (`40004155:14415`, `Type` Filled |
 * Empty) and `_Slider Handle` (`40004155:14467`, `State` Default | Hover | Focus).
 *
 *     <Slider label="Volume" defaultValue={40} />
 *     <Slider label="Price range" defaultValue={[20, 80]} />
 *
 * **Eleventh Base UI component**, on `Slider`. Base UI supplies all of the
 * behaviour: a `<input type="range">` per thumb (so it submits with a form and
 * announces as a slider), pointer dragging, track presses, arrow keys, Shift and
 * Page Up/Down for the large step, Home/End, and the thumb-collision rules for a
 * range. All the styling is ours.
 *
 * **Reach for it when the number is approximate** — volume, opacity, a price
 * filter. Astryx says outright not to use a slider for precise numeric entry, and
 * this one deliberately does not try: pair it with a number input when the exact
 * figure matters.
 *
 * **`range` is derived, not a prop.** Pass an array to `value` or `defaultValue`
 * and you get that many thumbs; Figma's `Type` axis follows from what you pass.
 * The same move as Avatar's `Content`, Button's icon-only and Banner's
 * `onDismiss`.
 *
 * **Left out, for now.** Figma draws a 56x32 number input at the trailing edge
 * (two of them for `Type=Range`, one at each end), an instance of an **Input**
 * component that lives elsewhere in the file and is not built here yet. Inventing
 * input styling inside Slider would put a second source of truth in the library
 * days before the real one lands, so it waits for that PR — as **Field**,
 * **Checkbox Group** and **Radio Group** already do. The current value is not
 * homeless in the meantime: it is in the handle's tooltip, and `Slider.Value` is
 * attached for a caller who wants a readout.
 *
 * Also left out: `orientation="vertical"`. Base UI has it and so does Astryx, but
 * Figma draws no vertical variant, so it is omitted from the props rather than
 * left to break quietly — Tabs' call.
 */

/**
 * The outer wrapper: a column holding the label block and the row, `gap-2` apart.
 *
 * **Both of this component's gaps-in-the-file have since been closed**, which is
 * worth recording because the direction was the unusual one — code first, file
 * second, as with SegmentedControl's `large`. The label started as Astryx's
 * addition against a Figma component that was only the row, and disabled started
 * as the library's `opacity-40` idiom against a handle set that had no disabled
 * state. Figma now draws both, and drew them the same way: the label is
 * `text-base` in `Content/Primary` 8px above the row, and `State=Disabled` is
 * `opacity/opacity-40` over the whole thing. So these classes are the file's now,
 * not ours — verified against `Type=Default, State=Disabled` (`40004157:15861`).
 *
 * Note where disabled is expressed: on the **Slider**, as a `State` axis, and
 * *not* on `_Slider Handle`, which still has only Default | Hover | Focus. One
 * fade over the whole component rather than a disabled token per part, which is
 * why the `aria-disabled` on the root below is still load-bearing.
 */
const root = tv({
  base: 'flex w-full flex-col gap-2 font-sans',

  variants: {
    disabled: {
      true: 'pointer-events-none opacity-40',
      false: '',
    },

    /**
     * Room for the marks' labels, which are positioned rather than laid out and
     * would otherwise hang out of the bottom of the component.
     *
     * A label sits 4px under the track and is 20px tall (`text-sm`'s
     * line-height), so it needs 24px below the track's bottom edge; a 4px track
     * centred in the 32px row leaves 14. Hence 10.
     *
     * **It goes here rather than on the row**, which was tried first and is
     * wrong: padding on the row shrinks the box `items-center` centres the
     * control in, so the track rides 4px higher and the labels still overflow —
     * measured at exactly 4px over. On the root it reserves the space without
     * touching the row's geometry, so a slider with marks and one without put
     * their tracks in the same place.
     */
    markLabels: {
      true: 'pb-2.5',
      false: '',
    },
  },

  defaultVariants: { disabled: false, markLabels: false },
})

/**
 * The row: bounds label, control, bounds label. `min-h-8` and `gap-2` are
 * Figma's, and the 8px gap turns out to be load-bearing — see `thumb` below.
 */
const row = tv({
  base: 'flex min-h-8 items-center gap-2',
})

/**
 * The interactive region, and **the hit area** — which is the one place this
 * diverges from the canvas on purpose. Figma draws a 24px frame around the
 * handle, because on a canvas that is the only place a target can live. In the
 * browser Base UI listens for pointer events on `Slider.Control`, so the height
 * belongs here (`h-6`, Figma's 24) with the 4px track centred inside it. A
 * control the height of its track would be a 4px target.
 */
const control = tv({
  base: 'relative flex h-6 min-w-px flex-1 cursor-pointer items-center select-none',
})

/**
 * The unfilled track: `height/h-1` (4px), `rounded-full`, `Surface/Border`.
 *
 * `relative z-10` is load-bearing rather than decorative. The marks are
 * absolutely positioned siblings, and an absolutely positioned element paints
 * over a statically positioned one whatever the DOM order — so without this the
 * ticks would sit on top of the track instead of behind it, which is not what
 * Figma draws.
 *
 * **Not clipped.** `overflow-clip` would be the sixth time Figma's version was
 * not ported, and here it would take the thumb and its focus ring with it.
 */
const track = tv({
  base: 'relative z-10 h-1 w-full rounded-full bg-surface-border',
})

/** The filled part, from `min` to the value. Figma's `Type=Filled` track. */
const indicator = tv({
  base: 'h-full rounded-full bg-input-selected',
})

/**
 * The handle, and the one genuinely surprising thing in this component: **it
 * grows as you touch it, 16px to 20px.** Figma draws the disc at `width/w-4` at
 * rest and `width/w-5` in both its Hover and Focus states. Switch's knob does
 * the same thing (14 to 16), so this is the second component where the file says
 * so, and it is built as drawn. Dragging is included because a dragged handle is
 * a hovered one everywhere except on a touchscreen.
 *
 * **Focus is `focusRingWithin`, not `focusRing`.** `Slider.Thumb` renders a div
 * with a visually hidden `<input type="range">` inside it, so focus lands on a
 * *descendant* and `focus-visible:` on the thumb never fires. `has-focus-visible:`
 * does, and that is exactly what `focusRingWithin` already is — written for the
 * card around a Checkbox, and the same shape of problem here. Base UI's own docs
 * reach for `has-[:focus-visible]` for this. No new focus idiom, which is the
 * whole point of that module.
 *
 * Per-thumb focus has to come from `:focus-visible` rather than from Base UI's
 * `data-focused`: that attribute is the *root's* state, so on a range slider both
 * handles would light up at once.
 *
 * **Only the size transitions.** Base UI drives the thumb's inset and the
 * indicator's width straight from the pointer, so animating either puts the
 * handle on elastic behind the cursor — and there is no way to animate a keyboard
 * step without also animating the drag. Switch's "11px of travel reads as lag" is
 * the same instinct at the other end.
 *
 * **The overhang, and why `thumbAlignment` is not Base UI's default.** Figma draws
 * the handle centred on the end of the filled track, which is `center` — and at
 * `min` that hangs half a handle past the control. Measured: a resting 16px disc
 * overhangs by 8px, which is exactly the row's `gap-2` and is presumably why
 * Figma's gap is 8. But the disc grows to 20px the moment you touch it, and then
 * the focus ring adds 5px more, so a focused handle at `min` **painted 7px over
 * the bounds label** — measured, not guessed.
 *
 * So it is `edge`, which insets the handle to sit fully inside the control at both
 * ends. The ring then lands in the gap with 3px to spare. Figma cannot settle this
 * one, because it draws the handle's focus state in isolation and never on a
 * composed slider; the canvas has no opinion about a collision it does not draw.
 * Nothing is given up visually — at `min` the indicator's 8px stub sits entirely
 * underneath the handle.
 */
const thumb = tv({
  base: [
    'size-4 rounded-full bg-input-selected select-none',
    'hover:size-5 data-dragging:size-5 has-focus-visible:size-5',
    ...focusRingWithin,
    'transition-[width,height] duration-fast-min ease-standard',
  ],
})

/**
 * A bounds label — Figma's `minValueText` / `maxValueText`.
 *
 * **In `font-mono`, which is the file's choice and not a mistake.** Figma binds
 * `font/font-mono` here, and the slashed zero is visible in the render. It is the
 * right call for a number that changes width as it counts: a monospaced digit
 * keeps the track from shifting as the label grows.
 */
const bound = tv({
  base: 'shrink-0 font-mono text-base font-normal text-content-primary',
})

/** A tick's label, under the track. Mono again, one step down, and subtler. */
const markLabel = tv({
  base: 'absolute top-1/2 mt-1.5 w-6 -translate-x-1/2 text-center font-mono text-sm font-normal text-content-subtle',
})

/**
 * A tick. 2x8, `rounded-full`, `Surface/Border` — the same token as the unfilled
 * track, because it is drawn *behind* it: the Marks frame is z-1 under Figma's
 * filled (z-3) and empty (z-2) segments, so all you actually see of a tick is the
 * 2px that pokes out above and below the track.
 */
const markTick = tv({
  base: 'absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-border',
})

/** A tick, optionally labelled. A bare number labels itself with its value. */
export type SliderMark = number | { value: number; label?: ReactNode }

type SliderRootProps = ComponentPropsWithRef<typeof SliderPrimitive.Root>

interface SliderBaseProps
  extends Omit<SliderRootProps, 'className' | 'render' | 'children' | 'orientation'> {
  /**
   * A second line under the label, at `text-sm` in Content/Subtle. Figma's
   * `Sub Label`, and named `description` to match Checkbox, Radio and Switch.
   * Needs a `label` — on its own it would be an unnamed slider with a sentence.
   */
  description?: ReactNode
  /**
   * The bounds labels, in mono either side of the track. Figma's `minValue` and
   * `maxValue` collapse to one knob: showing one bound without the other is not
   * a real case.
   */
  bounds?: boolean
  /** Overrides the leading bounds label. Figma's `minValueText`. */
  minLabel?: ReactNode
  /** Overrides the trailing bounds label. Figma's `maxValueText`. */
  maxLabel?: ReactNode
  /**
   * Ticks along the track. Figma's `marks` boolean draws five of them; this is
   * explicit, as in Astryx, so they need not be evenly spaced. A bare number
   * gets its own formatted value as a label — which is what Figma draws — and an
   * object without a `label` is a tick on its own.
   */
  marks?: readonly SliderMark[]
  /**
   * The value in a tooltip above the handle. On by default because Figma's only
   * hover state includes it.
   */
  valueTooltip?: boolean
  /**
   * Names each handle of a range, one string per value. Left off, Base UI's own
   * `aria-valuetext` already says "start range" and "end range".
   */
  thumbLabels?: readonly string[]
  /** Extra classes for the outermost element. */
  className?: string
}

/**
 * A slider cannot compile without a name. Either the visible `label`, or an
 * `aria-label` that is forwarded to the handles — Base UI hoists it onto the
 * hidden input, which is the element that actually announces. Astryx's first
 * rule for this component is "always provide a label, even if visually hidden",
 * and Button's icon-only union is the precedent for enforcing that in the types.
 */
export type SliderProps = SliderBaseProps &
  (
    | {
        label: ReactNode
        'aria-label'?: string
      }
    | {
        label?: never
        /** Required: with no visible label, nothing else names the control. */
        'aria-label': string
      }
  )

export function Slider({
  label,
  description,
  bounds = true,
  minLabel,
  maxLabel,
  marks,
  valueTooltip = true,
  thumbLabels,
  className,
  'aria-label': ariaLabel,
  min = 0,
  max = 100,
  format,
  locale,
  disabled = false,
  ...props
}: SliderProps) {
  // One formatter for the bounds and the tick labels, built from the same
  // `format` and `locale` Base UI uses for the value itself, so a slider that
  // reads "60%" is not bounded by a bare "100".
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale as Parameters<typeof Intl.NumberFormat>[0], format),
    [locale, format],
  )

  // How many handles to draw. Figma's `Type` axis, derived from the value's
  // shape rather than asked for as a prop.
  const values = props.value ?? props.defaultValue
  const thumbCount = Array.isArray(values) ? values.length : 1

  const resolvedMarks = useMemo(
    () =>
      (marks ?? []).map((mark) =>
        typeof mark === 'number'
          ? { value: mark, label: formatter.format(mark) as ReactNode }
          : mark,
      ),
    [marks, formatter],
  )

  const hasMarkLabels = resolvedMarks.some((mark) => mark.label != null)

  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      format={format}
      locale={locale}
      disabled={disabled}
      // Base UI puts the native `disabled` attribute on each hidden range input,
      // which is what actually disables the control — this states the same thing
      // on the group, and it is load-bearing for a11y testing rather than
      // decorative.
      //
      // `disabled` fades the row to `opacity-40`, which drops the bounds labels
      // to a 2.33:1 contrast ratio. WCAG 1.4.3 exempts inactive components, and
      // axe implements that exemption by walking up from the text looking for a
      // disabled control or `aria-disabled="true"` — so Checkbox, Radio and
      // Switch get it for free, because their whole row is a `<label>` for a
      // disabled input. A bounds label is a plain `<span>` in a `<div>`, so
      // without this the story suite fails on `color-contrast`. Valid here
      // because `Slider.Root` renders `role="group"`, which supports the state.
      aria-disabled={disabled || undefined}
      // Not Base UI's default `center`. See the `thumb` recipe above: centred, a
      // focused handle at min or max paints over the bounds label.
      thumbAlignment="edge"
      className={cn(root({ disabled, markLabels: hasMarkLabels }), className)}
      {...props}
    >
      {label != null && (
        // Figma's `Label` frame, which stacks the label and its sub-label with no
        // gap between them (`spacing/0`) — 24px of line-height then 20.
        //
        // **The sub-label is inside the label, so it is part of the accessible
        // name rather than a description**, which is what Figma's structure says
        // and what Checkbox, Radio and Switch already do with their own
        // `description`. It is also the only option left: `aria-describedby` on a
        // thumb is already spoken for by the value tooltip, and a second source
        // would overwrite the first.
        //
        // Figma's `overflow-clip` on this frame is not ported — the seventh time,
        // and here it would clip nothing but could clip a descender.
        <SliderPrimitive.Label className="flex w-full flex-col">
          <span className="text-base font-normal text-content-primary">{label}</span>
          {description != null && (
            <span className="text-sm font-normal text-content-subtle">{description}</span>
          )}
        </SliderPrimitive.Label>
      )}

      <div className={row()}>
        {bounds && <span className={bound()}>{minLabel ?? formatter.format(min)}</span>}

        <SliderPrimitive.Control className={control()}>
          {resolvedMarks.length > 0 && (
            // Decoration: every tick's value is already in the input's
            // aria-valuemin/max and its aria-valuetext, so announcing the scale
            // a second time would only be noise.
            //
            // **`inset-x-2` is the handle's radius, and it is not optional.**
            // `thumbAlignment="edge"` makes a handle travel between the two
            // points 8px in from the control's edges rather than across its whole
            // width, so ticks laid out across the full width drift from the
            // handle by up to 8px at the ends — a tick at `max` would sit past
            // the handle that is sitting on `max`. Insetting the layer by the
            // same 8px puts every tick exactly where its value's handle lands,
            // and the indicator agrees too, because it also ends at the handle's
            // centre.
            //
            // This was derived here by measuring, and **Figma has since been
            // updated to agree**: the Marks frame is now `left: 8px; right: 8px`
            // where it used to be flush. Same build-then-sync-back direction as
            // the label and the disabled state above.
            <div className="pointer-events-none absolute inset-x-2 top-1/2 z-0" aria-hidden>
              {resolvedMarks.map((mark) => {
                const percent = ((mark.value - min) / (max - min)) * 100
                if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
                  return null
                }
                return (
                  <span key={mark.value} style={{ left: `${percent}%` }} className="absolute">
                    <span className={markTick()} />
                    {mark.label != null && <span className={markLabel()}>{mark.label}</span>}
                  </span>
                )
              })}
            </div>
          )}

          <SliderPrimitive.Track className={track()}>
            <SliderPrimitive.Indicator className={indicator()} />

            {Array.from({ length: thumbCount }, (_unused, index) => {
              const thumbElement = (
                <SliderPrimitive.Thumb
                  key={index}
                  index={index}
                  // Base UI points a thumb's hidden input at the `Slider.Label`
                  // through `aria-labelledby`, but only when there is one — so
                  // with no visible label, `aria-label` has to reach every thumb,
                  // not just a lone one. A range would otherwise end up with two
                  // unnamed inputs, and `thumbLabels` being optional means the
                  // types could not catch it. Both handles then share the group's
                  // name and are told apart by `aria-valuetext` ("20 start
                  // range"), which is the floor; `thumbLabels` is the finish.
                  aria-label={thumbLabels?.[index] ?? (label == null ? ariaLabel : undefined)}
                  className={thumb()}
                />
              )

              if (!valueTooltip) {
                return thumbElement
              }

              // `Slider.Value` reads the live value out of the slider's context,
              // which reaches the popup through the portal, so the tooltip needs
              // no state of its own. Base UI already sets `aria-live="off"` on
              // it — it would otherwise announce every frame of a drag.
              //
              // The wrapping works because Tooltip hands `children` to Base UI's
              // `render`, so the thumb's own element becomes the trigger
              // (SegmentedControl's segments do this too). And the trigger's
              // `aria-describedby` reaches the right element for free: `Thumb`
              // hoists that attribute onto its hidden input, which is the thing
              // that takes focus.
              return (
                <Tooltip
                  key={index}
                  // Figma puts the tooltip 8px above the disc, not Tooltip's own
                  // default 4. It will cover the label while you drag, which no
                  // amount of offset avoids and every value tooltip does: Base UI
                  // only flips at the viewport edge, not off a sibling.
                  sideOffset={8}
                  label={
                    <SliderPrimitive.Value>
                      {(formattedValues) => formattedValues[index]}
                    </SliderPrimitive.Value>
                  }
                >
                  {thumbElement}
                </Tooltip>
              )
            })}
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>

        {bounds && <span className={bound()}>{maxLabel ?? formatter.format(max)}</span>}
      </div>
    </SliderPrimitive.Root>
  )
}

Slider.displayName = 'Slider'

/**
 * The raw Base UI parts, for a slider that needs a different shape than "label,
 * bounds, track, handles" — a value readout in the corner, say, or a vertical
 * one, or the number input this component leaves out until Input exists.
 */
Slider.Root = SliderPrimitive.Root
Slider.Label = SliderPrimitive.Label
Slider.Value = SliderPrimitive.Value
Slider.Control = SliderPrimitive.Control
Slider.Track = SliderPrimitive.Track
Slider.Indicator = SliderPrimitive.Indicator
Slider.Thumb = SliderPrimitive.Thumb
