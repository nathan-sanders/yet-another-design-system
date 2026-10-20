import { createContext, useContext } from 'react'

import type { AppNotification } from '../../data/notifications'

/**
 * The Notifications panel's feed as the session has left it. Held above the
 * routes (`NotificationsProvider` in `main.tsx`), because the rail's bell reads
 * the unread count on every screen, and a row read on one screen has to stay
 * read after the click has taken you to another.
 */
export interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (ids: readonly string[]) => void
  markAllRead: () => void
}

export const NotificationsContext = createContext<NotificationsState | null>(null)

export function useNotifications(): NotificationsState {
  const notifications = useContext(NotificationsContext)
  if (!notifications) {
    throw new Error('useNotifications needs the NotificationsProvider around it')
  }
  return notifications
}
