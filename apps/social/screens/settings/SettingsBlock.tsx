import type { ReactNode } from 'react'

import { Heading, Text } from '../../../../src/components/Text'

/**
 * A section's title and the sentence under it: the top of every Settings page.
 * The heading takes focus when a link inside one section opens another; it
 * is a place to land, not a control, so it draws no ring.
 */
export function SettingsHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Heading level={3} size="lg" weight="semibold" tabIndex={-1} className="outline-none">
        {title}
      </Heading>
      <Text color="subtle">{description}</Text>
    </div>
  )
}

/**
 * One block of a Settings page: a title row (with an optional badge) and its
 * detail on the left, its action on the right. Below the dialog's `@xl` the
 * action drops under the detail rather than squeezing it. Billing's plan and
 * card, Channels' brands and Integrations' rows are all this shape.
 */
export function SettingsBlock({
  title,
  titleWeight = 'semibold',
  lead,
  badge,
  action,
  children,
}: {
  title: ReactNode
  titleWeight?: 'normal' | 'semibold'
  lead?: ReactNode
  badge?: ReactNode
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="flex flex-col items-start gap-4 @xl/settings:flex-row @xl/settings:justify-between @xl/settings:gap-8">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {lead}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={4} size="base" weight={titleWeight}>
              {title}
            </Heading>
            {badge}
          </div>
          {children}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  )
}

/**
 * A titled group of controls, like Notifications' "Delivery": an h4 and a
 * sentence over whatever it holds.
 */
export function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Heading level={4} size="base" weight="semibold">
          {title}
        </Heading>
        {description ? <Text color="subtle">{description}</Text> : null}
      </div>
      {children}
    </section>
  )
}
