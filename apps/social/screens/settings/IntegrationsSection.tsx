import type { ReactNode } from 'react'

import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Text } from '../../../../src/components/Text'
import { integrations, type Integration } from '../../data/integrations'
import { useShell } from '../../shell/ShellContext'
import { SettingsBlock, SettingsGroup, SettingsHeader } from './SettingsBlock'

/**
 * Settings › Integrations: the other tools the workspace is connected to, then
 * the ones it could be. Code-first, no Figma frame. Each row is a
 * `SettingsBlock` with a lettermark where a logo would go. Connecting is the
 * other tool's OAuth flow, which a mock does not have, so the actions say so.
 */
export function IntegrationsSection() {
  const { notBuilt } = useShell()
  const connected = integrations.filter((integration) => integration.connected)
  const available = integrations.filter((integration) => !integration.connected)

  return (
    <div className="flex flex-col gap-10">
      <SettingsHeader
        title="Integrations"
        description="Connect the other tools your team uses, so work moves between them on its own."
      />

      <SettingsGroup title="Connected">
        <ul className="flex flex-col gap-6">
          {connected.map((integration) => (
            <li key={integration.id}>
              <IntegrationRow
                integration={integration}
                action={
                  <Button
                    appearance="secondary"
                    aria-label={`Manage ${integration.name}`}
                    onClick={() => notBuilt(`${integration.name} settings`)}
                  >
                    Manage
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="More integrations">
        <ul className="flex flex-col gap-6">
          {available.map((integration) => (
            <li key={integration.id}>
              <IntegrationRow
                integration={integration}
                action={
                  <Button
                    appearance="secondary"
                    aria-label={`Connect ${integration.name}`}
                    onClick={() => notBuilt(`Connecting ${integration.name}`)}
                  >
                    Connect
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      </SettingsGroup>
    </div>
  )
}

function IntegrationRow({ integration, action }: { integration: Integration; action: ReactNode }) {
  return (
    <SettingsBlock
      title={integration.name}
      lead={
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-background-primary text-base font-bold text-content-emphasized"
        >
          {integration.mark}
        </span>
      }
      badge={integration.connected ? <Badge color="emerald">Connected</Badge> : null}
      action={action}
    >
      <Text color="subtle">{integration.description}</Text>
      {integration.detail ? (
        <Text size="sm" color="subtle">
          {integration.detail}
        </Text>
      ) : null}
    </SettingsBlock>
  )
}
