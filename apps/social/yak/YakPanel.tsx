import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import {
  Bot,
  ChevronDown,
  Copy,
  History,
  Mic,
  Plus,
  RefreshCw,
  Search,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'

import { Badge } from '../../../src/components/Badge'
import { Button } from '../../../src/components/Button'
import { Card, ClickableCard } from '../../../src/components/Card'
import { ChatComposer, ChatMessage, ThoughtProcess, ToolCall } from '../../../src/components/Chat'
import { Mark } from '../../../src/components/Chat/story-mark'
import { Icon } from '../../../src/components/Icon'
import { InputGroup } from '../../../src/components/Input'
import { Panel } from '../../../src/components/Panel'
import { Heading, Text } from '../../../src/components/Text'
import { Tooltip } from '../../../src/components/Tooltip'
import { me } from '../data/people'
import { history, startActions } from '../data/yak'
import { useShell } from '../shell/ShellContext'
import { allInsights, pageBrief, pageWork, type PageWork } from './insights'

interface Turn {
  id: number
  prompt: string
  /** `thinking` until the canned reply lands. */
  state: 'thinking' | 'done'
  /** The page it was asked beside, which decides what Yak reads to answer. */
  work: PageWork
  sentAt: Date
  repliedAt?: Date
}

/**
 * Yak, the assistant (`40005911:34193`): a `Panel` beside whatever page is
 * open. It starts on a greeting, this week's insights and four ways in; ask it
 * anything and it "thinks" (a `ThoughtProcess`), "works" (a `ToolCall`) and
 * answers. The answers are canned — this is a mock — but every part of the turn
 * is the library's.
 *
 * History (`40005911:34386`) is a `Panel` written inside this one, so it stacks
 * over Yak with Yak's edge peeking out behind it, exactly as the file draws it.
 */
export function YakPanel({
  open,
  history: historyOpen,
  onHistoryChange,
  onClose,
}: {
  open: boolean
  history: boolean
  onHistoryChange: (open: boolean) => void
  onClose: () => void
}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const nextId = useRef(1)
  const shell = useShell()
  const { pathname } = useLocation()

  const ask = (prompt: string) => {
    const id = nextId.current++
    setTurns((current) => [
      ...current,
      { id, prompt, state: 'thinking', work: pageWork(pathname), sentAt: new Date() },
    ])
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((t) => (t.id === id ? { ...t, state: 'done', repliedAt: new Date() } : t)),
      )
    }, 1800)
  }

  const thinking = turns.some((t) => t.state === 'thinking')

  return (
    <Panel
      aria-label="Yak"
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header
        icon={Bot}
        closeButton
        actions={
          <>
            <Button
              appearance="ghost"
              startIcon={History}
              aria-label="History"
              aria-pressed={historyOpen}
              onClick={() => onHistoryChange(!historyOpen)}
            />
            <Button
              appearance="ghost"
              startIcon={SquarePen}
              aria-label="New chat"
              onClick={() => setTurns([])}
            />
          </>
        }
      >
        Yak
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-6">
        {turns.length === 0 ? <StartScreen onAsk={ask} /> : <Conversation turns={turns} />}

        <YakHistory
          open={historyOpen}
          onOpenChange={onHistoryChange}
          onNewChat={() => {
            setTurns([])
            onHistoryChange(false)
          }}
          onPick={(title) => {
            setTurns([])
            ask(title)
            onHistoryChange(false)
          }}
        />
      </Panel.Body>
      {/* No scope token above the composer: Yak works out whether a question
          is about this page or the whole workspace from the question. */}
      <Panel.Footer>
        <ChatComposer
          aria-label="Message Yak"
          placeholder="How can I help today?"
          streaming={thinking}
          onStop={() =>
            setTurns((current) =>
              current.map((t) =>
                t.state === 'thinking' ? { ...t, state: 'done', repliedAt: new Date() } : t,
              ),
            )
          }
          onSubmit={ask}
          className="w-full"
          actions={
            <Button
              appearance="ghost"
              startIcon={Plus}
              aria-label="Add context"
              onClick={() => shell.notBuilt('Adding context')}
            />
          }
          endActions={
            <>
              <Button
                appearance="ghost"
                endIcon={ChevronDown}
                onClick={() => shell.notBuilt('Choosing a model')}
              >
                Opus 5.5
              </Button>
              <Button
                appearance="ghost"
                startIcon={Mic}
                aria-label="Dictate"
                onClick={() => shell.notBuilt('Dictation')}
              />
            </>
          }
        />
      </Panel.Footer>
    </Panel>
  )
}

