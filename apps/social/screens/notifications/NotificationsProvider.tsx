import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { seedNotifications } from '../../data/notifications'
import { NotificationsContext, type NotificationsState } from './notificationsState'

/** Holds the notification feed for the session. See `notificationsState.ts`. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(seedNotifications)

  const markRead = useCallback((ids: readonly string[]) => {
    setNotifications((all) => all.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((all) => all.map((n) => (n.unread ? { ...n, unread: false } : n)))
  }, [])

  const value = useMemo<NotificationsState>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => n.unread).length,
      markRead,
      markAllRead,
    }),
    [notifications, markRead, markAllRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
