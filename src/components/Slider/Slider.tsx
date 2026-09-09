import { Fragment, useCallback, useId, useMemo, useState } from 'react'
import type { CSSProperties, ComponentPropsWithRef, ReactNode } from 'react'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '@base-ui/react/internals/createBaseUIEventDetails'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRingWithin } from '../../lib/focus'
import { NumberInput } from '../NumberInput'
import { Tooltip } from '../Tooltip'

/**
 * Slider — drag a handle along a track to pick a number, or a pair of them to
 * pick a range.
 *
 * Mirrors the Figma component set "Slider" (node `40004155:14437`): `Type`
 * Default | Range x `State` Default | Disabled, plus the `Label`, `Sub Label`,
 * `Min Value`, `Max Value`, `Marks`, `Min Number Input` and `Max Number Input`
 * booleans. Built from two private sub-components, `_Slider Track`
 * (`40004155:14415`, `Type` Filled | Empty) and `_Slider Handle`
 * (`40004155:14467`, `State` Default | Hover | Focus).
 *
 *     <Slider label="Volume" defaultValue={40} />
 *     <Slider label="Price range" defaultValue={[20, 80]} />
 *
 * **Eleventh Base UI component**, on `Slider`. Base UI supplies all of the
 * behavior: a `<input type="range">` per thumb (so it submits with a form and
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
 * **The number inputs have landed** — the one thing this component was waiting on
 * when it was built, and the reason the paragraph above stops short of "use an
 * input when the exact figure matters". Figma draws a 56x32 field at the trailing
 * edge, and a second one at the leading edge for `Type=Range`. That field is an
 * instance of the **Input** component, which did not exist when Slider was
 * written; it does now, and so does **NumberInput**, which is Input's own box at
 * exactly that height. So the field here is `NumberInput` with `steppers={false}`
 * — no new chrome, no second source of truth, which is the whole reason the
 * feature waited rather than being invented. See `numberInput` below for the two
 * Figma booleans collapsing to one prop, and what the derived `valueTooltip`
 * default does about the value now appearing twice.
 *
 * **Which makes the component controlled from the inside.** Two controls now
 * write one value, so the value is held here — mirrored uncontrolled state, or
 * the caller's `value` when there is one — and handed to `Slider.Root` as a
 * controlled prop. DatePicker's arrangement, and the reason `onValueChange` needs
 * a Base UI event-details object built by hand for the typed edits; see
 * `commitThumb`.
 *
 * Still left out: `orientation="vertical"`. Base UI has it and so does Astryx, but
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
 * The one later departure is the label's **weight**: semibold here, to match the
 * Field component that now owns every other field label. That is code-first
 * again, and the Slider set wants updating from `font-weight/normal` to match.
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
     * centered in the 32px row leaves 14. Hence 10.
     *
     * **It goes here rather than on the row**, which was tried first and is
     * wrong: padding on the row shrinks the box `items-center` centers the
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
 * belongs here (`h-6`, Figma's 24) with the 4px track centered inside it. A
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

/**
 * The filled part, from `min` to the value. Figma's `Type=Filled` track.
 *
 * **The `max(0px, …)` is a guard against a negative width, and it is not
 * theoretical.** Base UI sizes this by writing `--relative-size` — the gap
 * between two thumb positions — and setting `width` to it inline. Under
 * `thumbAlignment="edge"` each position carries a half-thumb inset expressed as a
 * percentage of the control, so when a range's two thumbs hold the *same* value
 * the subtraction lands on a rounding artifact rather than on zero, and its sign
 * depends on how wide the control is. Measured at a 206px control: `-0.0115%`. A
 * negative percentage is an invalid `width`, so the browser drops the declaration
 * and the indicator falls back to filling its parent — a solid bar the width of
 * the whole track, painting out over the bounds label and the number field beside
 * it.
 *
 * The same slider measured `+0.354%` at ~310px, which is why this went unnoticed
 * until now: **the number fields are what narrowed the control enough to flip the
 * sign.** The bug is older than they are — drag or arrow a range's two handles
 * together at the wrong width and the old component does it too — so this is a
 * latent fault being fixed, not one being introduced.
 *
 * `!` because Base UI's `width` is an inline style and no class beats one
 * otherwise. It is the only `!important` in the component, and it is here rather
 * than in a `style` prop because a `style` would have to be recomputed on every
 * pointer move to say the one static thing it needs to say.
 *
 * **It has to be a variant rather than part of the base, because the two shapes
 * are sized by different properties.** A single-thumb slider gets
 * `width: var(--start-position)` and no `--relative-size` at all; only a range
 * gets the subtraction. Putting the guard in the base overrides the single case
 * with a variable that is not set there, which makes the `width` invalid and
 * fills the whole track — measured, and the reason this is spelled out: the
 * override is only correct where the property it names is the one in use.
 */