function greeting(): string {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${me.name.split(' ')[0]}`
}

/** The start screen: greeting, the open page's `_Yak Insight`s in a card, four `_Yak Action Content` cards. */
function StartScreen({ onAsk }: { onAsk: (prompt: string) => void }) {
  const { pathname } = useLocation()
  const { page, title, insights } = pageBrief(pathname)
  return (
    <>
      <div className="flex items-center gap-2">
        <Mark className="size-6 text-content-emphasized" />
        <Heading level={2} size="lg" weight="semibold">
          {greeting()}
        </Heading>
      </div>

      <Card emphasis="subtle" className="flex flex-col gap-3">
        <div className="flex flex-col">
          <Text size="sm" color="subtle">
            Yak insight · {page}
          </Text>
          <Heading level={3} size="base" weight="semibold">
            {title}
          </Heading>
        </div>
        <ul className="flex flex-col gap-2">
          {insights.map((insight) => (
            <li key={insight.text} className="flex gap-2">
              <Icon icon={insight.icon} className="mt-1 text-content-primary" />
              <Text>{insight.text}</Text>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {insights
            .filter((insight) => insight.action)
            .map((insight) => (
              <Button
                key={insight.action}
                appearance="secondary"
                onClick={() => onAsk(insight.action!)}
              >
                {insight.action}
              </Button>
            ))}
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <Heading level={3} size="sm" weight="semibold" color="subtle">
          Start something new
        </Heading>
        <ul className="grid grid-cols-2 gap-2">
          {startActions.map((action) => (
            <li key={action.title} className="flex">
              <ClickableCard onClick={() => onAsk(action.prompt)} className="w-full">
                <div className="flex flex-col items-start gap-2 text-left">
                  <span className="flex size-8 items-center justify-center rounded-md border border-surface-border">
                    <Icon icon={action.icon} />
                  </span>
                  <span className="flex flex-col">
                    <Text render={<span />} weight="semibold" color="emphasized">
                      {action.title}
                    </Text>
                    <Text render={<span />} size="sm" color="subtle">
                      {action.description}
                    </Text>
                  </span>
                </div>
              </ClickableCard>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

const time = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

function Stamp({ at, actions }: { at: Date; actions?: ReactNode }) {
  return (
    <ChatMessage.Metadata
      timestamp={time.format(at)}
      dateTime={at.toISOString()}
      actions={actions}
    />
  )
}

/** The four ghost buttons under a reply, as the ChatMessage `InContext` story draws them. */
function ReplyActions() {
  const shell = useShell()
  return (
    <>
      <Tooltip label="Copy">
        <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy" />
      </Tooltip>
      <Tooltip label="Regenerate">
        <Button
          appearance="ghost"
          size="small"
          startIcon={RefreshCw}
          aria-label="Regenerate"
          onClick={() => shell.notBuilt('Regenerating')}
        />
      </Tooltip>
      <Tooltip label="Good response">
        <Button appearance="ghost" size="small" startIcon={ThumbsUp} aria-label="Good response" />
      </Tooltip>
      <Tooltip label="Bad response">
        <Button appearance="ghost" size="small" startIcon={ThumbsDown} aria-label="Bad response" />
      </Tooltip>
    </>
  )
}

/**
 * The log, laid out as ChatMessage's `InContext` story: the prompt as a sent
 * bubble with its time; the thought row with the tool calls folded inside it;
 * the answer as a ghost bubble across the column, with its time and actions;
 * and the still mark closing the thread once Yak is done.
 */
function Conversation({ turns }: { turns: Turn[] }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  const thinking = turns.some((t) => t.state === 'thinking')

  return (
    <div role="log" aria-label="Conversation with Yak" className="flex flex-col gap-2">
      {turns.map((turn) => (
        <Fragment key={turn.id}>
          <ChatMessage
            direction="sent"
            sender={me.name.split(' ')[0]}
            metadata={<Stamp at={turn.sentAt} />}
          >
            <ChatMessage.Bubble>{turn.prompt}</ChatMessage.Bubble>
          </ChatMessage>
          {turn.state === 'thinking' ? (
            <ThoughtProcess thinking icon={<Mark animate />} phrases={turn.work.phrases}>
              <ToolCall status="done">{turn.work.steps[0]}</ToolCall>
              <ToolCall status="running">{turn.work.steps[1]}</ToolCall>
            </ThoughtProcess>
          ) : (
            <>
              <ThoughtProcess label={turn.work.summary}>
                <ToolCall status="done">{turn.work.steps[0]}</ToolCall>
                <ToolCall status="done">{turn.work.steps[1]}</ToolCall>
              </ThoughtProcess>
              <ChatMessage
                sender="Yak"
                layout="fill"
                metadata={<Stamp at={turn.repliedAt ?? turn.sentAt} actions={<ReplyActions />} />}
              >
                <ChatMessage.Bubble appearance="ghost">{reply(turn.prompt)}</ChatMessage.Bubble>
              </ChatMessage>
            </>
          )}
        </Fragment>
      ))}
      {thinking ? null : (
        <div className="p-3 text-content-emphasized">
          <Mark />
        </div>
      )}
      <div ref={end} />
    </div>
  )
}

function reply(prompt: string): string {
  return (
    allInsights().find((insight) => insight.action === prompt)?.answer ??
    'Here’s a first pass. In the real product this is where I’d draft it into the right place — the calendar, a campaign or a report — for you to review.'
  )
}

/** The history panel, stacked over Yak. */
function YakHistory({
  open,
  onOpenChange,
  onNewChat,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewChat: () => void
  onPick: (title: string) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  return (
    <Panel aria-label="History" open={open} onOpenChange={onOpenChange}>
      <Panel.Header
        icon={History}
        closeButton
        actions={
          <Button
            appearance="ghost"
            startIcon={SquarePen}
            aria-label="New chat"
            onClick={onNewChat}
          />
        }
      >
        History
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <InputGroup>
          <InputGroup.Addon>
            <Icon icon={Search} />
          </InputGroup.Addon>
          <InputGroup.Input
            aria-label="Search chats"
            placeholder="Search chats"
            value={query}
            onValueChange={setQuery}
          />
        </InputGroup>
        {history.map((group) => {
          const rows = group.rows.filter((row) => row.title.toLowerCase().includes(q))
          if (rows.length === 0) return null
          return (
            <section key={group.group} className="flex flex-col gap-1">
              <Heading level={3} size="sm" weight="semibold" color="subtle" className="px-2">
                {group.group}
              </Heading>
              <ul className="flex flex-col">
                {rows.map((row) => (
                  <li key={row.title} className="flex">
                    <ClickableCard
                      emphasis="ghost"
                      padding={2}
                      onClick={() => onPick(row.title)}
                      className="w-full"
                    >
                      <span className="flex w-full items-start gap-2 text-left">
                        <span className="flex min-w-0 flex-1 flex-col">
                          <Text render={<span />} truncate>
                            {row.title}
                          </Text>
                          <span className="flex items-center gap-1 text-content-subtle">
                            <Icon icon={row.icon} size="small" />
                            <Text render={<span />} size="sm" color="subtle">
                              {row.area} · {row.when}
                            </Text>
                          </span>
                        </span>
                        {row.status ? <Badge color="yellow">{row.status}</Badge> : null}
                      </span>
                    </ClickableCard>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </Panel.Body>
    </Panel>
  )
}
