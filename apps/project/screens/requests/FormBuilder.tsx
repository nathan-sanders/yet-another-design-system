import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  CircleHelp,
  CircleUser,
  ClipboardList,
  CornerDownRight,
  Ellipsis,
  Eye,
  Link,
  Mail,
  Plus,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Combobox, type ComboboxValue } from '../../../../src/components/Combobox'
import { DragAndDrop, DragHandle, reorder, Sortable } from '../../../../src/components/DragAndDrop'
import { Field } from '../../../../src/components/Field'
import { Icon } from '../../../../src/components/Icon'
import { Input, InputGroup } from '../../../../src/components/Input'
import { Menu } from '../../../../src/components/Menu'
import { Panel } from '../../../../src/components/Panel'
import { Select } from '../../../../src/components/Select'
import { Switch } from '../../../../src/components/Switch'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { Token } from '../../../../src/components/Token'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { PropertyRow } from '../../components/PropertyRow'
import { Choice, PickerMenu, Spoken } from '../../components/TaskTokens'
import {
  QUESTION_TYPES,
  SAVES_TO,
  type FormQuestion,
  type QuestionType,
  type RequestForm,
  type SavesTo,
} from '../../data/requests'
import { useShell } from '../../shell/ShellContext'
import { logicRows, questionTree, typeLabel } from './model'
import { formPath, queuePath, submitPath } from './paths'
import { useRequests } from './requestsState'

/** Only the Creative request form is drawn; any other id goes back to the queue. */
export function FormBuilderScreen() {
  const { formId } = useParams()
  const { form } = useRequests()
  if (formId !== form.id) return <Navigate to={queuePath('new')} replace />
  return <FormBuilder form={form} />
}

/**
 * The form builder (`Requests - Form builder`, `40006284:20412`): Back and the
 * form's name, then Preview, Copy link, Settings, the Published switch and
 * More. Under it the questions in a 640 column, each a Card with its grip,
 * its label, its answer type and the task field it fills ("→ Task name"); the
 * ones asked only after a certain answer sit indented under "If the answer
 * is Photo or video". Add question at the end.
 *
 * Settings opens Form settings in the Panel (`?settings=1`); a question opens
 * the Question editor in it (`?question=kind`, `40006301:32493`), its card
 * drawn selected. Questions drag to reorder, within their level.
 */
