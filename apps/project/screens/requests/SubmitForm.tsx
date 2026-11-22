import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Ellipsis, FilePen } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { DateInput } from '../../../../src/components/Calendar'
import { Card } from '../../../../src/components/Card'
import { Checkbox } from '../../../../src/components/Checkbox'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Menu } from '../../../../src/components/Menu'
import { Select } from '../../../../src/components/Select'
import { Switch } from '../../../../src/components/Switch'
import { Heading, Text } from '../../../../src/components/Text'
import { TextArea } from '../../../../src/components/TextArea'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { YakLine } from '../../components/YakLine'
import { shortDate } from '../../data/dates'
import type { FormQuestion, MyRequest, RequestAnswer, RequestForm } from '../../data/requests'
import { firstName, isAsked, relatedProject } from './model'
import { formPath, minePath, queuePath } from './paths'
import { useRequests } from './requestsState'

/** Only the Creative request form is drawn; any other id goes back to the queue. */
export function SubmitFormScreen() {
  const { formId } = useParams()
  const { form } = useRequests()
  if (formId !== form.id) return <Navigate to={queuePath('new')} replace />
  return <SubmitForm form={form} />
}

type Answer = string | string[] | boolean | Date | null

let sent = 0

/** "Hero and social photos for five winter bowls": a request's name, from what it asks for. */
function titleFrom(need: string): string {
  const clause = need.trim().split(/[.,;]/)[0].trim()
  return clause.length > 60 ? `${clause.slice(0, 57).trimEnd()}…` : clause
}

function answerText(question: FormQuestion, value: Answer): string | undefined {
  if (value === null || value === '' || (Array.isArray(value) && !value.length)) return undefined
  if (value instanceof Date) return shortDate.format(value)
  if (typeof value === 'boolean') return value ? (question.yesLabel ?? 'Yes') : 'No'
  return Array.isArray(value) ? value.join(', ') : value
}

/**
 * The form as the person asking sees it (`Requests - Submit form`,
 * `40006301:29578`): "Tell us what you need" and how fast the team answers,
 * then the form's own questions, in its order — so a question edited in the
 * builder reads that way here. The ones asked only after an answer sit in a
 * subtle box under it and appear when it is chosen; a date followed by a
 * dropdown share a row, as When and Which team do. Save draft and Submit
 * request. Beside it, What happens next, and Yak's note once what you have
 * written sounds like a project Yak knows.
 *
 * Submitting adds it to My requests, waiting on the form's owner.
 */
