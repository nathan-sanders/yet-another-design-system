import { useState } from 'react'
import { ArrowRight, CircleUser, Target, Users } from 'lucide-react'

import { Badge } from '../../../../../src/components/Badge'
import { Button } from '../../../../../src/components/Button'
import { Card } from '../../../../../src/components/Card'
import { Dialog } from '../../../../../src/components/Dialog'
import { Icon } from '../../../../../src/components/Icon'
import { Heading, Text } from '../../../../../src/components/Text'
import { TextArea } from '../../../../../src/components/TextArea'
import { ProjectNameCell } from '../../../components/ProjectCells'
import { PropertyRow } from '../../../components/PropertyRow'
import { day, shortDate } from '../../../data/dates'
import { personFor } from '../../../data/people'
import type { Project } from '../../../data/types'
import { applyChange, impactsOf, ownersToNotify, type StagedChange } from './model'

/**
 * Apply changes (`Plan - Roadmap / Apply changes`, `40006297:29985`): what
 * each staged change does, before and after; what it does beyond its own bar
 * — a goal it now misses, a team month it eases — with a Badge saying which
 * way; who hears about it; a note for them; then Keep editing and Apply.
 */
export function ApplyChangesDialog({
  open,
  projects,
  staged,
  onClose,
  onApply,
}: {
  open: boolean
  projects: Project[]
  staged: StagedChange[]
  onClose: () => void
  onApply: (note: string) => void
}) {
  const [note, setNote] = useState('')
  const impacts = impactsOf(projects, staged)
  const owners = ownersToNotify(projects, staged).map((id) => personFor(id).name)
  const count = staged.length

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>
            Apply {count} change{count === 1 ? '' : 's'}
          </Dialog.Title>
          <Dialog.Close />
        </div>
        <Dialog.Body className="flex flex-col gap-4">
          <Heading level={3} size="base" weight="semibold">
            Changes
          </Heading>
          <ul className="flex flex-col gap-1">
            {staged.map((change) => {
              const project = projects.find((p) => p.id === change.projectId)!
              const after = applyChange(project, change)
              const [from, to] =
                change.kind === 'owner'
                  ? [personFor(project.ownerId).name, personFor(after.ownerId).name]
                  : [shortDate.format(day(project.due)), shortDate.format(day(after.due))]
              return (
                <li
                  key={`${change.projectId}-${change.kind}`}
                  className="flex items-center gap-2 py-1"
                >
                  <span className="min-w-0 flex-1">
                    <ProjectNameCell project={project} />
                  </span>
                  <Text render={<span />} size="sm" color="subtle">
                    {from}
                  </Text>
                  <Icon icon={ArrowRight} size="small" label="to" />
                  <Text render={<span />} size="sm" weight="semibold" color="emphasized">
                    {to}
                  </Text>
                </li>
              )
            })}
          </ul>

          {impacts.length > 0 ? (
            <>
              <Heading level={3} size="base" weight="semibold">
                What this changes
              </Heading>
              <Card emphasis="subtle" className="shrink-0">
                <ul className="flex flex-col gap-2">
                  {impacts.map((impact) => (
                    <li key={impact.text} className="flex items-center gap-2">
                      <Icon icon={impact.kind === 'goal' ? Target : Users} />
                      <Text render={<span />} className="min-w-0 flex-1">
                        {impact.text}
                      </Text>
                      <Badge color={impact.badge.color}>{impact.badge.label}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : null}

          <Heading level={3} size="base" weight="semibold">
            Who hears about it
          </Heading>
          <dl className="flex flex-col">
            <PropertyRow icon={CircleUser} label="Owners">
              {owners.join(', ')}
            </PropertyRow>
          </dl>
          <TextArea
            aria-label="Note for the owners"
            placeholder="Add a note for the owners…"
            value={note}
            onValueChange={(value) => setNote(String(value))}
          />
        </Dialog.Body>
        <div className="flex justify-end gap-2 pt-4">
          <Button appearance="ghost" onClick={onClose}>
            Keep editing
          </Button>
          <Button
            appearance="primary"
            onClick={() => {
              onApply(note)
              setNote('')
            }}
          >
            Apply changes
          </Button>
        </div>
      </Dialog.Popup>
    </Dialog>
  )
}
