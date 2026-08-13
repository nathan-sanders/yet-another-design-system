import type { ComponentPropsWithRef, ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

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
  slots: {
    root: [
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
    icon: 'shrink-0',
  },

  variants: {
    appearance: {
      primary: {
        root: [
          'bg-action-primary-background text-action-primary-foreground border-action-primary-border',
          'hover:bg-action-primary-background-hover hover:border-action-primary-border-hover',
        ],
      },
      secondary: {
        root: [
          'bg-action-secondary-background text-action-secondary-foreground border-action-secondary-border',
          'hover:bg-action-secondary-background-hover hover:border-action-secondary-border-hover',
        ],
      },
      destructive: {
        root: [
          'bg-action-destructive-background text-action-destructive-foreground border-action-destructive-border',
          'hover:bg-action-destructive-background-hover hover:border-action-destructive-border-hover',
        ],
      },
      ghost: {
        root: [
          'bg-action-ghost-background text-action-ghost-foreground border-action-ghost-border',
          'hover:bg-action-ghost-background-hover hover:border-action-ghost-border-hover',
        ],
      },
      overlay: {
        // Overlay has no border tokens in the theme, so it keeps a transparent
        // one to stay the same size as every other appearance.
        root: [
          'bg-action-overlay-background text-action-overlay-foreground border-transparent',
          'hover:bg-action-overlay-background-hover',
        ],
      },
      link: {
        root: [
          'bg-transparent text-action-link-foreground border-transparent underline',
          'hover:text-action-link-foreground-hover',
        ],
      },
    },

    size: {
      small: { root: 'h-6 gap-1 px-2 text-sm', icon: 'size-3.5' },
      default: { root: 'h-8 gap-2 px-3 text-base', icon: 'size-4' },
      large: { root: 'h-10 gap-2 px-4 text-base', icon: 'size-4' },
    },
  },

  compoundVariants: [
    // Link is type, not a filled control: weight 400 + underline, and far
    // tighter horizontal padding than the filled appearances at every size.
    { appearance: 'link', class: { root: 'font-normal' } },
    { appearance: 'link', size: 'small', class: { root: 'px-0.5' } },
    { appearance: 'link', size: 'default', class: { root: 'px-1' } },
    { appearance: 'link', size: 'large', class: { root: 'px-1.5' } },
    // Everything except link is semibold.
    { appearance: ['primary', 'secondary', 'destructive', 'ghost', 'overlay'], class: { root: 'font-semibold' } },
  ],

  defaultVariants: {
    appearance: 'primary',
    size: 'default',
  },
})

type ButtonVariants = VariantProps<typeof button>

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'color'> {
  /** Visual appearance. Maps to the Figma `Appearance` property. */
  appearance?: ButtonVariants['appearance']
  /** Control size. Maps to the Figma `Size` property. */
  size?: ButtonVariants['size']
  /** Icon rendered before the label (the Figma "Start Icon" slot). */
  startIcon?: ReactNode
  /** Icon rendered after the label (the Figma "End Icon" slot). */
  endIcon?: ReactNode
}

export function Button({
  appearance,
  size,
  startIcon,
  endIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const { root, icon } = button({ appearance, size })

  return (
    <button type={type} className={cn(root(), className)} {...props}>
      {startIcon && <span className={icon()}>{startIcon}</span>}
      {children}
      {endIcon && <span className={icon()}>{endIcon}</span>}
    </button>
  )
}

Button.displayName = 'Button'
