import type { ComponentPropsWithRef } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * Code — a short technical reference inside running text: a function name, a
 * prop, a file path, a command-line flag.
 *
 * The look is the Figma component "Code" (Yet Another Design System, page
 * `↪ Code`, set `40006576:366`): Geist Mono on `Surface/Overlay Subtle`,
 * `rounded-xs`, 4px of horizontal padding and no vertical padding, so the box
 * is exactly one line tall. The API follows Meta's Astryx `Code` — children,
 * a `color` and a `size` — narrowed to what the file draws.
 *
 * **The size is a type step, and it runs one below the prose.** Figma's
 * Small / Base / Large are `text-sm/mono`, `text-base/mono` and
 * `text-lg/mono`, and its guidance pairs Small with `text-sm` *and* `text-base`
 * prose, Base with `text-lg`, Large with `text-xl`. A mono face is wider and
 * taller-looking than Inter at the same size, so the step below reads as the
 * same size. That is also why there is no `inherit` the way `Link` has one: a
 * code run at the paragraph's own size looks a size too big.
 *
 * **It is `inline-block`, so the fill is the line, not the glyphs.** Figma's box
 * is exactly one line tall — 20, 24, 28px. An `inline` element paints its
 * background over the font's content area instead, which for Geist Mono is
 * about 1.3em: Astryx's inline `Code` measures 17px on a 20px line, a visibly
 * shorter chip than the file draws. `Link` stays `inline` because a link can be
 * a whole clause and has to flow across lines; Code is, by the file's own
 * guidance, a short reference that never runs past one line. `max-w-full` and
 * `break-words` are the floor for the case that ignores that: a path too long
 * for its column breaks inside its own box rather than overflowing.
 *
 * **The fill is translucent for the reason `Kbd`'s is.** `Surface/Overlay
 * Subtle` is 10% of the neutral over whatever is behind it, so it reads on the
 * canvas, on a card and on a highlighted row without knowing which one it is on.
 *
 * `font-mono` is set on the element, not inherited. Tailwind's Preflight
 * already styles `<code>` with `--font-mono`, so the class changes nothing you
 * can see — it is there so the binding is the component's and not a reset's.
 *
 * Not interactive: no hover, no focus. Figma's guidance is explicit that a copy
 * or a link goes in a Button or Link beside it, never on it.
 */
const code = tv({
  base: [
    // inline-block with the line height as its height: see the docblock.
    'inline-block max-w-full rounded-xs px-1 py-0 align-baseline',
    'bg-surface-overlay-subtle',
    'font-mono font-normal',
    // A path too long for its column breaks inside the box, rather than overflow.
    'break-words',
  ],
  variants: {
    color: {
      primary: 'text-content-primary',
      // Figma calls it Secondary and binds Content/Subtle — for code inside
      // helper or caption copy that is itself set subtle.
      secondary: 'text-content-subtle',
    },
    // Each size sets its line height with it — the theme ships
    // `--text-sm--line-height` beside `--text-sm` — so the box is 20 / 24 / 28px.
    size: {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    color: 'primary',
    size: 'sm',
  },
})

type CodeVariants = VariantProps<typeof code>
export type CodeSize = NonNullable<CodeVariants['size']>
export type CodeColor = NonNullable<CodeVariants['color']>

export interface CodeProps extends Omit<ComponentPropsWithRef<'code'>, 'color'> {
  /**
   * `primary` (the default) or `secondary`. Use `secondary` when the sentence
   * around it is set in subtle text, so the code does not jump out of it.
   */
  color?: CodeColor
  /**
   * The type step: `sm` (the default, 12px), `base` (14px) or `lg` (16px).
   * Pick one step below the prose — `sm` inside `text-sm` or `text-base`,
   * `base` inside `text-lg`, `lg` inside `text-xl`.
   */
  size?: CodeSize
}

export function Code({ color, size, className, ...props }: CodeProps) {
  return <code className={cn(code({ color, size }), className)} {...props} />
}

Code.displayName = 'Code'