const indicator = tv({
  base: 'h-full rounded-full bg-input-selected',

  variants: {
    range: {
      true: 'w-[max(0px,var(--relative-size))]!',
      false: '',
    },
  },

  defaultVariants: { range: false },
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
 * the handle centered on the end of the filled track, which is `center` — and at
 * `min` that hangs half a handle past the control. Measured: a resting 16px disc
 * overhangs by 8px, which is exactly the row's `gap-2` and is presumably why
 * Figma's gap is 8. But the disc grows to 20px the moment you touch it, and then
 * the focus ring adds 4px more, so a focused handle at `min` **paints 6px over
 * the bounds label**.
 *
 * So it is `edge`, which insets the handle to sit fully inside the control at both
 * ends. The ring then lands in the gap with 4px to spare. Figma cannot settle this
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

/**
 * The number input's box — Figma's 56x32 `Input` instance, sitting outside the
 * bounds label at each end of the row.
 *
 * **56px is a floor, not a fixed width, and the difference is Figma's own
 * `Formatted` case failing.** The file draws 56, which leaves 32px of content
 * between the box's two 12px paddings — exactly three digits at `text-base`, and
 * that is all. `0`–`100` fits, `0%`–`100%` fits, and `£0`–`£1,000` does not: the
 * story rendered `£25(` and `£75(`, clipped mid-glyph. A design system component
 * that cannot show its own documented value is worse than one that departs from
 * the drawn width by a few pixels, so the width is `max(56px, …)` — Figma's
 * number wherever Figma's number is enough, and the content's own measure past
 * that.
 *
 * The measure is `--slider-field-chars`, the character count of the longer of the
 * two **formatted bounds** — the widest the field can ever have to be — set as a
 * custom property and read back by a utility class. **The value goes in a
 * variable and the width stays in a class** on purpose: a `style={{ width }}`
 * would be a hard-coded pixel count that no responsive or caller override could
 * reach past, where a custom property leaves the utility in charge.
 *
 * **The rate is 10px per character, and it comes out of Figma's own field rather
 * than out of the font.** 56 less the control's 24px of `px-3` and the box's two
 * borders leaves 32px of content for the three characters of `100`, so the file
 * is already allotting a shade under 11px each — generous next to Inter's 8.8px
 * digit. Taking 10 makes the three-character case land on exactly `3 × 10 + 26 =
 * 56`, so the floor and the formula agree at the scale Figma drew and the default
 * slider is the drawn width to the pixel.
 *
 * **`ch` was tried first and is the wrong unit here**, which is worth recording
 * because it looks like the right one. `ch` resolves against the element it is
 * written on — this box, at the inherited 16px — while the text that has to fit
 * lives in the `<input>` inside it at `text-base`'s 14. Measured: `1ch` came out
 * 10.09px against an 8.83px digit, so the three-character case computed 56.28 and
 * quietly took the calc branch instead of Figma's floor. A flat rate in `rem` has
 * no font-size context to get wrong, and no dependency on which face actually
 * loaded.
 *
 * `shrink-0` keeps the track from stealing the width back when the row is tight,
 * and the whole thing has to *replace* the box's base `w-full` rather than add to
 * it, which is what tailwind-merge does with two `w-` utilities.
 *
 * **`has-[:disabled]:opacity-100` is a cancellation, not a style.** `Input`'s box
 * fades itself when it contains a disabled control, which is right for a field
 * standing on its own and wrong inside a disabled Slider: the root is already at
 * `opacity-40` and the two would compound to 16%. Figma says the same thing by
 * leaving both `State=Disabled` variants' Input instances at `State=Default` and
 * fading the whole component once. It cancels rather than adds because the
 * variant prefix is tailwind-merge's key — same prefix, same `opacity` utility,
 * so the later one wins. A narrower selector would have left both live.
 */
const numberField = tv({
  base: 'w-[max(3.5rem,calc(var(--slider-field-chars)*0.625rem+1.625rem))] shrink-0',

  variants: {
    disabled: {
      true: 'has-[:disabled]:opacity-100',
      false: '',
    },
  },

  defaultVariants: { disabled: false },
})

/** A tick, optionally labeled. A bare number labels itself with its value. */
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
   * An editable number field at each end of the row — Figma's 56x32 `Input`
   * instances, and the thing this component was built without.
   *
   * **Figma's `Min Number Input` and `Max Number Input` collapse to one knob**,
   * the way `Min Value` and `Max Value` already do in `bounds`: showing one end's
   * field without the other's is not a real case, and the file itself does not
   * treat them as a symmetric pair — `Type=Default` has no min field to switch on
   * at all, only the trailing one. So the *count* is derived from the value, like
   * everything else here: one thumb gets one field at the trailing edge, a range
   * gets one at each end. Both of Figma's booleans default true, so this does.
   *
   * A slider with more than two thumbs is drawn nowhere in the file; it gets a
   * field for its first and last values and the ones in between stay drag-only.
   *
   * **Dragging pushes, typing clamps** — the one deliberate divergence. Base UI's
   * thumbs shove each other along when they collide, which is right for a
   * pointer; a typed number that silently moves the *other* field is not, so each
   * field is bounded by its neighbor's current value instead.
   */
  numberInput?: boolean
  /**
   * The value in a tooltip above the handle. Figma's only hover state includes
   * it, so it is on — **unless a number input is already showing the value**,
   * which is what the default derives. Two readouts of one number is the thing
   * this avoids; pass it explicitly to have both, or neither.
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
  numberInput = true,
  // Derived, not fixed at `true`: with a number field in the row the value is
  // already on screen, and a tooltip repeating it under the cursor is the second
  // readout of one number. Written as a parameter default so passing either prop
  // explicitly still wins.
  valueTooltip = !numberInput,
  thumbLabels,
  className,
  'aria-label': ariaLabel,
  min = 0,
  max = 100,
  step,
  format,
  locale,
  disabled = false,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommitted,
  ...props
}: SliderProps) {
  // One formatter for the bounds and the tick labels, built from the same
  // `format` and `locale` Base UI uses for the value itself, so a slider that
  // reads "60%" is not bounded by a bare "100".
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale as Parameters<typeof Intl.NumberFormat>[0], format),
    [locale, format],
  )

  // **The value is held here, and `Slider.Root` is always controlled.** Two
  // controls now write it — the handles and the number fields — and a field
  // cannot show a value Base UI is keeping to itself. DatePicker's arrangement:
  // mirror the uncontrolled case in state, defer to `value` when there is one, so
  // a caller who never asked for any of this sees no difference.
  const [uncontrolledValue, setUncontrolledValue] = useState<number | readonly number[]>(
    () => defaultValue ?? min,
  )
  const value = valueProp ?? uncontrolledValue

  // How many handles to draw. Figma's `Type` axis, derived from the value's
  // shape rather than asked for as a prop.
  const values = useMemo(
    () => (Array.isArray(value) ? (value as readonly number[]) : [value as number]),
    [value],
  )
  const thumbCount = values.length

  const setValue = useCallback(
    (next: number | readonly number[]) => {
      if (valueProp === undefined) setUncontrolledValue(next)
    },
    [valueProp],
  )

  /**
   * A number field wrote a value.
   *
   * `null` is what Base UI reports for an empty field mid-edit, and it is
   * deliberately ignored rather than clamped to `min`: the slider should not
   * slam to zero because somebody selected the text to retype it. The field is
   * controlled, so it re-formats back to the live value on blur anyway.
   *
   * The event details have to be **built** rather than forwarded, because there
   * is no slider event here — a keystroke in a sibling control is not one of
   * Base UI's reasons. `input-change` is the closest of the five it publishes
   * and is literally true, and `createChangeEventDetails` is Base UI's own
   * factory for the object, reached through the `internals/` subpath the package
   * exports for it. Writing the shape out by hand would be a copy that drifts.
   */
  const commitThumb = useCallback(
    (index: number, next: number | null, committed: boolean) => {
      if (next == null) return

      const current = Array.isArray(value) ? (value as readonly number[]) : [value as number]

      // **The clamp is here, not on the field.** `NumberInput`'s own `min`/`max`
      // only bite when the field commits, so a keystroke reaches this handler
      // unclamped and `[90, 80]` — an unsorted range — would go straight out to a
      // controlled caller's `onValueChange` before Base UI tidied it up on the way
      // back in. Measured: Base UI does resolve it, to `[80, 80]`, so the *screen*
      // was right and the value the caller saw was not. Clamping to the neighbour
      // here is what makes "typing clamps" a rule this component keeps rather than
      // one it gets away with.
      const lower = index === 0 ? min : current[index - 1]
      const upper = index === current.length - 1 ? max : current[index + 1]
      const clamped = Math.min(Math.max(next, lower), upper)

      if (current[index] === clamped) return

      const updated = current.slice()
      updated[index] = clamped
      const merged = updated.length === 1 ? updated[0] : updated

      if (valueProp === undefined) setUncontrolledValue(merged)
      onValueChange?.(
        merged,
        createChangeEventDetails('input-change', undefined, undefined, {
          activeThumbIndex: index,
        }),
      )
      // A typed value is committed when the field is — on blur or Enter — which
      // is the field's answer to letting go of a handle. Without this a
      // server-backed slider silently drops every edit made by typing.
      if (committed) onValueCommitted?.(merged, createGenericEventDetails('input-change'))
    },
    [max, min, onValueChange, onValueCommitted, value, valueProp],
  )

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

  // Names the two number fields. Base UI names the *thumbs* off `Slider.Label`
  // for free; a NumberField is a separate control in the same group and gets
  // nothing, so an unnamed slider's fields would be unnamed too.
  //
  // `thumbLabels` first, because it already names the same value and a caller who
  // wrote "Lowest price" should not then hear "Budget minimum". Otherwise the
  // slider's own name, qualified on a range so the two fields are told apart —
  // through `aria-labelledby` when there is a visible label, because `label` is a
  // ReactNode and there is no string to concatenate. Two ids concatenate into one
  // name, which is what the sr-only span below is for.
  const nameId = useId()

  // The widest the field can ever have to be: the longer of the two *formatted*
  // bounds, so a percent or a currency slider is measured as it will read rather
  // than as a bare number. See the `numberField` recipe for what reads it.
  const fieldChars = useMemo(
    () => Math.max(formatter.format(min).length, formatter.format(max).length),
    [formatter, min, max],
  )

  const qualifierFor = (index: number) =>
    thumbCount > 1 ? (index === 0 ? 'minimum' : 'maximum') : null

  const renderNumberField = (index: number) => {
    const qualifier = qualifierFor(index)
    const explicit = thumbLabels?.[index]
    const naming = explicit
      ? { 'aria-label': explicit }
      : label != null
        ? { 'aria-labelledby': qualifier ? `${nameId} ${nameId}-${qualifier}` : nameId }
        : { 'aria-label': qualifier ? `${ariaLabel} ${qualifier}` : ariaLabel }

    return (
      <Fragment key={index}>
        {explicit == null && label != null && qualifier != null && (
          <span id={`${nameId}-${qualifier}`} className="sr-only">
            {qualifier}
          </span>
        )}
        <NumberInput
          // `steppers={false}` is what makes this Figma's field rather than a
          // NumberInput: the file draws a plain `Input` instance, and without the
          // − and + cells NumberInput renders exactly Input's box, left-aligned,
          // at exactly the 56x32 drawn. All that is left is the number behavior,
          // which is the reason to reach for NumberInput over Input — clamping,
          // arrow keys, and `format`/`locale` parsing, so a field beside a
          // percent slider takes "60" and means 0.6.
          steppers={false}
          disabled={disabled}
          // Bounded by the neighbour rather than by the scale — the typing half
          // of "dragging pushes, typing clamps". A single thumb has no neighbour
          // and takes the scale's own ends.
          min={index === 0 ? min : values[index - 1]}
          max={index === thumbCount - 1 ? max : values[index + 1]}
          step={step}
          format={format}
          locale={locale}
          value={values[index]}
          onValueChange={(next) => commitThumb(index, next, false)}
          onValueCommitted={(next) => commitThumb(index, next, true)}
          {...naming}
          // On `NumberField.Root`, which is the outer element; custom properties
          // inherit, so the class on the box below reads it from there.
          style={{ '--slider-field-chars': fieldChars } as CSSProperties}
          className={numberField({ disabled })}
        />
      </Fragment>
    )
  }

  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      format={format}
      locale={locale}
      disabled={disabled}
      value={value}
      onValueChange={(next, eventDetails) => {
        setValue(next)
        onValueChange?.(next, eventDetails)
      }}
      onValueCommitted={onValueCommitted}
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
      // Not Base UI's default `center`. See the `thumb` recipe above: centered, a
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
          {/*
            Semibold, matching Field (19). Slider keeps its own label rather than
            handing it to a Field — Base UI needs `Slider.Label` to name the
            thumbs, and it is not in Figma's Field `Type` list — but "keeps its
            own" is about ownership, not about looking different, so the weight
            follows the one every other field label in the library now uses.
          */}
          {/*
            `id` is for the number fields, which are separate controls and get
            nothing from `Slider.Label` — see `renderNumberField`. It goes on the
            label text rather than on the Label frame so a `description` inside it
            does not become part of the field's name too; the *thumbs* take the
            whole block, which is the existing decision and is unaffected.
          */}
          <span id={nameId} className="text-base font-semibold text-content-primary">
            {label}
          </span>
          {description != null && (
            <span className="text-sm font-normal text-content-subtle">{description}</span>
          )}
        </SliderPrimitive.Label>
      )}

      <div className={row()}>
        {/*
          Figma's order, and it is the surprising half: the leading field sits
          *outside* the min bounds label rather than between it and the track.
          `Type=Range` draws [field] [0] ——track—— [100] [field]; `Type=Default`
          has no leading field node at all, only the trailing one, which is why
          this is `thumbCount > 1` rather than a second boolean.
        */}
        {numberInput && thumbCount > 1 && renderNumberField(0)}

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
            // center.
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
            <SliderPrimitive.Indicator className={indicator({ range: thumbCount > 1 })} />

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

        {numberInput && renderNumberField(thumbCount - 1)}
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
