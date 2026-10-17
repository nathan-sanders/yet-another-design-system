import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { Bot, CalendarDays, ChevronDown, History, Mic, Plus, Search, SquarePen } from 'lucide-react'

import { Badge } from '../../../src/components/Badge'
import { Button } from '../../../src/components/Button'
import { Card, ClickableCard } from '../../../src/components/Card'
import { ChatComposer, ChatMessage, ThoughtProcess, ToolCall } from '../../../src/components/Chat'
import { Mark } from '../../../src/components/Chat/story-mark'
import { Icon } from '../../../src/components/Icon'
import { InputGroup } from '../../../src/components/Input'
import { Panel } from '../../../src/components/Panel'
import { Heading, Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import { me } from '../data/people'
import { history, startActions } from '../data/yak'
import { useShell } from '../shell/ShellContext'
import { weekInsights, weekRange } from './insights'

interface Turn {
  id: number
  prompt: string
  /** `thinking` until the canned reply lands. */
  state: 'thinking' | 'done'
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
  const location = useLocation()
  const shell = useShell()

  const ask = (prompt: string) => {
    const id = nextId.current++
    setTurns((current) => [...current, { id, prompt, state: 'thinking' }])
    window.setTimeout(() => {
      setTurns((current) => current.map((t) => (t.id === id ? { ...t, state: 'done' } : t)))
    }, 1800)
  }

  const thinking = turns.some((t) => t.state === 'thinking')
  const context = location.pathname.startsWith('/plan/calendar')
    ? `Calendar · Week of ${weekRange().split(' –')[0]}`
    : 'This page'

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
      <Panel.Body className="relative flex flex-col gap-6">
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
      <div className="flex flex-col items-start gap-2 px-4 pb-4">
        <Token startIcon={CalendarDays} size="small">
          {context}
        </Token>
        <ChatComposer
          aria-label="Message Yak"
          placeholder="How can I help today?"
          streaming={thinking}
          onStop={() => setTurns((current) => current.map((t) => ({ ...t, state: 'done' })))}
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
      </div>
    </Panel>
  )
}

function greeting(): string {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${me.name.split(' ')[0]}`
}

/** The start screen: greeting, `_Yak Insight`s in a card, four `_Yak Action Content` cards. */
function StartScreen({ onAsk }: { onAsk: (prompt: string) => void }) {
  const insights = weekInsights()
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
            Yak insight
          </Text>
          <Heading level={3} size="base" weight="semibold">
            This week · {weekRange()}
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

/** The log: each prompt as a sent bubble, each answer as a full-width reply. */
function Conversation({ turns }: { turns: Turn[] }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  return (
    <div role="log" aria-label="Conversation with Yak" className="flex flex-col gap-6">
      {turns.map((turn) => (
        <div key={turn.id} className="flex flex-col gap-4">
          <ChatMessage direction="sent">
            <ChatMessage.Bubble>{turn.prompt}</ChatMessage.Bubble>
          </ChatMessage>
          {turn.state === 'thinking' ? (
            <ThoughtProcess
              thinking
              icon={<Mark animate />}
              phrases={['Reading your calendar', 'Checking reach by day', 'Drafting']}
            >
              <Text size="sm">
                Looking at this week’s posts and when Veggie Vault’s audience is online.
              </Text>
            </ThoughtProcess>
          ) : (
            <div className="flex flex-col gap-3">
              <ThoughtProcess elapsed={2} icon={<Mark />}>
                <Text size="sm">
                  Looked at this week’s posts and when Veggie Vault’s audience is online.
                </Text>
              </ThoughtProcess>
              <ToolCall status="done">Read the calendar · {weekRange()}</ToolCall>
              <ToolCall status="done">Checked reach by day and hour</ToolCall>
              <ChatMessage layout="fill">
                <Text>{reply(turn.prompt)}</Text>
              </ChatMessage>
            </div>
          )}
        </div>
      ))}
      <div ref={end} />
    </div>
  )
}

function reply(prompt: string): string {
  if (/^fill/i.test(prompt)) {
    return 'I drafted two evergreen posts for that day: the Green Vitality Smoothie at 11 am on Instagram and a behind-the-counter Thread at 2 pm. They’re in the calendar as drafts for you to approve.'
  }
  if (/^spread/i.test(prompt)) {
    return 'I moved the Feel Good Thread from 10 am to 3 pm so the two 10 am posts aren’t competing. Everything else stays put.'
  }
  return 'Here’s a first pass. In the real product this is where I’d draft it into the right place — the calendar, a campaign or a report — for you to review.'
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
      <Panel.Body className="relative flex flex-col gap-4">
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
