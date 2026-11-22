import { useMemo, useState, type FormEvent } from 'react'
import { Bell, Repeat } from 'lucide-react'

import { Button } from '../../../../../src/components/Button'
import { DateInput } from '../../../../../src/components/Calendar'
import { Combobox, type ComboboxValue } from '../../../../../src/components/Combobox'
import { Dialog } from '../../../../../src/components/Dialog'
import { Field } from '../../../../../src/components/Field'
import { Input } from '../../../../../src/components/Input'
import { SegmentedControl } from '../../../../../src/components/SegmentedControl'
import { Select } from '../../../../../src/components/Select'
import { Heading, Text } from '../../../../../src/components/Text'
import { Toast } from '../../../../../src/components/Toast'
import { PropertyRow } from '../../../components/PropertyRow'
import { day, fileIso } from '../../../data/dates'
import type { Goal } from '../../../data/goals'
import { me, people, personFor } from '../../../data/people'
import { usePlan } from '../planState'

type Measure = 'subgoals' | 'projects' | 'tasks' | 'manual'

const MEASURES: { value: Measure; label: string }[] = [
  { value: 'subgoals', label: 'Subgoals' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'manual', label: 'Manual' },
]

/** What each way of measuring means, under the Segment Control. */
const MEASURE_NOTE: Record<Exclude<Measure, 'projects'>, string> = {
  subgoals: 'Progress averages the subgoals you add to it, and health follows the lowest one.',
  tasks:
    'Counting done tasks isn’t built in this mock, so a goal made this way is updated by hand.',
  manual: 'Its owner sets the percent and the health at each check-in.',
}

const NO_PARENT = '__none'

let made = 0

export function NewGoalDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (goal: Goal) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        {open ? <NewGoalForm onClose={onClose} onCreated={onCreated} /> : null}
      </Dialog.Popup>
    </Dialog>
  )
}

/**
 * New goal (`Plan - Goals / New goal`, `40006298:29382`): the goal, its
 * owner and due date, the goal it ladders up to, how its progress is
 * measured — with the projects it averages when that is Projects — then its
 * check-in and who is reminded. Create goal adds it to Goals and opens it.
 */
function NewGoalForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (goal: Goal) => void
}) {
  const toast = Toast.useToast()
  const plan = usePlan()
  const [title, setTitle] = useState('')
  const [ownerId, setOwnerId] = useState(me.id)
  const [due, setDue] = useState<Date | null>(() => day('2026-12-31'))
  const [parentId, setParentId] = useState(NO_PARENT)
  const [measure, setMeasure] = useState<Measure>('projects')
  const [projectIds, setProjectIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const ownerItems = people.map((p) => ({ value: p.id, label: p.name }))
  const parentItems = [
    { value: NO_PARENT, label: 'None, this is a company goal' },
    ...plan.goals.filter((g) => !g.parentId).map((g) => ({ value: g.id, label: g.title })),
  ]
  const projectItems = useMemo(
    () => plan.projects.map((p) => ({ value: p.id, label: p.name })),
    [plan.projects],
  )
  // A stable array: Combobox matches chosen rows by identity.
  const chosen = useMemo(
    () => projectItems.filter((item) => projectIds.includes(String(item.value))),
    [projectItems, projectIds],
  )

  const titleMissing = title.trim() === ''
  const projectsMissing = measure === 'projects' && projectIds.length === 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (titleMissing || projectsMissing) return
    const parent = parentId === NO_PARENT ? undefined : plan.goals.find((g) => g.id === parentId)
    const goal: Goal = {
      id: `goal-new-${++made}`,
      title: title.trim(),
      ownerId,
      due: fileIso(due ?? day('2026-12-31')),
      parentId: parent?.id,
      projectIds: measure === 'projects' ? projectIds : undefined,
      manual:
        measure === 'tasks' || measure === 'manual'
          ? { progress: 0, health: 'not-started' }
          : undefined,
      checkIn: 'Every Friday',
      remindId: ownerId,
      portfolioId: parent?.portfolioId,
    }
    plan.addGoal(goal)
    onCreated(goal)
    toast.add({
      title: 'Goal created',
      description: `${personFor(ownerId).name.split(' ')[0]} will be asked to check in every Friday.`,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title>New goal</Dialog.Title>
        <Dialog.Close />
      </div>
      <Dialog.Body className="flex flex-col gap-4">
        <Field
          label="Goal"
          invalid={submitted && titleMissing}
          error={submitted && titleMissing ? 'Say what the goal is.' : undefined}
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Open two Florida stores"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Owner" nativeLabel={false}>
            <Select value={ownerId} onValueChange={(v) => setOwnerId(String(v))} items={ownerItems}>
              {ownerItems.map((item) => (
                <Select.Item key={item.value} value={item.value}>
                  {item.label}
                </Select.Item>
              ))}
            </Select>
          </Field>
          <Field label="Due">
            <DateInput value={due} onValueChange={setDue} />
          </Field>
        </div>
        <Field label="Parent goal" nativeLabel={false}>
          <Select
            value={parentId}
            onValueChange={(v) => setParentId(String(v))}
            items={parentItems}
          >
            {parentItems.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select>
        </Field>
        <Heading id="measure" level={3} size="base" weight="semibold">
          Measure progress from
        </Heading>
        <SegmentedControl
          aria-labelledby="measure"
          appearance="secondary"
          value={measure}
          onValueChange={(value) => setMeasure(value as Measure)}
          className="self-start"
        >
          {MEASURES.map((m) => (
            <SegmentedControl.Item key={m.value} value={m.value}>
              {m.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        {measure === 'projects' ? (
          <Field
            label="Projects"
            description="Progress averages these projects, and health follows the lowest one."
            invalid={submitted && projectsMissing}
            error={submitted && projectsMissing ? 'Pick at least one project.' : undefined}
          >
            <Combobox
              multiple
              items={projectItems}
              value={chosen}
              onValueChange={(value: ComboboxValue) =>
                setProjectIds(Array.isArray(value) ? value.map((v) => String(v.value)) : [])
              }
              placeholder="Add a project…"
            />
          </Field>
        ) : (
          <Text size="sm" color="subtle">
            {MEASURE_NOTE[measure]}
          </Text>
        )}
        <dl className="flex flex-col">
          <PropertyRow icon={Repeat} label="Check-in">
            Every Friday
          </PropertyRow>
          <PropertyRow icon={Bell} label="Remind">
            {personFor(ownerId).name}
          </PropertyRow>
        </dl>
      </Dialog.Body>
      <div className="flex justify-end gap-2 pt-4">
        <Button appearance="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button appearance="primary" type="submit">
          Create goal
        </Button>
      </div>
    </form>
  )
}
