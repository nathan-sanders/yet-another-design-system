import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Plus } from 'lucide-react'

import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { ClickableCard } from '../../../../src/components/Card'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Radio } from '../../../../src/components/Radio'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { Token } from '../../../../src/components/Token'
import { me } from '../../data/people'
import type { Report, ReportType, WidgetSources } from '../../data/types'
import { boardPath } from './model'
import { REPORT_TYPES, reportTypeFor, type ReportTypeOption } from './reportTypes'
import { useReports } from './reportsState'

const SOURCES: { value: WidgetSources; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'social', label: 'Social' },
  { value: 'news', label: 'News & web' },
]

const DELIVERY = [
  { value: 'none', label: 'Don’t send' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
]

/**
 * New report: first what kind of report, then what it tracks. Code-first —
 * the file has the list's Create custom report entry point and no flow
 * behind it. Each type opens on a board of its own (`boardFixture`), built
 * from the topics chosen here, so the numbers agree with the rest of Measure.
 *
 * Mounted once by the shell, so it opens from any page; its open state and
 * starting type are the URL's (`?new=report&type=media`).
 */
export function NewReportDialog() {
  const [params, setParams] = useSearchParams()
  const open = params.get('new') === 'report'
  const startType = reportTypeFor(params.get('type'))?.value ?? 'media'
  // A key per opening, so every opening starts on step one with fresh fields.
  const [opening, setOpening] = useState(0)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setOpening((n) => n + 1)
  }

  const close = () => {
    const next = new URLSearchParams(params)
    next.delete('new')
    next.delete('type')
    setParams(next, { replace: true })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      disablePointerDismissal
    >
      <NewReportForm key={opening} startType={startType} onClose={close} />
    </Dialog>
  )
}

