import { useState, type FormEvent } from 'react'

import { Button } from '../../../../src/components/Button'
import { DateInput } from '../../../../src/components/Calendar'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Select } from '../../../../src/components/Select'
import { Text } from '../../../../src/components/Text'
import { addDays, today } from '../../data/dates'
import { me, people } from '../../data/people'

export interface NewTaskFields {
  title: string
  assigneeId: string
  due: Date
}

/**
 * Create task from a doc's paragraph bar. The file draws the button and not
 * what follows it, so this is the Accept dialog's task fields — name,
 * assignee, due — with the selected words as the name. The task joins the
 * doc's project and is linked to the doc, its Token at the end of the line.
 */
export function CreateTaskDialog({
  seed,
  projectName,
  onClose,
  onCreate,
}: {
  /** The words to start the name from; the dialog is open while there are some. */
  seed?: string
  projectName: string
  onClose: () => void
  onCreate: (fields: NewTaskFields) => void
}) {
  // Kept after the dialog closes, so it keeps its title while it fades.
  const [shown, setShown] = useState(seed)
  if (seed !== undefined && seed !== shown) setShown(seed)
  return (
    <Dialog
      open={seed !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        {shown !== undefined ? (
          <CreateTaskForm
            key={shown}
            seed={shown}
            projectName={projectName}
            onClose={onClose}
            onCreate={onCreate}
          />
        ) : null}
      </Dialog.Popup>
    </Dialog>
  )
}

const peopleItems = people.map((p) => ({ value: p.id, label: p.name }))

function CreateTaskForm({
  seed,
  projectName,
  onClose,
  onCreate,
}: {
  seed: string
  projectName: string
  onClose: () => void
  onCreate: (fields: NewTaskFields) => void
}) {
  const [title, setTitle] = useState(seed)
  const [assigneeId, setAssigneeId] = useState(me.id)
  const [due, setDue] = useState<Date | null>(() => addDays(today, 7))
  const [submitted, setSubmitted] = useState(false)
  const titleMissing = !title.trim()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (titleMissing || !due) return
    onCreate({ title: title.trim(), assigneeId, due })
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title>Create task</Dialog.Title>
        <Dialog.Close />
      </div>
      <Dialog.Body className="flex flex-col gap-4">
        <Text size="sm" color="subtle">
          In {projectName}, linked to this doc
        </Text>
        <Field
          label="Task name"
          invalid={submitted && titleMissing}
          error={submitted && titleMissing ? 'Give the task a name.' : undefined}
        >
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            invalid={submitted && !due}
            error={submitted && !due ? 'Pick a due date.' : undefined}
          >
            <DateInput value={due} onValueChange={setDue} />
          </Field>
        </div>
      </Dialog.Body>
      <div className="flex justify-end gap-2 pt-4">
        <Button appearance="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button appearance="primary" type="submit">
          Create task
        </Button>
      </div>
    </form>
  )
}