function FormBuilder({ form }: { form: RequestForm }) {
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const shell = useShell()
  const [params] = useSearchParams()
  const { orderQuestions, setPublished, addQuestion } = useRequests()
  const questionId = params.get('question')
  const question = form.questions.find((q) => q.id === questionId)
  const settings = !question && params.get('settings') === '1'
  const tree = questionTree(form.questions)

  // What the panel shows is kept after the URL drops it, so it slides out whole.
  const [shown, setShown] = useState<'settings' | string | undefined>(
    question?.id ?? (settings ? 'settings' : undefined),
  )
  const want = question?.id ?? (settings ? 'settings' : undefined)
  if (want && want !== shown) setShown(want)
  const shownQuestion = form.questions.find((q) => q.id === shown)
  const close = () => navigate(formPath(form.id))

  // Each level reorders on its own: the top-level questions, or one branch's.
  const topIds = tree.map((t) => t.question.id)
  const branchIds = (id: string) =>
    tree.find((t) => t.question.id === id)?.branch.map((b) => b.id) ?? []
  const flatten = (top: string[], branchOf: (id: string) => string[]) =>
    top.flatMap((id) => [id, ...branchOf(id)])
  const move = (ids: string[], from: unknown, to: unknown) =>
    reorder(ids, ids.indexOf(String(from)), ids.indexOf(String(to)))
  const moveTop: DragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    orderQuestions(flatten(move(topIds, active.id, over.id), branchIds))
  }
  const moveInBranch =
    (parent: string): DragEnd =>
    ({ active, over }) => {
      if (!over || active.id === over.id) return
      orderQuestions(
        flatten(topIds, (id) =>
          id === parent ? move(branchIds(id), active.id, over.id) : branchIds(id),
        ),
      )
    }

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${submitPath(form.id)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.add({ title: 'Link copied', description: 'Anyone at Veggie Vault can fill it in.' })
    } catch {
      toast.add({ title: 'Couldn’t copy the link', description: url })
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
              aria-label="Back to requests"
              onClick={() => navigate(queuePath('new'))}
            />
            <Heading level={1} size="base" weight="bold" className="truncate">
              {form.name}
            </Heading>
          </div>
        }
        end={
          <>
            <Button
              appearance="ghost"
              startIcon={Eye}
              className="max-lg:hidden"
              onClick={() => navigate(submitPath(form.id))}
            >
              Preview
            </Button>
            <Button
              appearance="ghost"
              startIcon={Link}
              className="max-lg:hidden"
              onClick={copyLink}
            >
              Copy link
            </Button>
            <Button
              appearance="ghost"
              startIcon={Settings}
              aria-pressed={settings}
              className="max-md:hidden"
              onClick={() => navigate(settings ? formPath(form.id) : formPath(form.id, 'settings'))}
            >
              Settings
            </Button>
            <Switch
              label="Published"
              checked={form.published}
              onCheckedChange={(published) => {
                setPublished(published)
                toast.add({
                  title: published ? 'Published' : 'Unpublished',
                  description: published
                    ? 'People can send requests through it again.'
                    : 'Its link stops taking requests until you publish it.',
                })
              }}
            />
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Form options">
                <Menu.Group>
                  <Menu.Item startIcon={Eye} onClick={() => navigate(submitPath(form.id))}>
                    Preview
                  </Menu.Item>
                  <Menu.Item startIcon={Link} onClick={copyLink}>
                    Copy link
                  </Menu.Item>
                  <Menu.Item onClick={() => shell.notBuilt('Duplicating a form')}>
                    Duplicate form
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className="px-4 pt-6 pb-4">
        <section aria-labelledby="questions" className="flex w-full max-w-160 flex-col gap-2">
          <Heading id="questions" level={2} size="base" weight="semibold">
            Questions
          </Heading>
          <DragAndDrop onDragEnd={moveTop}>
            <Sortable
              id="questions"
              label="Questions"
              items={tree.map((t) => t.question.id)}
              render={<ul aria-labelledby="questions" />}
              className="flex flex-col gap-2"
            >
              {tree.map(({ question: q, branch }) => (
                <Sortable.Item key={q.id} id={q.id} label={q.label} render={<li />}>
                  <QuestionRow
                    question={q}
                    selected={q.id === question?.id}
                    onOpen={() => navigate(formPath(form.id, { question: q.id }))}
                  />
                  {branch.length ? (
                    // Its own drag root: a press in here must not also lift the
                    // question it hangs off, so it stops at this box.
                    <div
                      className="flex flex-col gap-2 pt-2 pl-6"
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <span className="flex items-center gap-2 text-sm text-content-subtle">
                        <Icon icon={CornerDownRight} />
                        If the answer is {branch[0].showIf!.answer}
                      </span>
                      <DragAndDrop onDragEnd={moveInBranch(q.id)}>
                        <Sortable
                          id={`branch-${q.id}`}
                          label={`Asked if the answer is ${branch[0].showIf!.answer}`}
                          items={branch.map((b) => b.id)}
                          render={
                            <ul aria-label={`Asked if the answer is ${branch[0].showIf!.answer}`} />
                          }
                          className="flex flex-col gap-2"
                        >
                          {branch.map((b) => (
                            <Sortable.Item key={b.id} id={b.id} label={b.label} render={<li />}>
                              <QuestionRow
                                question={b}
                                selected={b.id === question?.id}
                                onOpen={() => navigate(formPath(form.id, { question: b.id }))}
                              />
                            </Sortable.Item>
                          ))}
                        </Sortable>
                      </DragAndDrop>
                    </div>
                  ) : null}
                </Sortable.Item>
              ))}
            </Sortable>
          </DragAndDrop>
          <Button
            appearance="ghost"
            startIcon={Plus}
            className="self-start"
            onClick={() => {
              const added = addQuestion()
              navigate(formPath(form.id, { question: added.id }))
            }}
          >
            Add question
          </Button>
        </section>
      </AppShell.Content>
      {shell.screenPanelHost
        ? createPortal(
            <Panel
              aria-label={shown === 'settings' ? 'Form settings' : 'Question'}
              open={Boolean(want)}
              onOpenChange={(next) => {
                if (!next) close()
              }}
              resizable
            >
              {shown === 'settings' ? (
                <FormSettings form={form} />
              ) : shownQuestion ? (
                <QuestionEditor
                  key={shownQuestion.id}
                  question={shownQuestion}
                  form={form}
                  onDone={close}
                />
              ) : null}
            </Panel>,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}

/**
 * One question: a Card (12 padding) holding the grip, the label — a button
 * that opens the Question editor — and View Only tokens for its type and the
 * task field it saves to. The grip is Small so the card keeps the file's 50:
 * the row is a 24px line (FINDINGS 90).
 */
function QuestionRow({
  question,
  selected,
  onOpen,
}: {
  question: FormQuestion
  selected: boolean
  onOpen: () => void
}) {
  return (
    <Card selected={selected} className="flex-row items-center gap-2">
      <DragHandle size="small" />
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={selected}
        className={cn(
          'min-w-0 flex-1 truncate rounded-sm text-left text-content-primary',
          focusRing,
        )}
      >
        {question.label}
      </button>
      <span className="flex shrink-0 items-center gap-1 max-sm:hidden">
        <Token>{typeLabel(question.type)}</Token>
        {question.savesTo ? <Token>→ {question.savesTo}</Token> : null}
      </span>
    </Card>
  )
}

const STEP_ICON: Record<RequestForm['onSubmit'][number]['kind'], LucideIcon> = {
  queue: ClipboardList,
  assign: CircleUser,
  yak: Sparkles,
  email: Mail,
}

const ACCESS = ['Everyone at Veggie Vault', 'Store leads and ops', 'Only the Creative team']
const RESPONSES = ['Visible to the Creative team', 'Visible to everyone', 'Only you and the sender']

/**
 * Form settings (`Form settings Panel`, `40006421:161608`): what happens when
 * someone submits, as `_Rule Step`s in a Card — Then, And, And, And — and who
 * can submit and see the answers. Those two are values that can change, so
 * they are Interactive Tokens, where the frame draws them View Only.
 */
function FormSettings({ form }: { form: RequestForm }) {
  const shell = useShell()
  const { setAccess, setResponses } = useRequests()
  return (
    <>
      <Panel.Header icon={ClipboardList}>Form settings</Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <section aria-labelledby="on-submit" className="flex flex-col gap-2">
          <Heading id="on-submit" level={2} size="base" weight="semibold">
            When someone submits
          </Heading>
          <Card>
            <ol className="flex flex-col gap-2">
              {form.onSubmit.map((step, i) => (
                <li key={step.text} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-background-subtle text-content-primary">
                    <Icon icon={STEP_ICON[step.kind]} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <Text render={<span />} size="sm" color="subtle">
                      {i === 0 ? 'Then' : 'And'}
                    </Text>
                    <Text render={<span />} weight="semibold">
                      {step.text}
                    </Text>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Button
            appearance="ghost"
            startIcon={Plus}
            className="self-start"
            onClick={() => shell.notBuilt('Adding a step')}
          >
            Add step
          </Button>
        </section>
        <section aria-labelledby="who" className="flex flex-col gap-2">
          <Heading id="who" level={2} size="base" weight="semibold">
            Who can submit
          </Heading>
          <dl className="flex flex-col">
            <PropertyRow icon={Users} label="Access">
              <Picker label="Access" value={form.access} values={ACCESS} onChange={setAccess} />
            </PropertyRow>
            <PropertyRow icon={Eye} label="Responses">
              <Picker
                label="Responses"
                value={form.responses}
                values={RESPONSES}
                onChange={setResponses}
              />
            </PropertyRow>
          </dl>
        </section>
      </Panel.Body>
    </>
  )
}

function Picker({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: string
  values: string[]
  onChange: (value: string) => void
}) {
  return (
    <PickerMenu
      label={label}
      value={value}
      onValueChange={onChange}
      token={
        <>
          <Spoken>{`${label}:`}</Spoken>
          {value}
        </>
      }
    >
      {values.map((v) => (
        <Choice key={v} value={v} start={null}>
          {v}
        </Choice>
      ))}
    </PickerMenu>
  )
}

type DragEnd = (event: { active: { id: unknown }; over: { id: unknown } | null }) => void

// Saves to's "no field" row: Combobox has no clear button to empty it (FINDINGS 87).
const NOWHERE = 'Nowhere'

/**
 * The Question editor (`Question Panel`, `40006420:161508`): Label, Type, the
 * options when it has them (a draggable list, Add option at the end), Saves
 * to, Required, then its Logic, with Cancel and Save changes pinned at the
 * foot. Edits are a draft until Save changes, which is when the builder and
 * the form itself change.
 */
function QuestionEditor({
  question,
  form,
  onDone,
}: {
  question: FormQuestion
  form: RequestForm
  onDone: () => void
}) {
  const shell = useShell()
  const toast = Toast.useToast()
  const { saveQuestion } = useRequests()
  const [draft, setDraft] = useState(question)
  const [optionIds, setOptionIds] = useState(() =>
    (question.options ?? []).map((_, i) => `option-${i}`),
  )
  const [optionText, setOptionText] = useState<Record<string, string>>(() =>
    Object.fromEntries((question.options ?? []).map((o, i) => [`option-${i}`, o])),
  )
  const hasOptions = draft.type === 'dropdown' || draft.type === 'checkboxes'
  const typeItems = QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))
  const savesItems = [NOWHERE, ...SAVES_TO].map((s) => ({
    value: s,
    label: s === NOWHERE ? 'Nowhere, it stays in the request' : s,
  }))
  const saves = savesItems.find((item) => item.value === (draft.savesTo ?? NOWHERE)) ?? null
  const logic = logicRows(question, form.questions, form.team)

  const save = () => {
    const options = optionIds.map((id) => optionText[id].trim()).filter(Boolean)
    saveQuestion({
      ...draft,
      label: draft.label.trim() || question.label,
      options: hasOptions ? options : undefined,
    })
    toast.add({ title: 'Question saved', description: draft.label.trim() || question.label })
    onDone()
  }

  return (
    <>
      <Panel.Header icon={CircleHelp}>Question</Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <Field label="Label">
          <Input
            value={draft.label}
            onChange={(event) => setDraft({ ...draft, label: event.target.value })}
          />
        </Field>
        <Field label="Type" nativeLabel={false}>
          <Select
            value={draft.type}
            onValueChange={(v) => setDraft({ ...draft, type: v as QuestionType })}
            items={typeItems}
          >
            {typeItems.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select>
        </Field>
        {hasOptions ? (
          <section aria-labelledby="options" className="flex flex-col gap-2">
            <Heading id="options" level={3} size="base" weight="semibold">
              Options
            </Heading>
            <DragAndDrop
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return
                setOptionIds((ids) =>
                  reorder(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))),
                )
              }}
            >
              <Sortable
                id="options"
                label="Options"
                items={optionIds}
                render={<ul aria-labelledby="options" />}
                className="flex flex-col gap-1"
              >
                {optionIds.map((id, i) => (
                  <Sortable.Item
                    key={id}
                    id={id}
                    label={optionText[id] || `Option ${i + 1}`}
                    render={<li />}
                  >
                    <InputGroup>
                      <InputGroup.Addon>
                        <DragHandle size="small" />
                      </InputGroup.Addon>
                      <InputGroup.Input
                        aria-label={`Option ${i + 1}`}
                        value={optionText[id]}
                        onChange={(event) =>
                          setOptionText((all) => ({ ...all, [id]: event.target.value }))
                        }
                      />
                    </InputGroup>
                  </Sortable.Item>
                ))}
              </Sortable>
            </DragAndDrop>
            <Button
              appearance="ghost"
              size="small"
              startIcon={Plus}
              className="self-start"
              onClick={() => {
                const id = `option-new-${optionIds.length}-${Date.now()}`
                setOptionIds((ids) => [...ids, id])
                setOptionText((all) => ({ ...all, [id]: '' }))
              }}
            >
              Add option
            </Button>
          </section>
        ) : null}
        <Field label="Saves to" nativeLabel={false}>
          <Combobox
            items={savesItems}
            value={saves}
            onValueChange={(value: ComboboxValue) => {
              const picked = value && !Array.isArray(value) ? String(value.value) : NOWHERE
              setDraft({ ...draft, savesTo: picked === NOWHERE ? undefined : (picked as SavesTo) })
            }}
          />
        </Field>
        <div className="flex items-center gap-2">
          <Text id={`${question.id}-required`} className="flex-1" color="subtle">
            Required
          </Text>
          <Switch
            aria-labelledby={`${question.id}-required`}
            checked={draft.required}
            onCheckedChange={(required) => setDraft({ ...draft, required })}
          />
        </div>
        <section aria-labelledby="logic" className="flex flex-col gap-2">
          <Heading id="logic" level={3} size="base" weight="semibold">
            Logic
          </Heading>
          <Card className="gap-2">
            {logic.length ? (
              <ul className="flex flex-col gap-2">
                {logic.map((row) => (
                  <LogicRow
                    key={row.title + row.body}
                    icon={row.kind === 'show' ? CornerDownRight : ClipboardList}
                    title={row.title}
                    body={row.body}
                  />
                ))}
              </ul>
            ) : (
              <Text size="sm" color="subtle">
                Every answer goes to the {form.team} queue.
              </Text>
            )}
            <Button
              appearance="ghost"
              size="small"
              startIcon={Plus}
              className="self-start"
              onClick={() => shell.notBuilt('Adding logic')}
            >
              Add logic
            </Button>
          </Card>
        </section>
      </Panel.Body>
      <Panel.Footer className="flex justify-end gap-2">
        <Button appearance="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button appearance="primary" onClick={save}>
          Save changes
        </Button>
      </Panel.Footer>
    </>
  )
}

function LogicRow({
  icon,
  title,
  body,
}: {
  icon: LucideIcon
  title: string
  body: string
}): ReactNode {
  const shell = useShell()
  return (
    <li className="flex items-center gap-2">
      <Icon icon={icon} className="shrink-0 text-content-primary" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Text render={<span />} weight="semibold">
          {title}
        </Text>
        <Text render={<span />} size="sm" color="subtle">
          {body}
        </Text>
      </span>
      <Menu>
        <Menu.Trigger
          render={
            <Button
              appearance="ghost"
              size="small"
              startIcon={Ellipsis}
              aria-label={`${title} options`}
            />
          }
        />
        <Menu.Popup align="end" aria-label={`${title} options`}>
          <Menu.Group>
            <Menu.Item onClick={() => shell.notBuilt('Editing logic')}>Edit</Menu.Item>
            <Menu.Item onClick={() => shell.notBuilt('Removing logic')}>Remove</Menu.Item>
          </Menu.Group>
        </Menu.Popup>
      </Menu>
    </li>
  )
}
