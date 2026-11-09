import type { LucideIcon } from 'lucide-react'

import { Icon } from '../../../src/components/Icon'
import { Link } from '../../../src/components/Link'
import { Heading, Text } from '../../../src/components/Text'
import { FIGMA_FILE } from '../shell/routes'

/**
 * The centered message a page or a project tab shows when it is not built:
 * Yet Social's `NotBuilt` body, split out so a tab can show it under the
 * project's header.
 */
export function NotBuiltMessage({
  icon,
  title,
  body,
  figma,
  link,
}: {
  icon: LucideIcon
  title: string
  body: string
  /** The frame it is drawn on, as `node-id` writes it (`40006268-5150`). */
  figma?: string
  link?: { href: string; label: string }
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-subtle">
        <Icon icon={icon} size="x-large" />
      </span>
      <Heading level={2} size="lg" weight="semibold">
        {title}
      </Heading>
      <Text color="subtle" className="max-w-sm">
        {body}
      </Text>
      {figma ? (
        <Link href={`${FIGMA_FILE}?node-id=${figma}`} external>
          See the design
        </Link>
      ) : null}
      {link ? <Link href={link.href}>{link.label}</Link> : null}
    </div>
  )
}
