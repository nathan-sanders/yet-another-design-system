import { useState, type FormEvent } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { Switch } from '../../../../src/components/Switch'
import { Text } from '../../../../src/components/Text'
import type { Theme } from '../../../../src/components/ThemeControl'
import { Toast } from '../../../../src/components/Toast'
import { me } from '../../data/people'
import { ROLE_OPTIONS, TIME_ZONES, type Preferences } from '../../data/preferences'
import { members } from '../../data/team'
import { useShell } from '../../shell/ShellContext'
import { SettingsGroup, SettingsHeader } from './SettingsBlock'

const ROLE_ITEMS = ROLE_OPTIONS.map((role) => ({ value: role, label: role }))

/** "New York (GMT-4)": the city, and the offset it has today. */
function zoneLabel(zone: string) {
  const city = zone.split('/').pop()!.replace(/_/g, ' ')
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
    .find((part) => part.type === 'timeZoneName')?.value
  return `${city} (${offset})`
}

const ZONE_ITEMS = TIME_ZONES.map((zone) => ({ value: zone, label: zoneLabel(zone) }))

/**
 * Settings › General: who you are to the workspace and to Yak, how the app
 * looks, and what Yak does without being asked. Code-first, no Figma frame,
 * after the Claude desktop app's General page.
 *
 * Two kinds of control, kept apart on purpose: the profile is a form with a
 * Save button, and everything under it takes effect as you change it, which
 * is why those are a SegmentedControl, a Select and Switches with no Save.
 * The theme is the shell's own, so switching it here switches the app.
 */
export function GeneralSection({
  preferences,
  onPreferencesChange,
  theme,
  onThemeChange,
}: {
  preferences: Preferences
  onPreferencesChange: (next: Preferences) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  const { notBuilt } = useShell()
  const toast = Toast.useToast()
  const [nickname, setNickname] = useState(preferences.nickname)
  const [role, setRole] = useState(preferences.role)
  const email = members.find((member) => member.personId === me.id)!.email
  const dirty = nickname !== preferences.nickname || role !== preferences.role
  const nicknameMissing = nickname.trim() === ''

  function save(event: FormEvent) {
    event.preventDefault()
    if (nicknameMissing) return
    onPreferencesChange({ ...preferences, nickname: nickname.trim(), role })
    toast.add({ title: 'Profile saved' })
  }

  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    onPreferencesChange({ ...preferences, [key]: value })

  return (
    <div className="flex flex-col gap-10">
      <SettingsHeader
        title="General"
        description="Your profile, how Yet Social looks, and what Yak does for you."
      />

      <SettingsGroup title="Profile">
        <div className="flex items-center gap-4">
          <Avatar size="large" name={me.name} src={me.avatar} alt="" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Text weight="semibold" className="truncate">
              {me.name}
            </Text>
            <Text size="sm" color="subtle" className="truncate">
              {email}
            </Text>
          </div>
          <Button appearance="secondary" onClick={() => notBuilt('Changing your photo')}>
            Change photo
          </Button>
        </div>
        <form onSubmit={save} className="flex max-w-md flex-col gap-4">
          <Field
            label="What should Yak call you?"
            invalid={nicknameMissing}
            error={nicknameMissing ? 'Give Yak a name to use.' : undefined}
          >
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </Field>
          <Field
            label="What best describes your work?"
            description="Yak pitches its drafts and reports to it."
            nativeLabel={false}
          >
            <Select
              value={role}
              onValueChange={(value) => setRole(value as string)}
              items={ROLE_ITEMS}
            >
              {ROLE_ITEMS.map((item) => (
                <Select.Item key={item.value} value={item.value}>
                  {item.label}
                </Select.Item>
              ))}
            </Select>
          </Field>
          <div>
            <Button type="submit" appearance="primary" disabled={!dirty || nicknameMissing}>
              Save
            </Button>
          </div>
        </form>
      </SettingsGroup>

      <SettingsGroup title="Appearance">
        <SegmentedControl
          aria-label="Theme"
          value={theme}
          onValueChange={(value) => onThemeChange(value as Theme)}
          className="self-start"
        >
          <SegmentedControl.Item value="light" startIcon={Sun}>
            Light
          </SegmentedControl.Item>
          <SegmentedControl.Item value="dark" startIcon={Moon}>
            Dark
          </SegmentedControl.Item>
        </SegmentedControl>
        <Field
          label="Time zone"
          description="The calendar, schedules and reports read in this time zone."
          nativeLabel={false}
          className="max-w-md"
        >
          <Select
            value={preferences.timeZone}
            onValueChange={(value) => set('timeZone', value as string)}
            items={ZONE_ITEMS}
          >
            {ZONE_ITEMS.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select>
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Yak" description="What Yak does before you ask it to.">
        <div className="flex flex-col gap-4">
          <Switch
            label="Suggest replies in the inbox"
            description="A draft under each new message, for you to send, change or ignore."
            checked={preferences.yakSuggestReplies}
            onCheckedChange={(checked) => set('yakSuggestReplies', checked)}
          />
          <Switch
            label="Write a morning brief"
            description="What’s scheduled, what needs you and what did well, at the top of Home."
            checked={preferences.yakDailyBrief}
            onCheckedChange={(checked) => set('yakDailyBrief', checked)}
          />
        </div>
      </SettingsGroup>
    </div>
  )
}
