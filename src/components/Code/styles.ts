import { tv, type VariantProps } from 'tailwind-variants'

/**
 * Code's recipe, on its own so a run that cannot be the component can still
 * wear it: a `<code>` written by hand into an editable line, where React does
 * not render the children (Yet Project's doc editor, FINDINGS 135). Menu's
 * `popup` is the same arrangement. `code()` with no arguments is the default,
 * Primary at `text-sm`. See `Code.tsx` for why each class is there.
 */
export const code = tv({
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
