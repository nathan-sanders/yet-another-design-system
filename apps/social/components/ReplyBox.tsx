import { useState, type FormEvent } from 'react'
import { Bot, Ellipsis, FileLock, Image, RefreshCw, Smile, X } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { Icon } from '../../../src/components/Icon'
import { InputGroup } from '../../../src/components/Input'
import { Select } from '../../../src/components/Select'
import { Text } from '../../../src/components/Text'
import { profiles } from '../data/posts'
import type { Network } from '../data/types'
import { NetworkIcon } from './NetworkIcon'

export type ReplyMode = 'reply' | 'note'

/**
 * The reply composer — Figma's `Reply Box` (`40005911:33731`), an Input Group
 * with both slots stacked. On top: which account answers and where the reply
 * lands, then Yak's drafted reply with try again, send and dismiss. In the
 * middle, the field. Underneath, the attachments row and Reply.
 *
 * An `InputGroup` rather than a `ChatComposer`, because the file builds it from
 * one and because ChatComposer has no top slot to hold the account and the
 * draft. In `note` mode the account and the draft go: an internal note is
 * written by a teammate, to teammates.
 *
 * `rounded-xl` and `shadow-medium` give it the Yak composer's 16px corners and
 * elevation (`YakComposer`, which gets its shadow from ChatComposer).
 *
 * It answers a network and a handle rather than a ticket, so a mention in
 * Measure gets the same box as a conversation in Engage.
 */
export function ReplyBox({
  network,
  handle,
  drafts = [],
  mode = 'reply',
  savedReplies = true,
  autoFocus,
  onSend,
  onNotBuilt,
  className,
}: {
  network: Network
  /** Who the reply answers, without the @. */
  handle: string
  /** Yak's drafted replies, offered one at a time. */
  drafts?: string[]
  mode?: ReplyMode
  /** Saved replies are an Engage tool; a mention's reply goes without. */
  savedReplies?: boolean
  autoFocus?: boolean
  /** Fires with the text of a reply or note, never blank. */
  onSend: (body: string, mode: ReplyMode) => void
  onNotBuilt: (what: string) => void
  className?: string
}) {
  const accounts = profiles.filter((p) => p.network === network)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [text, setText] = useState('')
  const [draftIndex, setDraftIndex] = useState(0)
  const [draftDismissed, setDraftDismissed] = useState(false)

  const draft = mode === 'reply' && !draftDismissed ? drafts[draftIndex % drafts.length] : undefined
  const note = mode === 'note'

  const send = (body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return
    onSend(trimmed, mode)
    setText('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(text)
  }

  return (
    <form
      onSubmit={submit}
      aria-label={note ? 'Internal note' : `Reply to @${handle}`}
      className={className}
    >
      {/* `ring="input"`: the box holds a Select and seven buttons, each with a
          ring of its own, so the box's ring is scoped to the caret. */}
      <InputGroup size="large" ring="input" className="flex-col items-stretch rounded-xl shadow-medium">
        {note ? null : (
          <InputGroup.Addon align="block-start" className="flex-col items-stretch gap-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <NetworkIcon network={network} />
              {accounts.length ? (
                <Select
                  size="small"
                  hug
                  aria-label="Reply from"
                  value={accountId}
                  onValueChange={(value) => setAccountId(value as string)}
                  items={accounts.map((a) => ({ value: a.id, label: a.name }))}
                >
                  {accounts.map((a) => (
                    <Select.Item key={a.id} value={a.id}>
                      {a.name}
                    </Select.Item>
                  ))}
                </Select>
              ) : null}
              <Text render={<span />} size="sm" color="primary" truncate>
                Public reply to @{handle}
              </Text>
            </div>
            {draft ? (
              <section
                aria-label="Yak's drafted reply"
                className="flex flex-col gap-1 rounded-md bg-surface-background-subtle px-3 pt-2 pb-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Icon icon={Bot} size="base" className="text-content-primary" />
                  <Text render={<span />} weight="semibold" className="min-w-0 flex-1" truncate>
                    Yak drafted a reply
                  </Text>
                  {drafts.length > 1 ? (
                    <Button
                      appearance="ghost"
                      size="small"
                      startIcon={RefreshCw}
                      aria-label="Try again"
                      onClick={() => setDraftIndex((i) => i + 1)}
                    />
                  ) : null}
                  <Button
                    appearance="primary"
                    size="small"
                    onClick={() => {
                      send(draft)
                      setDraftDismissed(true)
                    }}
                  >
                    Send reply
                  </Button>
                  <Button
                    appearance="ghost"
                    size="small"
                    startIcon={X}
                    aria-label="Dismiss draft"
                    onClick={() => setDraftDismissed(true)}
                  />
                </div>
                <Text aria-live="polite">{draft}</Text>
              </section>
            ) : null}
          </InputGroup.Addon>
        )}
        <InputGroup.Input
          aria-label={note ? 'Note to your team' : 'Reply'}
          placeholder={note ? 'Leave a note for your team. @mention to notify' : 'Continue the conversation…'}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          autoFocus={autoFocus}
        />
        <InputGroup.Addon align="block-end" className="gap-4 py-3">
          <div className="flex flex-1 items-center gap-4">
            <Button
              appearance="ghost"
              startIcon={Image}
              aria-label="Add an image"
              onClick={() => onNotBuilt('Images')}
            />
            <Button
              appearance="ghost"
              startIcon={Smile}
              aria-label="Emoji"
              onClick={() => onNotBuilt('Emoji')}
            />
            {savedReplies ? (
              <Button
                appearance="ghost"
                startIcon={FileLock}
                aria-label="Saved replies"
                onClick={() => onNotBuilt('Saved replies')}
              />
            ) : null}
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More options"
              onClick={() => onNotBuilt('More reply options')}
            />
          </div>
          {/* Disabled while the field is blank, as the file draws it. */}
          <Button type="submit" appearance="primary" disabled={!text.trim()}>
            {note ? 'Add note' : 'Reply'}
          </Button>
        </InputGroup.Addon>
      </InputGroup>
    </form>
  )
}
