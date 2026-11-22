import { useMemo, useState, type FormEvent } from 'react'
import { Eye, FileText } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { DateInput } from '../../../../src/components/Calendar'
import { Combobox, type ComboboxValue } from '../../../../src/components/Combobox'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { Text } from '../../../../src/components/Text'
import { TextArea } from '../../../../src/components/TextArea'
import { Token } from '../../../../src/components/Token'
import { PRIORITY } from '../../components/taskMeta'
import { PriorityMark } from '../../components/TaskTokens'
import { datedText, day } from '../../data/dates'
import { people, personFor } from '../../data/people'
import { projects } from '../../data/projects'
import type { IntakeRequest, RequestRouting } from '../../data/requests'
import type { Task, TaskPriority } from '../../data/types'
import { YakMark } from '../../yak/YakMark'
import { taskKey } from '../project/paths'
import { answersLine, firstName } from './model'

type Mode = 'task' | 'project' | 'existing'

/** What Accept settles on: a new task from these fields, or an open task to add the request to. */
export type Acceptance =
  | { mode: 'task'; routing: RequestRouting; taskName: string; due: Date; reply: string }
  | { mode: 'existing'; taskId: string; reply: string }

export function AcceptDialog({
  request,
  routing,
  tasks,
  onClose,
  onAccept,
}: {
  /** The request being accepted; the dialog is open while there is one. */
  request?: IntakeRequest
  routing?: RequestRouting
  tasks: Task[]
  onClose: () => void
  onAccept: (acceptance: Acceptance) => void
}) {
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        {request && routing ? (
          <AcceptForm
            request={request}
            routing={routing}
            tasks={tasks}
            onClose={onClose}
            onAccept={onAccept}
          />
        ) : null}
      </Dialog.Popup>
    </Dialog>
  )
}

/**
 * Accept request (`Requests - Accept`, `40006300:30817`, 600 wide): the
 * request and who sent it, a Segment Control — New task, New project, Add to
 * a task — then the task's name, Project and Assignee, Due and Priority, two
 * across at 278; what comes along (the answers as the description, the
 * sender as a follower); the reply Yak drafted, which you can rewrite; and
 * Cancel beside "Accept and notify Priya".
 *
 * New task makes a real task in the project. Add to a task folds the request
 * into one already open, as Possible duplicate's Merge does. New project is
 * drawn as a segment and nothing more, so it says it is not built.
 */
