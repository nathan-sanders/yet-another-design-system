import { useState, type ReactNode } from 'react'
import { Link, MapPin, MessageSquare, Pencil, Plus, Tag, type LucideIcon } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Input } from '../../../../src/components/Input'
import { Text } from '../../../../src/components/Text'
import { NETWORK_NAMES, type Network } from '../../data/types'
import { useShell } from '../../shell/ShellContext'

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-10 items-center gap-2 border-b border-surface-border py-1 last:border-b-0">
      <Icon aria-hidden className="size-4 shrink-0 text-content-primary" />
      <Text render={<span />} className="shrink-0">
        {label}
      </Text>
      <span className="flex-1" />
      {children}
    </div>
  )
}

/**
 * What a network adds on top of the caption (`40006009:29479`, the
 * `Instagram options` block): the first comment, with its text and a pencil
 * to change it, then Location, Tag products and Link in bio, each with an
 * Add that is not built. The block is named for the network whose tab is
 * open; the options are Instagram's whichever it is — the others have no
 * frame yet (FINDINGS 150).
 */
export function NetworkOptionsBlock({
  network,
  firstComment,
  onFirstCommentChange,
}: {
  network: Network | null
  firstComment: string
  onFirstCommentChange: (value: string) => void
}) {
  const shell = useShell()
  const [editing, setEditing] = useState(false)
  const name = NETWORK_NAMES[network ?? 'instagram']
  return (
    <ContentBlock>
      <ContentBlock.Header>{`${name} options`}</ContentBlock.Header>
      <ContentBlock.Content className="flex flex-col">
        <Row icon={MessageSquare} label="First comment">
          {editing ? (
            <Input
              size="small"
              autoFocus
              value={firstComment}
              onChange={(event) => onFirstCommentChange(event.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') setEditing(false)
              }}
              aria-label="First comment"
              className="w-72 max-w-full"
            />
          ) : firstComment ? (
            <>
              <Text render={<span />} size="sm" color="subtle" truncate className="min-w-0">
                {firstComment}
              </Text>
              <Button
                appearance="ghost"
                size="small"
                startIcon={Pencil}
                aria-label="Edit the first comment"
                onClick={() => setEditing(true)}
              />
            </>
          ) : (
            <Button appearance="secondary" size="small" startIcon={Plus} onClick={() => setEditing(true)}>
              Add
            </Button>
          )}
        </Row>
        <Row icon={MapPin} label="Location">
          <Button
            appearance="secondary"
            size="small"
            startIcon={Plus}
            onClick={() => shell.notBuilt('Locations')}
          >
            Add
          </Button>
        </Row>
        <Row icon={Tag} label="Tag products">
          <Button
            appearance="secondary"
            size="small"
            startIcon={Plus}
            onClick={() => shell.notBuilt('Product tags')}
          >
            Add
          </Button>
        </Row>
        <Row icon={Link} label="Link in bio">
          <Button
            appearance="secondary"
            size="small"
            startIcon={Plus}
            onClick={() => shell.notBuilt('Link in bio')}
          >
            Add
          </Button>
        </Row>
      </ContentBlock.Content>
    </ContentBlock>
  )
}
