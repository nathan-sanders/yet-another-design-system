import { useLocation, useNavigate } from 'react-router'

import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import { NETWORK_NAMES } from '../data/types'
import { composePath } from '../screens/compose/paths'
import { useYakChat, type Turn } from './chat'
import type { ReplyBubble } from './replies'

const LIMITS: Partial<Record<string, number>> = { instagram: 2200, threads: 500, x: 280 }

/**
 * A caption Yak proposes, as Nathan drew the reply (`40006040:31176`): a
 * Subtle Card between the prose bubbles with its actions inside it. Beside
 * an open composer the primary is "Apply to Threads", and once applied the
 * card offers Undo and a shorter cut; anywhere else it opens the composer
 * with the text already in. The text lives on the turn; what has been
 * applied lives on the chat, so the composer can watch it (`chat.ts`).
 */
export function CaptionCard({
  turn,
  bubble,
}: {
  turn: Turn
  bubble: Extract<ReplyBubble, { kind: 'caption' }>
}) {
  const chat = useYakChat()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const applied = chat.applied.find((a) => a.turnId === turn.id && a.kind === 'caption')
  const text = applied?.text ?? bubble.text
  const canApply = chat.composeTarget?.networks.includes(bubble.network) ?? false
  const limit = LIMITS[bubble.network]
  const onIdea = pathname.match(/^\/plan\/ideas\/([^/]+)/)?.[1]
  const name = NETWORK_NAMES[bubble.network]

  const open = () => {
    const from = pathname + search
    const prefill = { captions: { [bubble.network]: bubble.text } }
    navigate(onIdea && onIdea !== 'new' ? composePath({ idea: onIdea, from }) : composePath({ from }), {
      state: { prefill },
    })
  }

  return (
    <Card emphasis="subtle" padding={3} className="flex flex-col gap-2">
      <Text size="xs" color="subtle">
        {name}
        {limit ? ` · ${text.length} / ${limit}` : ''}
      </Text>
      <Text className="whitespace-pre-line">{text}</Text>
      <div className="flex flex-wrap gap-2 pt-1">
        {applied ? (
          <>
            <Button appearance="secondary" size="small" onClick={() => chat.unapply(applied.id)}>
              Undo
            </Button>
            {bubble.shorter && applied.text !== bubble.shorter ? (
              <Button
                appearance="ghost"
                size="small"
                onClick={() => {
                  chat.unapply(applied.id)
                  chat.apply({ ...applied, text: bubble.shorter! })
                }}
              >
                Shorten more
              </Button>
            ) : null}
          </>
        ) : canApply ? (
          <Button
            appearance="secondary"
            size="small"
            onClick={() =>
              chat.apply({ turnId: turn.id, kind: 'caption', network: bubble.network, text: bubble.text })
            }
          >
            Apply to {name}
          </Button>
        ) : (
          <Button appearance="secondary" size="small" onClick={open}>
            {onIdea ? 'Make a post with this' : 'Open composer'}
          </Button>
        )}
      </div>
    </Card>
  )
}