function NewReportForm({ startType, onClose }: { startType: ReportType; onClose: () => void }) {
  const [step, setStep] = useState<'type' | 'setup'>('type')
  const [type, setType] = useState<ReportType>(startType)
  const option = reportTypeFor(type)!

  // The setup fields start from the type, and start again when it changes.
  const [name, setName] = useState(option.name)
  const [topics, setTopics] = useState(option.topics)
  const [sources, setSources] = useState(option.sources)
  const [delivery, setDelivery] = useState('none')
  const [pickedFor, setPickedFor] = useState(type)
  if (pickedFor !== type) {
    setPickedFor(type)
    setName(option.name)
    setTopics(option.topics)
    setSources(option.sources)
  }

  const [draftTopic, setDraftTopic] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { createReport, reports } = useReports()
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const typeLabel = useId()
  const topicsLabel = useId()
  const topicsHint = useId()

  const nameMissing = name.trim() === ''
  const topicsMissing = topics.length === 0

  const addTopic = () => {
    const topic = draftTopic.trim()
    if (topic && !topics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
      setTopics([...topics, topic])
    }
    setDraftTopic('')
  }
  const onTopicKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Enter adds the topic; it does not submit the form.
      event.preventDefault()
      addTopic()
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'type') {
      setStep('setup')
      return
    }
    setSubmitted(true)
    if (nameMissing || topicsMissing) return
    const slug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'report'
    let id = slug
    for (let n = 2; reports.some((r) => r.id === id); n += 1) id = `${slug}-${n}`
    const report: Report = {
      id,
      name: name.trim(),
      kind: option.kind,
      type,
      editedMinutes: 0,
      createdBy: me.id,
      sharedWith: { people: [me.id], more: 0 },
      ...(delivery !== 'none' && { delivery: delivery as Report['delivery'] }),
      topics,
      sources,
    }
    createReport(report)
    toast.add({ title: `Created “${report.name}”` })
    navigate(boardPath(report.id))
  }

  return (
    <Dialog.Popup width={step === 'type' ? 800 : 600}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>
            {step === 'type' ? 'New report' : `New ${option.label} report`}
          </Dialog.Title>
          <Dialog.Close />
        </div>
        <Dialog.Description>
          {step === 'type'
            ? 'Choose what kind of report to make. Each one starts with the widgets it needs, and you can change any of them.'
            : option.description}
        </Dialog.Description>

        {step === 'type' ? (
          <Dialog.Body>
            <Text id={typeLabel} render={<span />} className="sr-only">
              Report type
            </Text>
            <Radio.Group
              aria-labelledby={typeLabel}
              value={type}
              onValueChange={(value) => setType(value as ReportType)}
              className="grid grid-cols-1 gap-2 md:grid-cols-2"
            >
              {REPORT_TYPES.map((t) => (
                <TypeCard key={t.value} option={t} selected={t.value === type} />
              ))}
            </Radio.Group>
          </Dialog.Body>
        ) : (
          // `flex-initial`: the Body is `flex-1` so it can scroll, which on its
          // own stretches a short dialog to the viewport's height (finding 95).
          <Dialog.Body className="flex flex-initial flex-col gap-4">
            <Field
              label="Name"
              invalid={submitted && nameMissing}
              error={submitted && nameMissing ? 'Give the report a name.' : undefined}
            >
              <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </Field>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <Text id={topicsLabel} render={<span />} weight="semibold">
                  {type === 'competitive' ? 'Brands' : 'Topics'}
                </Text>
                <Text id={topicsHint} render={<span />} size="sm" color="subtle">
                  {option.topicsHint}
                </Text>
              </div>
              {topics.length ? (
                <ul aria-labelledby={topicsLabel} className="flex flex-wrap gap-1">
                  {topics.map((topic) => (
                    <li key={topic}>
                      <Token onRemove={() => setTopics(topics.filter((t) => t !== topic))}>
                        {topic}
                      </Token>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex gap-2">
                <Field
                  label={`Add ${type === 'competitive' ? 'a brand' : 'a topic'}`}
                  invalid={submitted && topicsMissing}
                  error={submitted && topicsMissing ? 'Add at least one to track.' : undefined}
                  className="min-w-0 flex-1"
                >
                  <Input
                    value={draftTopic}
                    onChange={(event) => setDraftTopic(event.target.value)}
                    onKeyDown={onTopicKey}
                    placeholder={type === 'competitive' ? 'Leaf & Ladle' : 'Gut health'}
                    aria-describedby={topicsHint}
                  />
                </Field>
                <Button
                  appearance="secondary"
                  startIcon={Plus}
                  onClick={addTopic}
                  disabled={draftTopic.trim() === ''}
                  className="self-end"
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Text render={<span />} weight="semibold">
                Sources
              </Text>
              <SegmentedControl
                aria-label="Sources"
                value={sources}
                onValueChange={(value) => setSources(value as WidgetSources)}
                className="self-start"
              >
                {SOURCES.map((s) => (
                  <SegmentedControl.Item key={s.value} value={s.value}>
                    {s.label}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl>
            </div>

            <Field label="Scheduled delivery" nativeLabel={false}>
              <Select
                value={delivery}
                onValueChange={(value) => setDelivery(String(value))}
                items={DELIVERY}
              >
                {DELIVERY.map((d) => (
                  <Select.Item key={d.value} value={d.value}>
                    {d.label}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </Dialog.Body>
        )}

        <div className="flex items-center gap-2 pt-4">
          {step === 'setup' ? (
            <Button appearance="ghost" startIcon={ArrowLeft} onClick={() => setStep('type')}>
              Back
            </Button>
          ) : null}
          <div className="ml-auto flex gap-2">
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{step === 'type' ? 'Next' : 'Create report'}</Button>
          </div>
        </div>
      </form>
    </Dialog.Popup>
  )
}

/**
 * One report type: its badge (the one its reports wear in the table), its
 * name, the sentence saying what it answers, and the widgets it opens with. The radio primitive is rendered onto the
 * card, so the eight are one radio group — one tab stop, arrows move — the
 * Edit panel's Visualization tiles' arrangement, because the library has no
 * selectable card yet (FINDINGS 40).
 */
function TypeCard({ option, selected }: { option: ReportTypeOption; selected: boolean }) {
  return (
    <Radio.Root
      value={option.value}
      nativeButton
      render={
        <ClickableCard selected={selected} className="flex flex-col items-start gap-2 text-left">
          <Badge color={option.color} startIcon={option.icon} aria-hidden />
          <span className="flex min-w-0 flex-col gap-1">
            <Text render={<span />} weight="semibold">
              {option.label}
            </Text>
            <Text render={<span />} color="subtle">
              {option.description}
            </Text>
            {option.includes.length ? (
              <Text render={<span />} size="sm" color="subtle">
                Includes {option.includes.join(' · ')}
              </Text>
            ) : null}
          </span>
        </ClickableCard>
      }
    />
  )
}
