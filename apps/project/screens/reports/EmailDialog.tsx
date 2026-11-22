import { useState } from 'react'

import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Combobox, type ComboboxValue } from '../../../../src/components/Combobox'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { Switch } from '../../../../src/components/Switch'
import { Text } from '../../../../src/components/Text'
import { addDays, shortDate, today } from '../../data/dates'
import { me, people } from '../../data/people'
import { CADENCE, SEND_ON } from './email'
import type { EmailCadence, EmailSchedule } from './reportsState'

const PEOPLE = people.map((p) => ({ value: p.id, label: p.name }))

/** The next day the report goes out on: the chosen weekday after today. */
function nextSend(sendOn: string): Date {
  const weekday = SEND_ON.find((o) => o.value === sendOn)?.weekday ?? 1
  let d = addDays(today, 1)
  while (d.getDay() !== weekday) d = addDays(d, 1)
  return d
}

/**
 * Email this report (`Reports - Email this report`, `40006312:47130`): Send
 * to as a tokenizer Combobox, How often as a SegmentedControl, Send on as a
 * Select, two Switches, then a preview of what lands — the report and its
 * week, and Yak's read when it starts with one. Send a test, Cancel,
 * Schedule.
 */
export function EmailDialog({
  open,
  report,
  yakRead,
  schedule,
  onClose,
  onTest,
  onSchedule,
}: {
  open: boolean
  /** The report's name: "Delivery". */
  report: string
  yakRead: string
  schedule: EmailSchedule | null
  onClose: () => void
  onTest: () => void
  onSchedule: (schedule: EmailSchedule) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        {/* Always rendered, so a closing dialog keeps its title while it fades;
            keyed on `open` so each opening starts from the schedule. */}
        {
          <EmailForm
            key={String(open)}
            report={report}
            yakRead={yakRead}
            schedule={schedule}
            onClose={onClose}
            onTest={onTest}
            onSchedule={onSchedule}
          />
        }
      </Dialog.Popup>
    </Dialog>
  )
}

function EmailForm({
  report,
  yakRead,
  schedule,
  onClose,
  onTest,
  onSchedule,
}: {
  report: string
  yakRead: string
  schedule: EmailSchedule | null
  onClose: () => void
  onTest: () => void
  onSchedule: (schedule: EmailSchedule) => void
}) {
  const [to, setTo] = useState(schedule?.to ?? [me.id, 'dana'])
  const [cadence, setCadence] = useState<EmailCadence>(schedule?.cadence ?? 'weekly')
  const [sendOn, setSendOn] = useState(schedule?.sendOn ?? 'monday-8')
  const [summary, setSummary] = useState(schedule?.summary ?? true)
  const [onlyChanged, setOnlyChanged] = useState(schedule?.onlyChanged ?? false)
  const [submitted, setSubmitted] = useState(false)
  const missing = to.length === 0

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title>Email this report</Dialog.Title>
        <Dialog.Close />
      </div>
      <Dialog.Body className="flex flex-col gap-4">
        <Field
          label="Send to"
          invalid={submitted && missing}
          error={submitted && missing ? 'Add at least one person.' : undefined}
        >
          <Combobox
            multiple
            items={PEOPLE}
            value={PEOPLE.filter((p) => to.includes(p.value))}
            onValueChange={(value: ComboboxValue) =>
              setTo(Array.isArray(value) ? value.map((v) => String(v.value)) : [])
            }
            placeholder="Add people…"
          />
        </Field>
        <Field label="How often" nativeLabel={false}>
          <SegmentedControl
            aria-label="How often"
            appearance="secondary"
            value={cadence}
            onValueChange={(v) => setCadence(v as EmailCadence)}
            className="self-start"
          >
            {(Object.keys(CADENCE) as EmailCadence[]).map((c) => (
              <SegmentedControl.Item key={c} value={c}>
                {CADENCE[c]}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>
        </Field>
        <Field label="Send on" nativeLabel={false}>
          <Select value={sendOn} onValueChange={(v) => setSendOn(String(v))} items={SEND_ON}>
            {SEND_ON.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select>
        </Field>
        {/* Inbox settings' row: the words, then the Switch named by them. */}
        <ul className="flex flex-col gap-2">
          {(
            [
              ['Start with Yak’s summary', summary, setSummary],
              ['Only send when something changed', onlyChanged, setOnlyChanged],
            ] as const
          ).map(([label, checked, set]) => (
            <li key={label} className="flex min-h-6 items-center gap-4">
              <Text render={<span />} className="min-w-0 flex-1">
                {label}
              </Text>
              <Switch aria-label={label} checked={checked} onCheckedChange={set} />
            </li>
          ))}
        </ul>
        <Card emphasis="subtle" className="gap-2" role="group" aria-label="Preview">
          <Text weight="semibold" color="emphasized">
            {`${report} report, week of ${shortDate.format(nextSend(sendOn))}`}
          </Text>
          <Text size="sm">
            {summary ? yakRead : 'The report’s charts and tables, as they stand that morning.'}
          </Text>
        </Card>
      </Dialog.Body>
      <div className="flex items-center gap-2 pt-4">
        <Button appearance="ghost" onClick={onTest}>
          Send a test
        </Button>
        <span className="flex-1" />
        <Button appearance="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          onClick={() => {
            setSubmitted(true)
            if (missing) return
            onSchedule({ to, cadence, sendOn, summary, onlyChanged })
          }}
        >
          Schedule
        </Button>
      </div>
    </>
  )
}
