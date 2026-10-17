import { useLocation } from 'react-router'
import { Construction, PencilRuler } from 'lucide-react'

import { Icon } from '../../../src/components/Icon'
import { Link } from '../../../src/components/Link'
import { TopBar } from '../../../src/components/TopBar'
import { AppShell } from '../../../src/components/AppShell'
import { Heading, Text } from '../../../src/components/Text'
import { allRoutes, FIGMA_FILE } from '../shell/routes'

/**
 * Where every nav item the mock does not cover yet lands. Two messages, because
 * they mean different things: a screen that is drawn in Figma and waiting to be
 * built, and an area nobody has designed yet (Campaigns, Alerts).
 */
export function NotBuilt() {
  const { pathname } = useLocation()
  const route = allRoutes.find((r) => r.path === pathname)
  const title = route?.label ?? 'Not found'

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="semibold">
            {title}
          </Heading>
        }
      />
      <AppShell.Content>
        <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-subtle">
            <Icon icon={route?.figma ? PencilRuler : Construction} size="x-large" />
          </span>
          {route?.figma ? (
            <>
              <Heading level={2} size="lg" weight="semibold">
                Designed, not built yet
              </Heading>
              <Text color="subtle" className="max-w-sm">
                {title} is drawn in Figma and comes in a later slice of this app.
              </Text>
              <Link href={`${FIGMA_FILE}?node-id=${route.figma}`} external>
                See the design
              </Link>
            </>
          ) : (
            <>
              <Heading level={2} size="lg" weight="semibold">
                Not designed yet
              </Heading>
              <Text color="subtle" className="max-w-sm">
                {route
                  ? `${title} has a place in the navigation and no screens yet.`
                  : 'There is nothing at this address.'}
              </Text>
              <Link href="#/plan/calendar">Back to the calendar</Link>
            </>
          )}
        </div>
      </AppShell.Content>
    </>
  )
}
