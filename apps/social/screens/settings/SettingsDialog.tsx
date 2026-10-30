import { useState } from 'react'
import { Construction } from 'lucide-react'

import { Dialog } from '../../../../src/components/Dialog'
import { Icon } from '../../../../src/components/Icon'
import { NavItem, SideNav } from '../../../../src/components/Nav'
import { Select } from '../../../../src/components/Select'
import { Heading, Text } from '../../../../src/components/Text'
import { ChangelogSection } from './ChangelogSection'
import { settingsGroups, useSettingsParam, type SettingsSection } from './sections'

/**
 * Settings, as a modal over the page you were on: a title row, the sections
 * down the left, the open one on the right, the way the Claude desktop app
 * lays its settings out. Code-first, no Figma frame. The shell renders it, and
 * `?settings=<section>` opens it from anywhere (`sections.ts`).
 *
 * The rail is `NavItem`s in `SideNav.Section`s, the app's own nav rows, with
 * `aria-current` on the open section. Below the dialog's `md` the rail would
 * take half a phone, so it becomes a Select above the section.
 */
export function SettingsDialog() {
  const { section: open, show, close } = useSettingsParam()
  // The dialog keeps showing the last section while it fades out.
  const [last, setLast] = useState(open)
  if (open && open !== last) setLast(open)
  const section = open ?? last

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
            <Dialog.Body className="@container/settings m-0 flex-1 px-6 py-6 md:px-8">
              {section.id === 'changelog' ? (
                <ChangelogSection />
              ) : (
                <NotDesignedSection section={section} />
              )}
            </Dialog.Body>
          </div>
        ) : null}
      </Dialog.Popup>
    </Dialog>
  )
}

/** `NotBuilt`'s "Not designed yet", at a section's size rather than a page's. */
function NotDesignedSection({ section }: { section: SettingsSection }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-subtle">
        <Icon icon={Construction} size="x-large" />
      </span>
      <Heading level={3} size="lg" weight="semibold">
        {section.label}
      </Heading>
      <Text color="subtle" className="max-w-sm">
        {section.label} has a place in Settings and no design yet. The changelog is the first page
        built here.
      </Text>
    </div>
  )
}
