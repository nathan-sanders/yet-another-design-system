import { isValidElement, type ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Icon } from './Icon'

/**
 * What a row's `startIcon` can be: a Lucide component, or an element.
 *
 * The component is the common case — `startIcon={Globe}` — and renders through
 * `Icon` at 16px. The element is for things that are not glyphs at all: a color
 * swatch, a flag, a tiny avatar. Those cannot be a `LucideIcon`, and a second
 * prop beside `startIcon` would let a caller set both.
 */
export type StartIcon = LucideIcon | ReactElement

/**
 * Renders a `StartIcon` in the 16px leading box.
 *
 * Decorative either way: the row's label already says what the icon means, so
 * an element is wrapped `aria-hidden` the same way `Icon` hides its own svg.
 * Shared by `Select.Item`, `Combobox.Item` and both triggers, so a row and the
 * trigger showing it draw the icon identically; and by the block header
 * (`ContentBlock`, `Panel`, `Drawer`) and `Token`, whose `small` is the 14px
 * box Token's glyph has always been. An application's own mark — a product
 * logo, a network glyph — goes in as an element at the same size as a Lucide
 * icon would, rather than in a slot meant for something else.
 */
export function LeadingIcon({ icon, size = 'base' }: { icon: StartIcon; size?: 'small' | 'base' }) {
  if (isValidElement(icon)) {
    return (
      <span
        aria-hidden
        className={cn('flex shrink-0 items-center justify-center', size === 'small' ? 'size-3.5' : 'size-4')}
      >
        {icon}
      </span>
    )
  }

  return <Icon icon={icon} size={size} />
}

LeadingIcon.displayName = 'LeadingIcon'
