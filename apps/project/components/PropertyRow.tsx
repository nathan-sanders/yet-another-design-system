import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { Icon } from '../../../src/components/Icon'

/**
 * `_Property Row` (`40006261:1606`): a 144px label of icon and subtle text,
 * then the value — an Interactive Token when it can be changed, a link Token
 * when it goes somewhere, or plain text. 32 tall, rows touching. A `dt`/`dd`
 * pair, so put rows in a `dl`. The task panel and a project's Overview both
 * use it.
 *
 * A value that does not fit wraps and the row grows, rather than being cut
 * short: Overview's "Ops, People, Marketing" is 155px in Chrome in the file's
 * 154 column. The label keeps the first line's 32, and the value's 4px above
 * and below make a one-line row 32 as drawn.
 */
export function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-2">
      <dt className="flex h-8 w-36 shrink-0 items-center gap-2 text-content-subtle">
        <Icon icon={icon} />
        {label}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2 py-1">{children}</dd>
    </div>
  )
}
