import type { ComponentPropsWithRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Icon, type IconProps } from '../Icon'

/**
 * Button — the reference component for this library.
 *
 * Mirrors the Figma component set "Button" (Yet Another Design System,
 * node 40002008:12837): 6 appearances x 3 sizes x 4 states.
 *
 * Every value below comes from a semantic token. There are no hex colours, no
 * primitive utilities (`bg-stone-800`) and no `dark:` variants — dark mode is
 * handled entirely by the token layer swapping under `.dark`.
 *
 * Figma models hover / focus / disabled as a `State` property. In code those
 * are real CSS states rather than props, so there is no `state` prop: hover and
 * focus come from the browser, and `disabled` is the native HTML attribute.
 */
const button = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center',
    'rounded-md border font-sans whitespace-nowrap',
    'cursor-pointer transition-colors',
    // Focus: 2px inner border + 3px outer ring, both from the focus tokens.
    // `:focus-visible` so it shows for keyboard users but not on mouse click.
    'outline-none focus-visible:border-2 focus-visible:border-focus-focus-inner-border',
    'focus-visible:ring-3 focus-visible:ring-focus-focus-outer-border',
    // Disabled is a flat 40% opacity in Figma (opacity/opacity-40).
    'disabled:pointer-events-none disabled:opacity-40',
  ],

  variants: {
    appearance: {
      primary: [
        'bg-action-primary-background text-action-primary-foreground border-action-primary-border',
        'hover:bg-action-primary-background-hover hover:border-action-primary-border-hover',
      ],
      secondary: [
        'bg-action-secondary-background text-action-secondary-foreground border-action-secondary-border',
        'hover:bg-action-secondary-background-hover hover:border-action-secondary-border-hover',
      ],
      destructive: [
        'bg-action-destructive-background text-action-destructive-foreground border-action-destructive-border',
        'hover:bg-action-destructive-background-hover hover:border-action-destructive-border-hover',
      ],
      ghost: [
        'bg-action-ghost-background text-action-ghost-foreground border-action-ghost-border',
        'hover:bg-action-ghost-background-hover hover:border-action-ghost-border-hover',
      ],
      // Overlay has no border tokens in the theme, so it keeps a transparent
      // one to stay the same size as every other appearance.
      overlay: [
        'bg-action-overlay-background text-action-overlay-foreground border-transparent',
        'hover:bg-action-overlay-background-hover',
      ],
      link: [
        'bg-transparent text-action-link-foreground border-transparent underline',
        'hover:text-action-link-foreground-hover',
      ],
    },

    size: {
      small: 'h-6 gap-1 px-2 text-sm',
      default: 'h-8 gap-2 px-3 text-base',
      large: 'h-10 gap-2 px-4 text-base',
    },
  },

  compoundVariants: [
    // Link is type, not a filled control: weight 400 + underline, and far
    // tighter horizontal padding than the filled appearances at every size.
    { appearance: 'link', class: 'font-normal' },
    { appearance: 'link', size: 'small', class: 'px-0.5' },
    { appearance: 'link', size: 'default', class: 'px-1' },
    { appearance: 'link', size: 'large', class: 'px-1.5' },
    // Everything except link is semibold.
    { appearance: ['primary', 'secondary', 'destructive', 'ghost', 'overlay'], class: 'font-semibold' },
  ],

  defaultVariants: {
    appearance: 'primary',
    size: 'default',
  },
})

type ButtonVariants = VariantProps<typeof button>
type ButtonSize = NonNullable<ButtonVariants['size']>

/**
 * Which Icon size each Button size reaches for. Kept as an explicit map rather
 * than derived, because the two scales are independent: Button is 24/32/40 tall
 * while Icon is 12/16/20/24.
 */
const ICON_SIZE: Record<ButtonSize, IconProps['size']> = {
  small: 'small', // 12px
  default: 'base', // 16px
  large: 'base', // 16px
}

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'color'> {
  /** Visual appearance. Maps to the Figma `Appearance` property. */
  appearance?: ButtonVariants['appearance']
  /** Control size. Maps to the Figma `Size` property. */
  size?: ButtonSize
  /**
   * Lucide icon rendered before the label (the Figma "Start Icon" slot).
   * Pass the component itself: `startIcon={Plus}`, not `<Plus />`. The Button
   * renders it through <Icon> so its size and stroke stay on-system.
   */
  startIcon?: LucideIcon
  /** Lucide icon rendered after the label (the Figma "End Icon" slot). */
  endIcon?: LucideIcon
}

export function Button({
  appearance,
  size = 'default',
  startIcon,
  endIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const iconSize = ICON_SIZE[size]

  return (
    <button type={type} className={cn(button({ appearance, size }), className)} {...props}>
      {startIcon && <Icon icon={startIcon} size={iconSize} />}
      {children}
      {endIcon && <Icon icon={endIcon} size={iconSize} />}
    </button>
  )
}

Button.displayName = 'Button'
