import { MessagesSquare } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { Tooltip } from '../../../src/components/Tooltip'
import type { MentionQuery } from '../data/mentions'
import { useMentions } from '../screens/mentions/useMentions'

/**
 * The widget header's "View messages" (`40005911:34686`): a ghost icon button
 * before the `⋯` that opens the posts behind the whole widget. Pressed while
 * its list is open; pressing it again closes the panel.
 *
 * `data-drag-ignore`, because on a report board the header is part of the
 * draggable widget, and a press here is a click, never the start of a drag.
 */
export function ViewMessagesButton({ title, query }: { title: string; query: MentionQuery }) {
  const mentions = useMentions()
  return (
    <Tooltip label="View messages">
      <Button
        appearance="ghost"
        startIcon={MessagesSquare}
        aria-label={`View messages for ${title}`}
        aria-pressed={mentions.isOpen(query.key)}
        data-drag-ignore
        onClick={() => mentions.toggle(query)}
      />
    </Tooltip>
  )
}
