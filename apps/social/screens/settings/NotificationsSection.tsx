import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Switch } from '../../../../src/components/Switch'
import { Text } from '../../../../src/components/Text'
import { me } from '../../data/people'
import { NOTIFIABLE_GROUPS, type Preferences } from '../../data/preferences'
import { members } from '../../data/team'
import { SettingsGroup, SettingsHeader } from './SettingsBlock'

/**
 * Settings › Notifications: where they reach you, which ones do, and the
 * email digest. Code-first, no Figma frame. Every control takes effect as you
 * flip it, so these are Switches and a SegmentedControl, with no Save.
 *
 * The kinds are the rail bell's (`data/notifications.ts`), grouped the way a
 * person turns them off (`NOTIFIABLE_GROUPS`). Failed posts are drawn on and
 * disabled: a post that didn't go out needs someone, so it always notifies.
 */
export function NotificationsSection({
  preferences,
  onPreferencesChange,
}: {
  preferences: Preferences
  onPreferencesChange: (next: Preferences) => void
}) {
  const email = members.find((member) => member.personId === me.id)!.email
  const { delivery, kinds } = preferences
  const setDelivery = (key: keyof Preferences['delivery'], on: boolean) =>
    onPreferencesChange({ ...preferences, delivery: { ...delivery, [key]: on } })

  return (
    <div className="flex flex-col gap-10">
      <SettingsHeader
        title="Notifications"
        description="The bell always shows everything. Choose what else reaches you, and where."
      />

      <SettingsGroup title="Delivery">
        <div className="flex flex-col gap-4">
          <Switch
            label="Email"
            description={`To ${email}.`}
            checked={delivery.email}
            onCheckedChange={(on) => setDelivery('email', on)}
          />
          <Switch
            label="Push"
            description="On your phone, through the Yet Social app."
            checked={delivery.push}
            onCheckedChange={(on) => setDelivery('push', on)}
          />
          <Switch
            label="Desktop"
            description="In this browser, while Yet Social is open."
            checked={delivery.desktop}
            onCheckedChange={(on) => setDelivery('desktop', on)}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Notify me about" description="Turned off, these still go to the bell.">
        <div className="flex flex-col gap-4">
          <Switch
            label="Failed posts"
            description="Always on: a post that didn’t go out needs someone."
            checked
            disabled
          />
          {NOTIFIABLE_GROUPS.map((group) => (
            <Switch
              key={group.id}
              label={group.label}
              description={group.description}
              checked={kinds[group.id]}
              onCheckedChange={(on) =>
                onPreferencesChange({ ...preferences, kinds: { ...kinds, [group.id]: on } })
              }
            />
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup
        title="Email digest"
        description="A summary of what happened on your channels, on top of the emails above."
      >
        <SegmentedControl
          aria-label="Email digest"
          value={preferences.digest}
          onValueChange={(value) =>
            onPreferencesChange({ ...preferences, digest: value as Preferences['digest'] })
          }
          disabled={!delivery.email}
          className="self-start"
        >
          <SegmentedControl.Item value="off">Off</SegmentedControl.Item>
          <SegmentedControl.Item value="daily">Daily</SegmentedControl.Item>
          <SegmentedControl.Item value="weekly">Weekly</SegmentedControl.Item>
        </SegmentedControl>
        {delivery.email ? null : (
          <Text size="sm" color="subtle">
            Turn on email above to get a digest.
          </Text>
        )}
      </SettingsGroup>
    </div>
  )
}
