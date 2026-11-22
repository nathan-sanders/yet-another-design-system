import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  Ellipsis,
  FolderKanban,
  History,
  Link as LinkIcon,
  ListTodo,
  MessageSquare,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar, AvatarGroup } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { Token } from '../../../../src/components/Token'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { datedText, day, fileIso, today } from '../../data/dates'
import {
  yakRewrites,
  yakTodos,
  type DocBlock,
  type DocThread,
  type ProjectDoc,
} from '../../data/docs'
import { me, personFor } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { taskKey, TASK_PARAM } from '../project/paths'
import { TaskPanel } from '../project/TaskPanel'
import { useTasks } from '../project/tasksState'
import { nextTaskNumber } from '../requests/model'
import { CreateTaskDialog, type NewTaskFields } from './CreateTaskDialog'
import {
  DiffLine,
  DocBlockView,
  SelectionToolbar,
  SlashLine,
  YakSuggestion,
  type BlockHandlers,
} from './DocBlocks'
import { CommentsSide, DetailsSide, HistorySide, TodosCard } from './DocSide'
import { useDocs } from './docsState'
import { compareBlocks, versionRows } from './model'
import { useEditable } from './useEditable'
import { docsPath, type DocSide } from './paths'

let made = 0
const newBlockId = () => `block-new-${++made}`

/** "updated 2h ago", "updated yesterday", "updated Oct 30". */
function updatedLine(doc: ProjectDoc): string {
  const label = datedText(doc.updated)
  return `updated ${label === 'Yesterday' || label === 'Just now' ? label.toLowerCase() : label}`
}

/** The words of the selection, when it sits inside one block. */
function selectedWords(blockId: string): string | undefined {
  const selection = window.getSelection()
  const words = selection?.toString().trim()
  if (!selection || !words || !selection.anchorNode) return undefined
  const block = (selection.anchorNode.parentElement ?? null)?.closest('[data-block]')
  return block?.getAttribute('data-block') === blockId ? words : undefined
}

function shortQuote(text: string): string {
  return text.length > 48 ? `${text.slice(0, 46).trimEnd()}…` : text
}

/**
 * What Ask Yak to draft writes, from the project as it stands: where the
 * permit and the equipment are, read off the live tasks so a lag Yak widened
 * elsewhere shows up here.
 */
function yakDraft(project: Project, tasks: Task[]): string {
  const find = (id: string) => tasks.find((t) => t.id === id)
  const inspection = find('aus-21')
  const permit = find('aus-24')
  const equipment = find('aus-26')
  const training = find('aus-19')
  if (project.id !== 'austin' || !inspection || !permit || !equipment || !training)
    return `Where it stands: ${project.name} is ${project.progress}% done, with ${project.milestone.name} next on {${project.milestone.date}}.`
  return `Where it stands: the final electrical inspection is on {${inspection.due}}, and the health permit waits on it until {${permit.due}}. Equipment arrives from {${equipment.start ?? equipment.due}}, ahead of crew training on {${training.start ?? training.due}}.`
}

/**
 * A doc's page (`Docs - Austin opening plan`, `40006283:20532`): the back
 * arrow, its name, who is viewing, Share and ⋯ in the top bar; the doc in a
 * 680 column and a 300 side column 32 beside it, centered.
 *
 * The side column is the URL's: Linked tasks and Details at rest,
 * `?side=comments` (`&thread=`), `?side=history` (`&version=` compares), and
 * `?yak=todos` puts Yak's to-dos over the details. A task opens in its panel
 * over the doc, `?task=AUS-24`.
 */
export function DocPage() {
  const { docId } = useParams()
  const { docs } = useDocs()
  const doc = docs.find((d) => d.id === docId)
  if (!doc) return <Navigate to={docsPath()} replace />
  return <DocView key={doc.id} doc={doc} />
}

