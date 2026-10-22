import { Avatar } from '../../../src/components/Avatar'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { NETWORK_NAMES, type Profile } from '../data/types'
import { NetworkIcon } from './NetworkIcon'

/**
 * One connected account in the composer's channel row (`Plan - Composer /
 * Full View`, `40006009:29479`): the brand's avatar with the network's mark in
 * a badge at its corner, and a ring when the post goes out on it.
 *
 * A toggle button, so a screen reader hears "veggie_vault on Instagram,
 * pressed". The network's mark is Avatar's `badge` (FINDINGS 147).
 */
export function ChannelAvatar({
  profile,
  selected,
  disabled,
  onToggle,
}: {
  profile: Profile
  selected: boolean
  /** Fixed: a draft or a scheduled post has the one channel it was written for. */
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${profile.name} on ${NETWORK_NAMES[profile.network]}`}
      disabled={disabled}
      onClick={onToggle}
      // Figma's `_Composer Channel`: a 36 avatar inside a 44 ring; the badge
      // is the avatar's, 20 at its corner with the 16 mark in it.
      className={cn(
        'relative flex size-11 items-center justify-center rounded-full transition-opacity duration-fast ease-standard',
        focusRing,
        selected ? 'inset-ring-2 inset-ring-content-emphasized' : 'opacity-50 hover:opacity-80',
        disabled && 'cursor-default hover:opacity-50',
      )}
    >
      <Avatar
        size="base"
        name={profile.name}
        src={profile.avatar}
        alt=""
        badge={<NetworkIcon network={profile.network} />}
      />
    </button>
  )
}
