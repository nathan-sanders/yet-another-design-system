import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon, type IconProps } from '../Icon'

/**
 * Button — the reference component for this library.
 *
 * Mirrors the Figma component set "Button" (Yet Another Design System,
 * node 40002008:12837): 5 appearances x 3 sizes x 4 states.
 *
 * There is deliberately no `link` appearance. A link navigates and belongs in
 * an <a>; styling a <button> to look like one gives up middle-click, ⌘-click
 * and "open in new tab", and announces as "button" to a screen reader. It is
 * also fixed-height and inline-flex, so it could never sit inside a sentence,
 * which is what a link mostly needs to do. That is a typography concern, and
 * it will come back as its own Link component.
 *
 * Every value below comes from a semantic token. There are no hex colors, no
 * primitive utilities (`bg-stone-800`) and no `dark:` variants — dark mode is
 * handled entirely by the token layer swapping under `.dark`.
 *
 * Passing a `startIcon` with no children gives the icon-only form: same height
 * and same horizontal padding as its labeled counterpart, just without the
 * label, with `aria-label` required to supply the name the label would have
 * carried.
 *
 * Figma models hover / focus / disabled as a `State` property. In code those
 * are real CSS states rather than props, so there is no `state` prop: hover and
 * focus come from the browser, and `disabled` is the native HTML attribute.
 */
const button = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center',
    'rounded-md border font-sans font-semibold whitespace-nowrap',
    'cursor-pointer transition-colors',
    // Focus is the library's shared ring — see src/lib/focus.ts. It paints
    // entirely outside the button, so a focused button is exactly the size of
    // an unfocused one and the grid does not re-flow as you tab through it.
    ...focusRing,
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
    },

    size: {
      small: 'h-6 gap-1 px-2 text-sm',
      default: 'h-8 gap-2 px-3 text-base',
      large: 'h-10 gap-2 px-4 text-base',
    },
  },

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

interface ButtonBaseProps extends Omit<ComponentPropsWithRef<'button'>, 'color' | 'children'> {
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

/**
 * A Button is either labeled or icon-only, and the two have different rules,
 * so the props are a union rather than "everything optional".
 *
 * Icon-only means exactly what it says: a start icon and no label. Because
 * there is no visible text, `aria-label` is required — TypeScript will not let
 * an unlabeled icon button compile, which is the one accessibility mistake
 * this pattern invites.
 */
export type ButtonProps = ButtonBaseProps &
  (
    | {
        children: ReactNode
        'aria-label'?: string
      }
    | {
        children?: never
        startIcon: LucideIcon
        /** Required: the icon carries no accessible name of its own. */
        'aria-label': string
      }
  )

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
