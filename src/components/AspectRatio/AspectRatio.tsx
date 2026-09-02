import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * AspectRatio — a box that holds a fixed width-to-height ratio as it resizes.
 *
 * Mirrors the Figma component set "Aspect Ratio" (node 40004379:42735). That set
 * has one property, `Ratio`, whose six variants are `Custom`, `1:1`, `5:4`,
 * `4:5`, `16:9` and `9:16`, and every one of them draws the same thing: a
 * 240px-wide box that clips its overflow around a single image sized to cover
 * it. There is no fill, no border and no radius, and `get_variable_defs` on the
 * set returns nothing — the component binds no tokens because it paints nothing.
 * That is the whole point of it: it contributes a shape and gets out of the way,
 * and the background belongs to whatever is put inside.
 *
 * ## Where the width comes from
 * The box takes its width from its parent and derives its height from the ratio,
 * so it needs an ancestor with a definite width. Dropped into a shrink-to-fit
 * parent — `inline-flex`, `w-fit`, a float — it has no intrinsic width to
 * contribute and collapses to nothing. Constraining only its height does the
 * same damage from the other side: the width still comes from the parent, so a
 * lone `max-h-*` clamps the box off its ratio rather than scaling it. Pair a
 * height constraint with `w-auto` to size from the height instead.
 *
 * ## `fit`, and why it is optional
 * Left off, the children are rendered as they were passed and style themselves —
 * the shadcn behaviour the Figma description links out to, and the right default
 * for a chart, a map or a video player that already knows how to fill a box.
 * Set, an inner slot fills the box and stretches every direct child into it,
 * which is what the Figma set draws. Pass one child in that case: two children
 * are two stretched, overlapping layers, so an overlay or a caption goes inside
 * a single wrapper.
 *
 * ## Accessibility
 * The box has no role and no accessible name, and does not want one. The child
 * carries the whole description — an `alt` on the image, or `alt=""` when it is
 * decorative.
 */
const aspectRatio = tv({
  // `w-full` is what makes the ratio derive a height: the width comes from the
  // parent, and `aspect-ratio` does the rest. `overflow-hidden` is the clip the
  // Figma set draws (`overflow-clip` there), and it is also what makes `ellipse`
  // more than a rounded corner.
  base: 'relative w-full overflow-hidden',

  variants: {
    shape: {
      rectangle: '',
      // 50%, not `rounded-full`. A 9999px radius on a non-square box gives a
      // stadium — two semicircles either side of a straight run — and only a
      // percentage radius bends with the box into a true ellipse.
      ellipse: 'rounded-[50%]',
    },
  },

  defaultVariants: {
    shape: 'rectangle',
  },
})

/**
 * The five named ratios of the Figma set, written as fractions so the prop reads
 * the way a ratio is spoken.
 *
 * The map below is written out in full, and that is not stylistic. Tailwind finds
 * classes by scanning source text, so `` `aspect-[${w}/${h}]` `` generates no CSS
 * at all — and the failure is silent: the box lays out at its content height and
 * reads as a broken component rather than a missing class. `BentoGrid`'s span
 * maps and `src/lib/focus.ts` carry the same warning, from the same cause.
 */
const RATIO = {
  '1/1': 'aspect-square',
  '5/4': 'aspect-5/4',
  '4/5': 'aspect-4/5',
  '16/9': 'aspect-video',
  '9/16': 'aspect-9/16',
} as const

const FIT = {
  cover: '[&>*]:size-full [&>*]:object-cover',
  contain: '[&>*]:size-full [&>*]:object-contain',
  center: 'flex items-center justify-center',
} as const

type AspectRatioVariants = VariantProps<typeof aspectRatio>

export type AspectRatioName = keyof typeof RATIO
export type AspectRatioFit = keyof typeof FIT
export type AspectRatioShape = NonNullable<AspectRatioVariants['shape']>

export interface AspectRatioProps extends ComponentPropsWithRef<'div'> {
  /**
   * The ratio, as width over height. Maps to the Figma `Ratio` property.
   *
   * A **number** is accepted as the escape hatch, and it is Figma's `Custom`
   * variant — `2.35` for anamorphic film, `1.91` for a link preview, neither of
   * which is a named step here or a variant there. `Avatar`'s `size` takes a
   * number for the same reason. Reach for a name unless the ratio is genuinely
   * outside the set.
   *
   * The number travels as a custom property read back by a utility class, so the
   * `aspect-ratio` declaration stays at class level either way and a caller's
   * `className="md:aspect-square"` still wins. An inline `style` would outrank
   * every utility and quietly make the box impossible to override responsively.
   */
  ratio?: AspectRatioName | number
  /**
   * How the child is sized inside the box. `cover` fills and crops, `contain`
   * fills and letterboxes, `center` leaves the child at its natural size in the
   * middle. Left off, the child styles itself.
   */
  fit?: AspectRatioFit
  /**
   * Container shape. Both respect the ratio; `ellipse` clips to an oval, which is
   * a circle at `ratio="1/1"`. For a person, reach for `Avatar` — it owns the
   * initials fallback, the status dot and the group ring. This is for the other
   * round things.
   */
  shape?: AspectRatioShape
}

export function AspectRatio({
  ratio = '16/9',
  fit,
  shape,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) {
  const named = typeof ratio === 'string'

  return (
    <div
      className={cn(
        aspectRatio({ shape }),
        named ? RATIO[ratio] : 'aspect-(--yads-ratio)',
        className,
      )}
      style={named ? style : ({ '--yads-ratio': ratio, ...style } as CSSProperties)}
      {...props}
    >
      {fit ? <div className={cn('absolute inset-0', FIT[fit])}>{children}</div> : children}
    </div>
  )
}

AspectRatio.displayName = 'AspectRatio'
