import { isValidElement, type ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'

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
 * trigger showing it draw the icon identically.
 */
export function LeadingIcon({ icon }: { icon: StartIcon }) {
  if (isValidElement(icon)) {
    return (
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        {icon}
      </span>
    )
  }

  return <Icon icon={icon} />
}

LeadingIcon.displayName = 'LeadingIcon'