function DocView({ doc }: { doc: ProjectDoc }) {
  const navigate = useNavigate()
  const shell = useShell()
  const toast = Toast.useToast()
  const docsState = useDocs()
  const { tasks, addTask, removeTask } = useTasks()
  const [params, setParams] = useSearchParams()
  const project = projectFor(doc.projectId)!
  const owner = personFor(doc.ownerId)
  const slashRef = useRef<HTMLInputElement>(null)

  const side: DocSide =
    params.get('side') === 'comments' || params.get('side') === 'history'
      ? (params.get('side') as DocSide)
      : 'details'
  const from = params.get('from') ?? docsPath()

  /** Changes the view's params, keeping where the back arrow goes. */
  const view = (next: Record<string, string | undefined>) => {
    const out = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) out.delete(key)
      else out.set(key, value)
    }
    setParams(out)
  }

  const [selectedId, setSelectedId] = useState<string>()
  const [suggestion, setSuggestion] = useState<{ blockId?: string; text: string; title: string }>()
  const [draft, setDraft] = useState<{ blockId: string; quote: string }>()
  const [creating, setCreating] = useState<{ blockId: string; seed: string }>()

  const blocks = doc.blocks
  const blockText = (id: string) => {
    const block = blocks?.find((b) => b.id === id)
    return block && 'text' in block ? datedText(block.text) : ''
  }

  // Comments
  const threads = docsState.threads.filter((t) => t.docId === doc.id && !t.resolved)
  const openThreadId = side === 'comments' ? (params.get('thread') ?? undefined) : undefined
  const threadByBlock = useMemo(() => {
    const map = new Map<string, { id: string; count: number }>()
    for (const t of threads)
      if (!map.has(t.blockId)) map.set(t.blockId, { id: t.id, count: t.comments.length })
    return map
  }, [threads])

  // History
  const versions = versionRows(doc, me.id)
  const comparing =
    side === 'history'
      ? versions.find((v) => v.id === params.get('version') && !v.current)
      : undefined
  const diff = comparing ? compareBlocks(blocks ?? [], comparing.blocks) : undefined

  // Yak's to-dos: what it found and has not been made yet.
  const todos = (yakTodos[doc.id] ?? []).filter(
    (todo) => !tasks.some((t) => t.projectId === project.id && t.title === todo.title),
  )
  const showTodos = params.get('yak') === 'todos' && side === 'details' && todos.length > 0

  const highlighted = new Set<string>()
  if (showTodos) todos.forEach((t) => highlighted.add(t.blockId))
  if (draft) highlighted.add(draft.blockId)
  const openThread = threads.find((t) => t.id === openThreadId)
  if (openThread) highlighted.add(openThread.blockId)
  if (suggestion?.blockId) highlighted.add(suggestion.blockId)

  // The task panel, one panel at a time with Yak, as on a project page.
  const requested = params.get(TASK_PARAM)
  const openTask = tasks.find((t) => requested !== null && taskKey(t) === requested)
  const [shownTaskId, setShownTaskId] = useState(openTask?.id)
  if (openTask && openTask.id !== shownTaskId) setShownTaskId(openTask.id)
  const { yakOpen, closeYak } = shell
  const lastTaskId = useRef(openTask?.id)
  useEffect(() => {
    if (openTask && openTask.id !== lastTaskId.current && yakOpen) closeYak()
    lastTaskId.current = openTask?.id
  }, [openTask, yakOpen, closeYak])

  const say = (title: string, description: string, undo?: () => void) =>
    toast.add({ title, description, action: undo ? { label: 'Undo', onClick: undo } : undefined })

  const makeTask = (fields: NewTaskFields, number: number): Task => ({
    id: `${project.key.toLowerCase()}-${number}`,
    projectId: project.id,
    number,
    title: fields.title,
    phase: 'From docs',
    assigneeId: fields.assigneeId,
    status: 'todo',
    priority: 'none',
    due: fileIso(fields.due),
    linked: { doc: doc.name },
    activity: [
      {
        id: `${project.key}-${number}-made`,
        actor: me.id,
        text: `You made it from ${doc.name}`,
        at: today,
      },
    ],
  })

  const createTask = (fields: NewTaskFields) => {
    if (!creating) return
    const before = doc
    const task = makeTask(fields, nextTaskNumber(tasks, project.id))
    addTask(task)
    const block = blocks?.find((b) => b.id === creating.blockId)
    const chip = block && (block.kind === 'paragraph' || block.kind === 'item') && !block.taskId
    docsState.linkTask(doc.id, task.id, chip ? block.id : undefined)
    setCreating(undefined)
    say(`${taskKey(task)} created`, `Linked to ${doc.name}.`, () => {
      removeTask(task.id)
      docsState.restoreDoc(before)
    })
  }

  const createTodos = () => {
    const before = doc
    const first = nextTaskNumber(tasks, project.id)
    const made = todos.map((todo, i) =>
      makeTask({ title: todo.title, assigneeId: todo.assigneeId, due: day(todo.due) }, first + i),
    )
    // `day()` already moved the file's dates onto this week; save them as the file's.
    made.forEach((task) => {
      addTask(task)
      docsState.linkTask(doc.id, task.id)
    })
    view({ yak: undefined })
    const people = [...new Set(todos.map((t) => personFor(t.assigneeId).name.split(' ')[0]))]
    say(
      `${made.length} tasks created`,
      `${people.join(' and ')} ${people.length === 1 ? 'has' : 'have'} them in My work.`,
      () => {
        made.forEach((task) => removeTask(task.id))
        docsState.restoreDoc(before)
      },
    )
  }

  const askYak = (blockId: string) => {
    const rewrite = yakRewrites[doc.id]?.[blockId]
    if (!rewrite) {
      say(
        'Yak has no rewrite for this one',
        'In this mock Yak rewrites only the opening plan’s partner line.',
      )
      return
    }
    setSuggestion({ blockId, text: rewrite, title: 'Yak suggests' })
  }

  const acceptSuggestion = () => {
    if (!suggestion) return
    const before = doc
    if (suggestion.blockId) docsState.updateBlock(doc.id, suggestion.blockId, suggestion.text)
    else
      docsState.insertBlock(doc.id, { id: newBlockId(), kind: 'paragraph', text: suggestion.text })
    setSuggestion(undefined)
    say(suggestion.blockId ? 'Paragraph updated' : 'Yak’s draft added', doc.name, () =>
      docsState.restoreDoc(before),
    )
  }

  const startComment = (blockId: string) => {
    const quote = shortQuote(selectedWords(blockId) ?? blockText(blockId))
    setDraft({ blockId, quote })
    view({ side: 'comments', thread: undefined, version: undefined, yak: undefined })
  }

  const resolve = (thread: DocThread) => {
    docsState.setResolved(thread.id, true)
    view({ thread: undefined })
    say('Resolved', `“${thread.quote}”`, () => docsState.setResolved(thread.id, false))
  }

  const handlers: BlockHandlers = {
    selectedId: comparing ? undefined : selectedId,
    highlighted,
    onSelect: (id) => {
      setSelectedId(id)
      if (suggestion?.blockId && suggestion.blockId !== id) setSuggestion(undefined)
    },
    onText: (id, text) => {
      const block = blocks?.find((b) => b.id === id)
      // An emptied line with nothing else on it goes.
      if (!text && block && block.kind !== 'heading' && !('taskId' in block && block.taskId))
        docsState.removeBlock(doc.id, id)
      else docsState.updateBlock(doc.id, id, text)
    },
    onRemove: (id) => {
      const before = doc
      docsState.removeBlock(doc.id, id)
      say('Removed from the doc', doc.name, () => docsState.restoreDoc(before))
    },
    onEnter: () => slashRef.current?.focus(),
    threads: threadByBlock,
    onOpenThread: (id) => view({ side: 'comments', thread: id, version: undefined }),
  }

  const insert = (block: DocBlock) => docsState.insertBlock(doc.id, block)
  const linkable = tasks.filter((t) => t.projectId === project.id && !doc.taskIds.includes(t.id))
  const viewers = [...new Set([doc.ownerId, ...(doc.editorIds ?? []), me.id])].map(personFor)

  const title = useEditable(
    doc.name,
    (name) => docsState.renameDoc(doc.id, name || 'Untitled doc'),
    () => slashRef.current?.focus(),
  )

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href)
    say('Link copied', `Anyone in ${project.name} can open ${doc.name}.`)
  }

  const renderBlock = (block: DocBlock) => (
    <div key={block.id} className="flex flex-col gap-3">
      <DocBlockView block={block} project={project} tasks={tasks} handlers={handlers} />
      {suggestion?.blockId === block.id ? (
        <YakSuggestion
          title={suggestion.title}
          text={suggestion.text}
          onAccept={acceptSuggestion}
          onDismiss={() => setSuggestion(undefined)}
        />
      ) : selectedId === block.id && 'text' in block && block.kind !== 'heading' ? (
        <SelectionToolbar
          onCreateTask={() =>
            setCreating({ blockId: block.id, seed: selectedWords(block.id) ?? blockText(block.id) })
          }
          onAskYak={() => askYak(block.id)}
          onComment={() => startComment(block.id)}
        />
      ) : null}
    </div>
  )

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back"
              onClick={() => navigate(from)}
            />
            <Text render={<span />} weight="bold" color="emphasized" truncate>
              {doc.name}
            </Text>
          </div>
        }
        end={
          <>
            <AvatarGroup
              size="small"
              aria-label={`Viewing now: ${viewers.map((p) => p.name).join(', ')}`}
              className="max-md:hidden"
            >
              {viewers.map((person) => (
                <Avatar key={person.id} name={person.name} src={person.avatar} />
              ))}
            </AvatarGroup>
            <Button appearance="ghost" startIcon={LinkIcon} onClick={copyLink}>
              Share
            </Button>
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Doc options">
                <Menu.Group>
                  <Menu.Item
                    startIcon={MessageSquare}
                    onClick={() => view({ side: 'comments', version: undefined, yak: undefined })}
                  >
                    Comments
                  </Menu.Item>
                  <Menu.Item
                    startIcon={History}
                    onClick={() => view({ side: 'history', thread: undefined, yak: undefined })}
                  >
                    Version history
                  </Menu.Item>
                  {yakTodos[doc.id] ? (
                    <Menu.Item
                      startIcon={ListTodo}
                      onClick={() => {
                        if (todos.length === 0)
                          say('Nothing new to do', 'Yak’s to-dos from this doc are already tasks.')
                        else
                          view({
                            yak: 'todos',
                            side: undefined,
                            thread: undefined,
                            version: undefined,
                          })
                      }}
                    >
                      Find to-dos with Yak
                    </Menu.Item>
                  ) : null}
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className="px-4 pt-6 pb-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-center">
          <article aria-label={doc.name} className="flex w-full max-w-170 min-w-0 flex-col gap-3">
            {comparing && diff ? (
              <div className="flex items-center gap-2 rounded-lg bg-surface-background-subtle py-2 pr-2 pl-3">
                <Text
                  render={<span />}
                  size="sm"
                  weight="semibold"
                  color="emphasized"
                  className="min-w-0 flex-1"
                >
                  {`Comparing with ${datedText(comparing.name)} · ${diff.changes} change${diff.changes === 1 ? '' : 's'}`}
                </Text>
                <Button
                  appearance="ghost"
                  size="small"
                  onClick={() => {
                    const before = doc
                    docsState.restoreVersion(doc.id, comparing.id)
                    view({ version: undefined })
                    say(
                      `Restored the version from ${datedText(comparing.name)}`,
                      'The version before it is still in the history.',
                      () => docsState.restoreDoc(before),
                    )
                  }}
                >
                  Restore this version
                </Button>
                <Button
                  appearance="secondary"
                  size="small"
                  onClick={() => view({ side: undefined, version: undefined })}
                >
                  Done
                </Button>
              </div>
            ) : null}

            {comparing ? (
              // Keyed apart from the editable title, or React reuses the element
              // and the editable one comes back empty.
              <Heading key="compare-title" level={1} size="2xl" weight="bold">
                {doc.name}
              </Heading>
            ) : (
              <Heading
                key="title"
                level={1}
                size="2xl"
                weight="bold"
                {...title}
                className="outline-none"
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Avatar name={owner.name} src={owner.avatar} alt="" size="x-small" />
              <Text render={<span />} size="sm" color="subtle">
                {owner.name} · {updatedLine(doc)}
              </Text>
              <Token startIcon={FolderKanban}>{project.name}</Token>
            </div>

            {!blocks ? (
              <Text color="subtle" className="py-8">
                This doc’s words are not in the mock; only the Austin opening plan has been written
                so far.
              </Text>
            ) : diff ? (
              diff.rows.map((row, i) => (
                <DiffLine
                  key={`${row.kind}-${row.block.id}-${i}`}
                  row={row}
                  project={project}
                  tasks={tasks}
                />
              ))
            ) : (
              <>
                {blocks.map(renderBlock)}
                {suggestion && !suggestion.blockId ? (
                  <YakSuggestion
                    title={suggestion.title}
                    text={suggestion.text}
                    onAccept={acceptSuggestion}
                    onDismiss={() => setSuggestion(undefined)}
                  />
                ) : null}
                <SlashLine
                  inputRef={slashRef}
                  onFocus={() => setSelectedId(undefined)}
                  linkable={linkable}
                  onParagraph={(text) => insert({ id: newBlockId(), kind: 'paragraph', text })}
                  onCommand={(run) => {
                    if (run === 'task-list') insert({ id: newBlockId(), kind: 'tasks' })
                    if (run === 'status') insert({ id: newBlockId(), kind: 'status' })
                    if (run === 'yak-draft')
                      setSuggestion({ text: yakDraft(project, tasks), title: 'Yak drafted' })
                  }}
                  onLink={(task) => {
                    insert({ id: newBlockId(), kind: 'item', text: '', taskId: task.id })
                    docsState.linkTask(doc.id, task.id)
                  }}
                />
              </>
            )}
          </article>

          <aside
            aria-label="About this doc"
            className={cn(
              'flex w-full flex-col lg:sticky lg:top-0 lg:w-75 lg:shrink-0',
              side === 'details' ? 'gap-4' : 'gap-3',
            )}
          >
            {side === 'comments' ? (
              <CommentsSide
                threads={threads}
                openId={openThreadId}
                draft={draft}
                onStart={(body) => {
                  if (!draft) return
                  const id = docsState.addThread(
                    { docId: doc.id, blockId: draft.blockId, quote: draft.quote },
                    body,
                  )
                  setDraft(undefined)
                  view({ thread: id })
                }}
                onCancelDraft={() => setDraft(undefined)}
                onReply={(id, body) => docsState.reply(id, body)}
                onResolve={resolve}
                onSelectThread={(id) => {
                  if (id !== openThreadId) view({ thread: id })
                }}
              />
            ) : side === 'history' ? (
              <HistorySide
                versions={versions}
                comparing={comparing?.id}
                onPick={(version) => view({ version: version.current ? undefined : version.id })}
              />
            ) : (
              <>
                {showTodos ? (
                  <TodosCard
                    todos={todos}
                    onCreate={createTodos}
                    onDismiss={() => view({ yak: undefined })}
                  />
                ) : null}
                <DetailsSide
                  doc={doc}
                  project={project}
                  tasks={tasks}
                  onOpenTask={(task) => view({ [TASK_PARAM]: taskKey(task) })}
                />
              </>
            )}
            {side !== 'details' ? (
              <Button
                appearance="ghost"
                size="small"
                className="self-start"
                onClick={() => {
                  setDraft(undefined)
                  view({ side: undefined, thread: undefined, version: undefined })
                }}
              >
                Back to details
              </Button>
            ) : null}
          </aside>
        </div>
      </AppShell.Content>
      <CreateTaskDialog
        seed={creating?.seed}
        projectName={project.name}
        onClose={() => setCreating(undefined)}
        onCreate={createTask}
      />
      {shell.screenPanelHost
        ? createPortal(
            <TaskPanel
              taskId={shownTaskId}
              open={Boolean(openTask)}
              onClose={() => view({ [TASK_PARAM]: undefined })}
            />,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}
