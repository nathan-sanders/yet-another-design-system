import { Ellipsis, Plus } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Banner } from '../../../../src/components/Banner'
import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { ProgressBar } from '../../../../src/components/ProgressBar'
import { Text } from '../../../../src/components/Text'
import { plan } from '../../data/billing'
import { brands, needsReconnect } from '../../data/channels'
import { NETWORK_NAMES, type Profile } from '../../data/types'
import { NetworkIcon } from '../../components/NetworkIcon'
import { useShell } from '../../shell/ShellContext'
import { SettingsBlock, SettingsGroup, SettingsHeader } from './SettingsBlock'

/**
 * Settings › Channels: the social accounts the workspace posts from, by
 * brand, against the plan's channel allowance. Code-first, no Figma frame.
 *
 * Each row is the composer's channel avatar at rest — the brand's picture with
 * the network's mark at its corner — and its name. One account has lost its
 * connection, so the page leads with that, the way a dropped channel should
 * be found before a post fails on it. Connecting and disconnecting are a
 * network's OAuth flow, which a mock does not have, so they say so.
 */
export function ChannelsSection() {
  const { notBuilt } = useShell()
  const connected = brands.reduce((sum, brand) => sum + brand.profiles.length, 0)
  const dropped = brands
    .flatMap((brand) => brand.profiles)
    .filter((profile) => needsReconnect.has(profile.id))

  return (
    <div className="flex flex-col gap-10">
      <SettingsHeader
        title="Channels"
        description="The social accounts this workspace posts from and replies on."
      />

      {dropped.map((profile) => (
        <Banner
          key={profile.id}
          type="warning"
          title={`${NETWORK_NAMES[profile.network]} needs reconnecting`}
          action={
            <Button appearance="secondary" onClick={() => notBuilt('Reconnecting a channel')}>
              Reconnect
            </Button>
          }
        >
          Nothing posts to {profile.name} until it’s reconnected. Its scheduled posts are waiting.
        </Banner>
      ))}

      <SettingsBlock
        title={`${connected} of ${plan.channels} channels`}
        action={
          <Button
            appearance="primary"
            startIcon={Plus}
            onClick={() => notBuilt('Connecting a channel')}
          >
            Connect a channel
          </Button>
        }
      >
        <Text color="subtle">
          Your {plan.name} plan includes {plan.channels}. Each account on each network counts as
          one.
        </Text>
        <ProgressBar
          aria-label="Channels connected"
          value={connected}
          max={plan.channels}
          getAriaValueText={() => `${connected} of ${plan.channels} channels`}
          className="mt-2 max-w-md"
        />
      </SettingsBlock>

      {brands.map((brand) => (
        <SettingsGroup
          key={brand.id}
          title={brand.name}
          description={`${brand.profiles.length} channels`}
        >
          <ul className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
            {brand.profiles.map((profile) => (
              <ChannelRow
                key={profile.id}
                profile={profile}
                dropped={needsReconnect.has(profile.id)}
                onAction={notBuilt}
              />
            ))}
          </ul>
        </SettingsGroup>
      ))}
    </div>
  )
}

function ChannelRow({
  profile,
  dropped,
  onAction,
}: {
  profile: Profile
  dropped: boolean
  onAction: (what: string) => void
}) {
  const network = NETWORK_NAMES[profile.network]
  const label = `${profile.name} on ${network}`
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Avatar
        size="base"
        name={profile.name}
        src={profile.avatar}
        alt=""
        badge={<NetworkIcon network={profile.network} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Text className="truncate">{profile.name}</Text>
        <Text size="sm" color="subtle">
          {network}
        </Text>
      </div>
      {dropped ? <Badge color="amber">Reconnect needed</Badge> : null}
      <Menu>
        <Menu.Trigger
          render={
            <Button appearance="ghost" startIcon={Ellipsis} aria-label={`${label} options`} />
          }
        />
        <Menu.Popup aria-label={`${label} options`}>
          <Menu.Group>
            <Menu.Item onClick={() => onAction('Reconnecting a channel')}>Reconnect</Menu.Item>
            <Menu.Item onClick={() => onAction('Disconnecting a channel')}>Disconnect</Menu.Item>
          </Menu.Group>
        </Menu.Popup>
      </Menu>
    </li>
  )
}