function SubmitForm({ form }: { form: RequestForm }) {
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const { submit } = useRequests()
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submitted, setSubmitted] = useState(false)
  const set = (id: string, value: Answer) => setAnswers((all) => ({ ...all, [id]: value }))
  const asked = form.questions.filter((q) => isAsked(q, answers))
  const missing = asked.filter(
    (q) => q.required && answerText(q, answers[q.id] ?? null) === undefined,
  )
  const need = String(answers[form.questions[0]?.id] ?? '')
  const related = relatedProject(need)
  const owner = firstName(form.ownerId)

  const send = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (missing.length) return
    const written: RequestAnswer[] = asked.flatMap((q) => {
      const text = answerText(q, answers[q.id] ?? null)
      return text ? [{ question: q.label, answer: text }] : []
    })
    const request: MyRequest = {
      id: `mine-new-${++sent}`,
      title: titleFrom(need) || form.short,
      status: 'submitted',
      ownerId: form.ownerId,
      updated: '2026-11-05',
      updatedAge: 'Just now',
      steps: [
        { text: 'Submitted', date: '2026-11-05' },
        { text: `${form.team} reviews it, usually within a day`, date: 'now', current: true },
      ],
      form: form.name,
      answers: written,
    }
    submit(request)
    toast.add({
      title: 'Request sent',
      description: `${owner} will review it, usually within a day.`,
    })
    navigate(minePath(request.id))
  }

  // The top-level questions, each with the ones that hang off its answer.
  const blocks: ReactNode[] = []
  const top = form.questions.filter((q) => !q.showIf)
  for (let i = 0; i < top.length; i++) {
    const q = top[i]
    const next = top[i + 1]
    if (q.type === 'date' && next?.type === 'dropdown') {
      blocks.push(
        <div key={q.id} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Question
            question={q}
            value={answers[q.id] ?? null}
            onChange={set}
            invalid={submitted && missing.includes(q)}
          />
          <Question
            question={next}
            value={answers[next.id] ?? null}
            onChange={set}
            invalid={submitted && missing.includes(next)}
          />
        </div>,
      )
      i++
      continue
    }
    blocks.push(
      <Question
        key={q.id}
        question={q}
        value={answers[q.id] ?? null}
        onChange={set}
        invalid={submitted && missing.includes(q)}
      />,
    )
    const branch = asked.filter((b) => b.showIf?.questionId === q.id)
    if (branch.length) {
      blocks.push(
        <div
          key={`${q.id}-branch`}
          className="flex flex-col gap-3 rounded-lg bg-surface-background-subtle px-4 py-3"
        >
          {branch.map((b) => (
            <Question
              key={b.id}
              question={b}
              value={answers[b.id] ?? null}
              onChange={set}
              invalid={submitted && missing.includes(b)}
            />
          ))}
        </div>,
      )
    }
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back"
              onClick={() => navigate(-1)}
            />
            <Heading level={1} size="base" weight="bold" className="truncate">
              {form.short}
            </Heading>
          </div>
        }
        end={
          <Menu>
            <Menu.Trigger
              render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
            />
            <Menu.Popup align="end" aria-label="Form options">
              <Menu.Group>
                <Menu.Item
                  startIcon={FilePen}
                  onClick={() => navigate(formPath(form.id, 'settings'))}
                >
                  Edit this form
                </Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu>
        }
      />
      <AppShell.Content className="px-4 pt-6 pb-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <form
            onSubmit={send}
            noValidate
            aria-labelledby="submit-title"
            className="flex w-full max-w-160 flex-col gap-4"
          >
            <Heading id="submit-title" level={2} size="xl" weight="bold">
              Tell us what you need
            </Heading>
            <Text color="subtle">The {form.team} team reviews new requests within a day.</Text>
            {!form.published ? (
              <Card emphasis="subtle">
                <Text>
                  This form isn’t published, so this is a preview: submitting still files it, as a
                  test.
                </Text>
              </Card>
            ) : null}
            {blocks}
            <div className="flex justify-end gap-2">
              <Button
                appearance="ghost"
                onClick={() =>
                  toast.add({ title: 'Draft saved', description: 'It’s here when you come back.' })
                }
              >
                Save draft
              </Button>
              <Button appearance="primary" type="submit">
                Submit request
              </Button>
            </div>
          </form>
          <aside aria-labelledby="next" className="flex w-full flex-col gap-3 lg:w-80">
            <Heading id="next" level={2} size="base" weight="semibold">
              What happens next
            </Heading>
            <Card>
              <ol className="flex flex-col gap-2">
                {[
                  { title: `${form.team} reviews it`, sub: 'Usually within a day' },
                  { title: 'You hear back in Inbox', sub: 'Accepted, declined, or a question' },
                  { title: 'Track it in My requests', sub: 'It stays linked to the work' },
                ].map((step, i) => (
                  <li key={step.title} className="flex items-start gap-2">
                    <Badge className="mt-0.5 shrink-0" aria-hidden>
                      {String(i + 1)}
                    </Badge>
                    <span className="flex min-w-0 flex-col">
                      <Text render={<span />} weight="semibold">
                        {step.title}
                      </Text>
                      <Text render={<span />} size="sm" color="subtle">
                        {step.sub}
                      </Text>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
            {related ? (
              <YakLine>Looks related to {related}. Yak will flag that for the team.</YakLine>
            ) : null}
          </aside>
        </div>
      </AppShell.Content>
    </>
  )
}

/** One question, as the control its type asks for. */
function Question({
  question,
  value,
  onChange,
  invalid,
}: {
  question: FormQuestion
  value: Answer
  onChange: (id: string, value: Answer) => void
  invalid: boolean
}) {
  const error = invalid ? 'This one’s needed.' : undefined
  const { id, label } = question
  switch (question.type) {
    case 'long-text':
      return (
        <Field label={label} invalid={invalid} error={error}>
          <TextArea
            value={String(value ?? '')}
            onValueChange={(next) => onChange(id, String(next))}
          />
        </Field>
      )
    case 'short-text':
      return (
        <Field label={label} invalid={invalid} error={error}>
          <Input value={String(value ?? '')} onChange={(e) => onChange(id, e.target.value)} />
        </Field>
      )
    case 'dropdown': {
      const items = (question.options ?? []).map((o) => ({ value: o, label: o }))
      return (
        <Field label={label} nativeLabel={false} invalid={invalid} error={error}>
          <Select
            value={(value as string | null) ?? null}
            onValueChange={(v) => onChange(id, v as string)}
            items={items}
            placeholder="Choose one"
          >
            {items.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select>
        </Field>
      )
    }
    case 'checkboxes':
      return (
        <Field label={label} name={id} invalid={invalid} error={error}>
          <Checkbox.Group
            value={(value as string[] | null) ?? []}
            onValueChange={(v: string[]) => onChange(id, v)}
          >
            {(question.options ?? []).map((o) => (
              <Checkbox key={o} value={o} label={o} />
            ))}
          </Checkbox.Group>
        </Field>
      )
    case 'yes-no':
      return (
        <div className="flex flex-col gap-1">
          <Text id={`${id}-label`} weight="semibold" color="emphasized">
            {label}
          </Text>
          <Switch
            label={question.yesLabel ?? 'Yes'}
            aria-describedby={`${id}-label`}
            checked={value === true}
            onCheckedChange={(on) => onChange(id, on)}
          />
        </div>
      )
    case 'date':
      return (
        <Field label={label} invalid={invalid} error={error}>
          <DateInput
            value={(value as Date | null) ?? null}
            onValueChange={(d) => onChange(id, d)}
          />
        </Field>
      )
  }
}
