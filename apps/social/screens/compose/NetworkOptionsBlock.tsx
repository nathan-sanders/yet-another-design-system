import { useState, type ReactNode } from 'react'
import { Link, MapPin, MessageSquare, Pencil, Plus, Tag, type LucideIcon } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Divider } from '../../../../src/components/Divider'
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
  // `_Composer Option Row`: 40 tall, 8 above and below, the label semibold
  // beside its 16 mark, the value or the action at the end.
  return (
    <div className="flex min-h-10 items-center gap-2 py-2">
      <Icon aria-hidden className="size-4 shrink-0 text-content-primary" />
      <Text render={<span />} weight="semibold" color="emphasized" className="shrink-0">
        {label}
      </Text>
      <span className="flex-1" />
      {children}
    </div>
  )
}

/**
 * What a network adds on top of the caption (`Block / Instagram options`,
 * `40006019:30966`): the first comment, with its text and an Edit to change
 * it, then Location, Tag products and Link in bio, each with an Add that is
 * not built, a Divider between the rows. The block is named for the network
 * whose tab is open; the options are Instagram's whichever it is — the
 * others have no frame yet (FINDINGS 150).
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
      {/* The slot's own padding is 0/16/8/16 in the file: the rows carry the vertical room. */}
      <ContentBlock.Content className="flex flex-col gap-1 pt-0 pb-2">
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
              <Button appearance="ghost" size="small" startIcon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
            </>
          ) : (
            <Button appearance="secondary" size="small" startIcon={Plus} onClick={() => setEditing(true)}>
              Add
            </Button>
          )}
        </Row>
        <Divider />
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
        <Divider />
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
        <Divider />
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