function AcceptForm({
  request,
  routing,
  tasks,
  onClose,
  onAccept,
}: {
  request: IntakeRequest
  routing: RequestRouting
  tasks: Task[]
  onClose: () => void
  onAccept: (acceptance: Acceptance) => void
}) {
  const first = firstName(request.fromId)
  const [mode, setMode] = useState<Mode>(request.duplicateOf ? 'existing' : 'task')
  const [taskName, setTaskName] = useState(routing.taskName)
  const [projectId, setProjectId] = useState(routing.projectId)
  const [assigneeId, setAssigneeId] = useState(routing.assigneeId)
  const [due, setDue] = useState<Date | null>(() => day(routing.due))
  const [priority, setPriority] = useState<TaskPriority>(routing.priority)
  const [reply, setReply] = useState(() => datedText(routing.reply))
  const [submitted, setSubmitted] = useState(false)

  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done')
        .map((t) => ({ value: t.id, label: `${taskKey(t)} · ${t.title}` })),
    [tasks],
  )
  const [existing, setExisting] = useState(
    () => openTasks.find((item) => item.value === request.duplicateOf) ?? null,
  )

  const projectItems = projects.map((p) => ({ value: p.id, label: p.name }))
  const peopleItems = people.map((p) => ({ value: p.id, label: p.name }))
  const priorityItems = [...PRIORITY].reverse().map((p) => ({ value: p.value, label: p.label }))

  const nameMissing = taskName.trim() === ''
  const dueMissing = due === null
  const taskMissing = existing === null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (mode === 'task') {
      if (nameMissing || dueMissing) return
      onAccept({
        mode: 'task',
        routing: { ...routing, projectId, assigneeId, priority },
        taskName: taskName.trim(),
        due: due!,
        reply,
      })
    } else if (mode === 'existing') {
      if (taskMissing) return
      onAccept({ mode: 'existing', taskId: String(existing!.value), reply })
    }
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title>Accept request</Dialog.Title>
        <Dialog.Close />
      </div>
      <Dialog.Body className="flex flex-col gap-4">
        <Text size="sm" color="subtle">
          {request.title} · from {personFor(request.fromId).name}
        </Text>
        <SegmentedControl
          aria-label="Accept as"
          appearance="secondary"
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="self-start"
        >
          <SegmentedControl.Item value="task">New task</SegmentedControl.Item>
          <SegmentedControl.Item value="project">New project</SegmentedControl.Item>
          <SegmentedControl.Item value="existing">Add to a task</SegmentedControl.Item>
        </SegmentedControl>

        {mode === 'task' ? (
          <>
            <Field
              label="Task name"
              invalid={submitted && nameMissing}
              error={submitted && nameMissing ? 'Give the task a name.' : undefined}
            >
              <Input value={taskName} onChange={(event) => setTaskName(event.target.value)} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Project" nativeLabel={false}>
                <Select
                  value={projectId}
                  onValueChange={(v) => setProjectId(String(v))}
                  items={projectItems}
                >
                  {projectItems.map((item) => (
                    <Select.Item key={item.value} value={item.value}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select>
              </Field>
              <Field label="Assignee" nativeLabel={false}>
                <Select
                  value={assigneeId}
                  onValueChange={(v) => setAssigneeId(String(v))}
                  items={peopleItems}
                >
                  {peopleItems.map((item) => (
                    <Select.Item key={item.value} value={item.value}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select>
              </Field>
              <Field
                label="Due"
                invalid={submitted && dueMissing}
                error={submitted && dueMissing ? 'Pick a due date.' : undefined}
              >
                <DateInput value={due} onValueChange={setDue} />
              </Field>
              <Field label="Priority" nativeLabel={false}>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  {priorityItems.map((item) => (
                    <Select.Item
                      key={item.value}
                      value={item.value}
                      startIcon={<PriorityMark priority={item.value} size="base" />}
                    >
                      {item.label}
                    </Select.Item>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        ) : mode === 'existing' ? (
          <Field
            label="Task"
            description="The request’s answers go on the task, and its owner hears about it."
            invalid={submitted && taskMissing}
            error={submitted && taskMissing ? 'Pick the task to add it to.' : undefined}
          >
            <Combobox
              items={openTasks}
              value={existing}
              onValueChange={(value: ComboboxValue) =>
                setExisting(
                  value && !Array.isArray(value)
                    ? (openTasks.find((item) => item.value === value.value) ?? null)
                    : null,
                )
              }
              placeholder="Find a task…"
            />
          </Field>
        ) : (
          <Text color="subtle">
            Starting a project from a request isn’t built in this mock. Accept it as a task, or add
            it to one that’s open.
          </Text>
        )}

        {mode !== 'project' ? (
          <>
            <div className="flex flex-wrap items-center gap-1">
              <Text render={<span />} size="sm" color="subtle">
                Also added:
              </Text>
              <Token startIcon={FileText}>{answersLine(request.answers)}</Token>
              <Token startIcon={Eye}>{first} as a follower</Token>
            </div>
            {/* The file's Reply head: the label, then Yak's mark and "Drafted by
                Yak" at the far end, which is part of the field's name. */}
            <Field
              label={
                <span className="flex w-full items-center gap-2">
                  <span className="flex-1">Reply to {first}</span>
                  <YakMark className="size-4 text-content-primary" />
                  <span className="text-sm font-normal text-content-subtle">
                    <span className="sr-only">, </span>Drafted by Yak
                  </span>
                </span>
              }
            >
              <TextArea value={reply} onValueChange={(next) => setReply(String(next))} />
            </Field>
          </>
        ) : null}
      </Dialog.Body>
      <div className="flex justify-end gap-2 pt-4">
        <Button appearance="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button appearance="primary" type="submit" disabled={mode === 'project'}>
          {mode === 'existing' ? `Add and notify ${first}` : `Accept and notify ${first}`}
        </Button>
      </div>
    </form>
  )
}
