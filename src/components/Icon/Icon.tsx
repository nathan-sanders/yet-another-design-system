import type { ComponentPropsWithRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * Icon — renders a Lucide glyph at a design-system size.
 *
 * Mirrors the Figma component set "Icon" (node 40002005:12711), which has a
 * single `Size` property: Small 12, Base 16, Large 20, X-Large 24. Every size
 * uses stroke weight 1.5 (`--icon-stroke-weight`).
 *
 * Colour is `currentColor` by design, not a hardcoded token. Figma binds the
 * icon fill to Content/Primary, which is what it inherits when it sits on a
 * normal page — but inside a Button it has to take the button's foreground
 * instead. Inheriting gets both for free; hardcoding would break the Button.
 * To colour one deliberately, pass a text utility: `<Icon className="text-content-danger" />`.
 */
const icon = tv({
  // Stroke weight comes from the --icon-stroke-weight token (1.5). It is applied
  // as CSS rather than via Lucide's `strokeWidth` prop because that prop lands
  // on the SVG presentation attribute, which cannot hold a `var()`. CSS wins
  // over the presentation attribute, so this overrides Lucide's default of 2.
  base: 'inline-block shrink-0 [stroke-width:var(--icon-stroke-weight)]',
  variants: {
    size: {
      small: 'size-3', // 12px
      base: 'size-4', // 16px
      large: 'size-5', // 20px
      'x-large': 'size-6', // 24px
    },
  },
  defaultVariants: {
    size: 'base',
  },
})

type IconVariants = VariantProps<typeof icon>

export interface IconProps extends Omit<ComponentPropsWithRef<'svg'>, 'ref'> {
  /** The Lucide icon to render, e.g. `import { Plus } from 'lucide-react'`. */
  icon: LucideIcon
  /** Glyph size. Maps to the Figma `Size` property. */
  size?: IconVariants['size']
  /**
   * Accessible label. Leave unset for decorative icons — they are hidden from
   * screen readers, which is right when adjacent text already says the same
   * thing (as it does inside a Button with a label).
   */
  label?: string
}

export function Icon({ icon: LucideGlyph, size, label, className, ...props }: IconProps) {
  return (
    <LucideGlyph
      className={cn(icon({ size }), className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    />
  )
}

Icon.displayName = 'Icon'
