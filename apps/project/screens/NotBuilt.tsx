import { useLocation } from 'react-router'
import { Construction, PencilRuler } from 'lucide-react'

import { AppShell } from '../../../src/components/AppShell'
import { Heading } from '../../../src/components/Text'
import { TopBar } from '../../../src/components/TopBar'
import { floatingYakClearance } from '../yak/floating'
import { allRoutes } from '../shell/routes'
import { NotBuiltMessage } from './NotBuiltMessage'

/**
 * Where every nav item the mock does not cover yet lands: a screen drawn in
 * Figma and waiting to be built links its frame; an address that is not a
 * place says so.
 */
export function NotBuilt() {
  const { pathname } = useLocation()
  const route = allRoutes.find((r) => r.path === pathname)
  const title = route?.label ?? 'Not found'

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="bold">
            {title}
          </Heading>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {route?.figma ? (
          <NotBuiltMessage
            icon={PencilRuler}
            title="Designed, not built yet"
            body={`${title} is drawn in Figma and comes in a later slice of this app.`}
            figma={route.figma}
          />
        ) : (
          <NotBuiltMessage
            icon={Construction}
            title="Not found"
            body="There is nothing at this address."
            link={{ href: '#/home', label: 'Back to Home' }}
          />
        )}
      </AppShell.Content>
    </>
  )
}
