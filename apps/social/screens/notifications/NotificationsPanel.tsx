import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Bell, Settings } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Panel } from '../../../../src/components/Panel'
import { Select } from '../../../../src/components/Select'
import { Text } from '../../../../src/components/Text'
import { NotificationItem } from '../../components/NotificationItem'
import type { AppNotification } from '../../data/notifications'
import { profiles } from '../../data/posts'
import { NETWORK_NAMES } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useNotifications } from './notificationsState'

const ALL = 'all'

const PROFILE_ITEMS = [
  { value: ALL, label: 'All profiles' },
  ...profiles.map((p) => ({ value: p.id, label: `${p.name} · ${NETWORK_NAMES[p.network]}` })),
]

const GROUPS = [
  { id: 'today', label: 'Today' },
  { id: 'older', label: 'Older' },
] as const

/**
 * Notifications, from the rail's bell: Figma's `Notifications - D · Activity
 * cards` (`40005993:27777`). A Panel with a settings button beside its ×, a
 * toolbar (a profile filter, Select and Mark all read), and the feed in Today
 * and Older, each row a `_Notification Item`.
 *
 * Every row goes to the thing it is about — a post on the calendar, a ticket in
 * Engage, a report — and is read once you have been. A target on another screen
 * is a navigation, which closes this panel the way leaving a screen closes any
 * panel, and can carry the panel the next screen opens with (the post beside
 * the calendar). On the screen you are already on, the URL changes in place,
 * so the shell's panel is set here.
 */
export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shell = useShell()
  const navigate = useNavigate()
  const location = useLocation()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  const [profile, setProfile] = useState<string>(ALL)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  // Select mode does not outlive the panel.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setSelecting(false)
      setSelected(new Set())
    }
  }

  const visible = notifications.filter((n) => profile === ALL || n.profileId === profile)

  const go = (notification: AppNotification) => {
    markRead([notification.id])
    const { path, panel } = notification.target
    if (!path) {
      shell.setPanel(panel ?? null)
      return
    }
    if (path.split('?')[0] === location.pathname) {
      navigate(path)
      shell.setPanel(panel ?? null)
    } else {
      navigate(path, panel ? { state: { panel } } : undefined)
    }
  }

  const toggle = (id: string, on: boolean) =>
    setSelected((all) => {
      const next = new Set(all)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }

  return (
    <Panel
      aria-label="Notifications"
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header
        icon={Bell}
        closeButton
        actions={
          <Button
            appearance="ghost"
            startIcon={Settings}
            aria-label="Notification settings"
            onClick={() => shell.notBuilt('Notification settings')}
          />
        }
      >
        Notifications
      </Panel.Header>
      {/* 4px in, so a row's focus ring has room inside the scroller; each row
          pads 4 more on the left to put the unread dot 8 in, where the file
          has it, and the toolbar and labels pad 12 to make 16. */}
      <Panel.Body className="flex flex-col px-1">
        <div className="flex items-center gap-2 px-3 pb-2">
          <Select
            size="small"
            hug
            aria-label="Profile"
            value={profile}
            onValueChange={(value) => setProfile(value as string)}
            items={PROFILE_ITEMS}
          >
            {PROFILE_ITEMS.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select>
          <span className="flex-1" />
          {selecting ? (
            <>
              <Button
                appearance="ghost"
                size="small"
                disabled={selected.size === 0}
                onClick={() => {
                  markRead([...selected])
                  stopSelecting()
                }}
              >
                {selected.size ? `Mark ${selected.size} read` : 'Mark read'}
              </Button>
              <Button appearance="ghost" size="small" onClick={stopSelecting}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                appearance="ghost"
                size="small"
                disabled={visible.length === 0}
                onClick={() => setSelecting(true)}
              >
                Select
              </Button>
              <Button
                appearance="ghost"
                size="small"
                disabled={unreadCount === 0}
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            </>
          )}
        </div>

        {visible.length === 0 ? (
          <Text size="sm" color="subtle" className="px-3 py-6 text-center">
            No notifications for this profile.
          </Text>
        ) : (
          GROUPS.map((group) => {
            const rows = visible.filter((n) => n.group === group.id)
            if (rows.length === 0) return null
            const headingId = `notifications-${group.id}`
            return (
              <section key={group.id} aria-labelledby={headingId}>
                <Text
                  id={headingId}
                  render={<h3 />}
                  size="sm"
                  weight="semibold"
                  color="subtle"
                  // The file's label is 32 tall on 12 above and 4 below a
                  // 20px line: the 4 is drawn inside the row's own 12.
                  className="px-3 pt-3"
                >
                  {group.label}
                </Text>
                <ul className="flex flex-col">
                  {rows.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        onOpen={() => go(notification)}
                        selecting={selecting}
                        selected={selected.has(notification.id)}
                        onSelectedChange={(on) => toggle(notification.id, on)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </Panel.Body>
    </Panel>
  )
}
