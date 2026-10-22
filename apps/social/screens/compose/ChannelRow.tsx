import { Tabs } from '../../../../src/components/Tabs'
import { Text } from '../../../../src/components/Text'
import { ChannelAvatar } from '../../components/ChannelAvatar'
import { NETWORK_NAMES, type Network } from '../../data/types'
import { BRAND_PROFILES, type CaptionTab } from './composeForm'

/**
 * Which accounts the post goes out on, and the tab strip under them that
 * picks which caption is being written (`40006009:29479`, the avatar row and
 * `All channels / Instagram / Threads`). A network gets a tab once an
 * account on it is picked; a tab wears a dot when that network has a caption
 * of its own.
 */
export function ChannelRow({
  profileIds,
  locked,
  onToggle,
  tab,
  onTabChange,
  overridden,
  error,
}: {
  profileIds: string[]
  /** Editing a draft or a post: its channel cannot change. */
  locked?: boolean
  onToggle: (profileId: string) => void
  tab: CaptionTab
  onTabChange: (tab: CaptionTab) => void
  /** Networks with a caption of their own. */
  overridden: Network[]
  error?: string
}) {
  const networks = Array.from(
    new Set(BRAND_PROFILES.filter((p) => profileIds.includes(p.id)).map((p) => p.network)),
  )
  const shown = locked ? BRAND_PROFILES.filter((p) => profileIds.includes(p.id)) : BRAND_PROFILES
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Channels" className="flex flex-wrap items-center gap-3">
        {shown.map((profile) => (
          <ChannelAvatar
            key={profile.id}
            profile={profile}
            selected={profileIds.includes(profile.id)}
            disabled={locked}
            onToggle={() => onToggle(profile.id)}
          />
        ))}
        {error ? (
          <Text size="sm" color="danger" role="alert">
            {error}
          </Text>
        ) : null}
      </div>
      {networks.length ? (
        <Tabs value={tab} onValueChange={(value) => onTabChange(value as CaptionTab)} layout="hug">
          <Tabs.List aria-label="Caption for" divider>
            <Tabs.Tab value="all">All channels</Tabs.Tab>
            {networks.map((network) => (
              <Tabs.Tab
                key={network}
                value={network}
                aria-label={
                  overridden.includes(network)
                    ? `${NETWORK_NAMES[network]}, has its own caption`
                    : undefined
                }
                endSlot={
                  overridden.includes(network) ? (
                    <span aria-hidden className="size-1.5 rounded-full bg-content-emphasized" />
                  ) : undefined
                }
              >
                {NETWORK_NAMES[network]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      ) : null}
    </div>
  )
}
