import { useId } from 'react'

import { Avatar } from '../../../src/components/Avatar'
import { ClickableCard } from '../../../src/components/Card'
import { Checkbox } from '../../../src/components/Checkbox'
import { Icon } from '../../../src/components/Icon'
import { Text } from '../../../src/components/Text'
import { KIND_ICON, type AppNotification } from '../data/notifications'
import { YakMark } from '../yak/YakMark'
import { NetworkIcon } from './NetworkIcon'

/** What the sender is called, out loud and in the name row. */
function senderName(notification: AppNotification): string {
  const { sender } = notification
  return sender.type === 'yak' ? 'Yak' : sender.name
}

/**
 * The row's accessible name, as one sentence: who, what, about what, when.
 * The card's longer line goes in the description instead.
 */
function notificationLabel(notification: AppNotification): string {
  return [
    `${senderName(notification)}: ${notification.action}`,
    notification.card.title,
    notification.spokenTime,
    ...(notification.unread ? ['Unread'] : []),
  ].join('. ')
}

/**
 * `_Notification Item` (`40005993:27689`): one notification as an activity
 * entry. Who did it — an Avatar with a Type badge, or an icon tile when no
 * person sent it — what they did, when, and the thing it happened to in a
 * subtle card underneath. Unread hides only the dot, so the gutter keeps every
 * avatar on the same line.
 *
 * The whole row is the hit target and goes to the thing the notification is
 * about. In select mode it becomes a checkbox row instead, because a checkbox
 * cannot sit inside a button.
 *
 * The hover is `Surface/Overlay Subtle`, not the ghost card's own
 * `Surface/Background Subtle`: the card inside is that color, and an opaque
 * hover would swallow it (FINDINGS 114). Table's rows hover the same way.
 */
export function NotificationItem({
  notification,
  onOpen,
  selecting = false,
  selected = false,
  onSelectedChange,
}: {
  notification: AppNotification
  onOpen: () => void
  selecting?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
}) {
  const descriptionId = useId()
  const label = notificationLabel(notification)

  // Spans throughout: all of it sits inside a <button>, which holds phrasing
  // content only.
  const body = (
    <span aria-hidden className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="flex min-w-0 items-start gap-3">
        <SenderMark notification={notification} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <Text render={<span />} size="sm" weight="semibold" truncate>
              {senderName(notification)}
            </Text>
            {notification.sender.type === 'person' && notification.sender.online ? (
              <span className="size-2 shrink-0 rounded-full bg-feedback-success-highlight" />
            ) : null}
          </span>
          <Text render={<span />} size="sm" color="subtle">
            {notification.action}
          </Text>
        </span>
        <Text render={<span />} size="sm" color="subtle" className="shrink-0 whitespace-nowrap">
          {notification.time}
        </Text>
      </span>
      <span className="flex flex-col gap-1 rounded-lg bg-surface-background-subtle px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-content-primary">
          {notification.card.network ? (
            <NetworkIcon network={notification.card.network} />
          ) : notification.card.icon ? (
            <Icon icon={notification.card.icon} />
          ) : null}
          <Text render={<span />} size="sm" weight="semibold" className="min-w-0 flex-1">
            {notification.card.title}
          </Text>
        </span>
        <Text id={descriptionId} render={<span />} size="sm" color="subtle">
          {notification.card.description}
        </Text>
      </span>
    </span>
  )

  if (selecting) {
    return (
      // The box is the control; the rest of the row toggles it too, for a
      // pointer. A keyboard reaches the box, which carries the row's name.
      <div
        className="flex cursor-pointer gap-2 rounded-md py-3 pr-3 pl-1"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('label')) return
          onSelectedChange?.(!selected)
        }}
      >
        <span className="flex h-9 w-4 shrink-0 items-center justify-center">
          <Checkbox
            aria-label={label}
            aria-describedby={descriptionId}
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange?.(checked)}
          />
        </span>
        {body}
      </div>
    )
  }

  return (
    <ClickableCard
      emphasis="ghost"
      padding={0}
      aria-label={label}
      aria-describedby={descriptionId}
      onClick={onOpen}
      className="flex-row gap-2 border-0 py-3 pr-3 pl-1 hover:bg-surface-overlay-subtle"
    >
      <span aria-hidden className="flex h-9 w-2 shrink-0 items-center justify-center">
        {notification.unread ? (
          <span className="size-2 rounded-full bg-decorative-pink-highlight" />
        ) : null}
      </span>
      {body}
    </ClickableCard>
  )
}

/** The Avatar with its Type badge, or the file's Show Icon tile in its place. */
function SenderMark({ notification }: { notification: AppNotification }) {
  const { sender } = notification
  return (
    <span className="relative size-9 shrink-0">
      {sender.type === 'person' ? (
        <Avatar name={sender.avatarName ?? sender.name} src={sender.avatar} size="base" />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-full bg-surface-background-subtle text-content-primary">
          {sender.type === 'yak' ? (
            <YakMark className="size-4" />
          ) : (
            <NetworkIcon network={sender.network} />
          )}
        </span>
      )}
      {/* Avatar has no badge slot (FINDINGS 115), so the Type badge is laid
          over it here, where the file puts it: 20px, 22 in and 20 down. */}
      <span className="absolute top-5 left-5.5 flex size-5 items-center justify-center rounded-full bg-surface-background-primary text-content-primary">
        <Icon icon={KIND_ICON[notification.kind]} size="small" />
      </span>
    </span>
  )
}
