import { useCallback, useEffect, useRef, useState } from 'react'

import { Dialog } from '../../../../src/components/Dialog'
import { NavItem, SideNav } from '../../../../src/components/Nav'
import { Select } from '../../../../src/components/Select'
import type { Theme } from '../../../../src/components/ThemeControl'
import { defaultPreferences } from '../../data/preferences'
import { initialTeam } from '../../data/team'
import { BillingSection } from './BillingSection'
import { ChangelogSection } from './ChangelogSection'
import { ChannelsSection } from './ChannelsSection'
import { GeneralSection } from './GeneralSection'
import { IntegrationsSection } from './IntegrationsSection'
import { NotificationsSection } from './NotificationsSection'
import { settingsGroups, useSettingsParam, type SettingsSection } from './sections'
import { TeamSection } from './TeamSection'

/**
 * Settings, as a modal over the page you were on: a title row, the sections
 * down the left, the open one on the right, the way the Claude desktop app
 * lays its settings out. Code-first, no Figma frame. The shell renders it, and
 * `?settings=<section>` opens it from anywhere (`sections.ts`).
 *
 * The rail is `NavItem`s in `SideNav.Section`s, the app's own nav rows, with
 * `aria-current` on the open section. Below the dialog's `md` the rail would
 * take half a phone, so it becomes a Select above the section.
 *
 * Preferences and the team are held here rather than in their sections, so a
 * switch flipped on Notifications or an invite sent on Team is still there
 * after a visit to another section, and after closing and reopening. The
 * theme is the shell's, so General's switch is the same one as the rail's.
 */
export function SettingsDialog({
  theme,
  onThemeChange,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  const { section: open, show, close } = useSettingsParam()
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [team, setTeam] = useState(initialTeam)
  // The dialog keeps showing the last section while it fades out.
  const [last, setLast] = useState(open)
  if (open && open !== last) setLast(open)
  const section = open ?? last

  // A link inside a section (Team's "Go to Billing") unmounts itself, so
  // focus goes to the new section's heading instead of falling to <body>.
  const body = useRef<HTMLDivElement>(null)
  // The URL catches up a render later, so this waits for the section to be the one asked for.
  const [focusOn, setFocusOn] = useState<SettingsSection['id'] | null>(null)
  const goTo = useCallback(
    (id: SettingsSection['id']) => {
      show(id)
      setFocusOn(id)
    },
    [show],
  )
  useEffect(() => {
    if (!focusOn || section?.id !== focusOn) return
    body.current?.querySelector<HTMLElement>('h3')?.focus()
    setFocusOn(null)
  }, [focusOn, section?.id])

  return (
    <Dialog open={open !== undefined} onOpenChange={(next) => !next && close()}>
      {/* h-180 = 720, tall enough that switching section never resizes the dialog. */}
      <Dialog.Popup width={960} className="h-180 gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-surface-border px-4 py-3">
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.Close />
        </div>
        {section ? (
          <div className="flex min-h-0 flex-1 max-md:flex-col">
            <nav
              aria-label="Settings"
              className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-surface-border p-3 max-md:hidden"
            >
              {settingsGroups.map((group) => (
                <SideNav.Section key={group.label} header={group.label}>
                  {group.sections.map((item) => (
                    <NavItem
                      key={item.id}
                      startIcon={item.icon}
                      selected={item.id === section.id}
                      onClick={() => show(item.id)}
                    >
                      {item.label}
                    </NavItem>
                  ))}
                </SideNav.Section>
              ))}
            </nav>
            <div className="border-b border-surface-border p-3 md:hidden">
              <Select
                aria-label="Settings section"
                value={section.id}
                onValueChange={(value) => show(value as SettingsSection['id'])}
              >
                {settingsGroups.flatMap((group) =>
                  group.sections.map((item) => (
                    <Select.Item key={item.id} value={item.id} startIcon={item.icon}>
                      {item.label}
                    </Select.Item>
                  )),
                )}
              </Select>
            </div>
            {/* Keyed so each section opens at its top, not at the last one's scroll. */}
            <Dialog.Body
              key={section.id}
              ref={body}
              className="@container/settings m-0 flex-1 px-6 py-6 md:px-8"
            >
              {section.id === 'general' ? (
                <GeneralSection
                  preferences={preferences}
                  onPreferencesChange={setPreferences}
                  theme={theme}
                  onThemeChange={onThemeChange}
                />
              ) : section.id === 'notifications' ? (
                <NotificationsSection
                  preferences={preferences}
                  onPreferencesChange={setPreferences}
                />
              ) : section.id === 'channels' ? (
                <ChannelsSection />
              ) : section.id === 'team' ? (
                <TeamSection
                  team={team}
                  onTeamChange={setTeam}
                  onShowBilling={() => goTo('billing')}
                />
              ) : section.id === 'billing' ? (
                <BillingSection seatsUsed={team.length} />
              ) : section.id === 'integrations' ? (
                <IntegrationsSection />
              ) : (
                <ChangelogSection />
              )}
            </Dialog.Body>
          </div>
        ) : null}
      </Dialog.Popup>
    </Dialog>
  )
}
