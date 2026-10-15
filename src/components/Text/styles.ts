import { tv } from 'tailwind-variants'

/**
 * The type layer, as variants. Text and Heading both read it, so a size or a
 * color means the same thing on either one.
 *
 * Every size is a Figma text style — `text-sm/normal`, `text-base/semibold` —
 * and the size utility sets the line height with it, because the theme ships
 * `--text-base--line-height` beside `--text-base`. So the pair is never chosen
 * per call site, which is the point of having the component.
 *
 * **The scale is one step off Tailwind's.** `sm` is 12px, `base` is 14px and
 * `lg` is 16px here. Read a 14px measurement as `base`.
 *
 * **Three weights and no `medium`.** The theme defines normal, semibold and
 * bold and nothing else, so a `font-medium` class compiles to a variable that
 * does not exist and renders at 400. Offering only the three real ones is half
 * of why this component exists.
 */
export const typography = tv({
  base: 'font-sans',
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
    weight: {
      normal: 'font-normal',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    // The five Content tokens, plus `inherit` for text that sits on something
    // that already picked its color — a button, a banner, an inverse surface.
    color: {
      primary: 'text-content-primary',
      subtle: 'text-content-subtle',
      emphasized: 'text-content-emphasized',
      danger: 'text-content-danger',
      inverse: 'text-content-inverse',
      inherit: '',
    },
    // Figma's `mono regular` / `mono bold` styles. Geist Mono, for anything a
    // person could type: an id, a path, a value.
    mono: { true: 'font-mono' },
    italic: { true: 'italic' },
    // One line with an ellipsis. Several lines go through `line-clamp-(--lines)`
    // instead, so the count arrives as a custom property and one class covers
    // every number.
    truncate: {
      line: 'truncate',
      lines: 'line-clamp-(--lines)',
    },
  },
})
