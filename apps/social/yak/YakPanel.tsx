import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import {
  ChevronDown,
  Copy,
  Fullscreen,
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
import { CreatorCard } from '../components/CreatorCard'
import { me } from '../data/people'
import { greeting } from './greeting'
import { history, startActions } from '../data/yak'
import { useShell } from '../shell/ShellContext'
import { useYakChat, type Turn } from './chat'
import { allInsights, pageBrief } from './insights'
import type { Post } from '../data/types'
import { useSchedule } from '../screens/calendar/scheduleState'
import type { SearchResults } from './search'

/**
 * Yak, the assistant (`40005911:34193`): a `Panel` beside whatever page is
 * open. It starts on a greeting, this week's insights and four ways in; ask it
 * anything and it "thinks" (a `ThoughtProcess`), "works" (a `ToolCall`) and
 * answers. The answers are canned — this is a mock — but every part of the turn
 * is the library's. The chat itself is the shell's (`useYakChat`), so Expand
 * opens the full view (`YakScreen`) on the same conversation.
 *
 * History (`40005911:34386`) is a `Panel` written inside this one, so it stacks
 * over Yak with Yak's edge peeking out behind it, exactly as the file draws it.
 */
export function YakPanel({
  open,
  history: historyOpen,
  onHistoryChange,
  onClose,
  onExpand,
}: {
  open: boolean
  history: boolean
  onHistoryChange: (open: boolean) => void
  onClose: () => void
  /** Open the full-page view, `#/yak`, on the same chat. */
  onExpand: () => void
}) {
  const chat = useYakChat()
  const { pathname } = useLocation()

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
              onClick={chat.clear}
            />
            <Button
              appearance="ghost"
              startIcon={Fullscreen}
              aria-label="Expand"
              onClick={onExpand}
            />
          </>
        }
      >
        Yak
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-6">
        {chat.turns.length === 0 ? (
          <StartScreen from={pathname} onAsk={(prompt) => chat.ask(prompt, pathname)} />
        ) : (
          <Conversation turns={chat.turns} />
        )}

        <YakHistory
          open={historyOpen}
          onOpenChange={onHistoryChange}
          onNewChat={() => {
            chat.clear()
            onHistoryChange(false)
          }}
          onPick={(title) => {
            chat.clear()
            chat.ask(title, pathname)
            onHistoryChange(false)
          }}
        />
      </Panel.Body>
      {/* No scope token above the composer: Yak works out whether a question
          is about this page or the whole workspace from the question. */}
      <Panel.Footer>
        <YakComposer from={pathname} />
      </Panel.Footer>
    </Panel>
  )
}

/** The composer, the same in the panel and the full view. */
export function YakComposer({
  from,
  placeholder = 'How can I help today?',
  onAsk,
}: {
  from: string
  placeholder?: string
  /** After the prompt is asked: Home sends it on to the full view. */
  onAsk?: () => void
}) {
  const chat = useYakChat()
  const shell = useShell()
  return (
    <ChatComposer
      aria-label="Message Yak"
      placeholder={placeholder}
      streaming={chat.thinking}
      onStop={chat.stop}
      onSubmit={(prompt) => {
        chat.ask(prompt, from)
        onAsk?.()
      }}
      // 16px rather than the library's 8: Yak's composers and the reply boxes
      // are rounder than a form field. The floating bar stays a pill.
      className="w-full rounded-xl"
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
  )
}

/** The start screen: greeting, the open page's `_Yak Insight`s in a card, four `_Yak Action Content` cards. */
export function StartScreen({
  from,
  onAsk,
}: {
  /** The page the brief is about. */
  from: string
  onAsk: (prompt: string) => void
}) {
  const { posts } = useSchedule()
  const { page, title, insights } = pageBrief(from, posts)
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
export function Conversation({ turns }: { turns: Turn[] }) {
  const { posts } = useSchedule()
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  const thinking = turns.some((t) => t.state === 'thinking')

  return (
    <div
      role="log"
      aria-label="Conversation with Yak"
      className="@container/yak flex flex-col gap-2"
    >
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
                <ChatMessage.Bubble appearance="ghost">
                  {turn.results?.answer ?? reply(turn.prompt, posts)}
                </ChatMessage.Bubble>
              </ChatMessage>
              {turn.results ? <Results results={turn.results} /> : null}
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

/** A search's finds under Yak's answer: creators as Plan › Creators draws them, then trends. */
function Results({ results }: { results: SearchResults }) {
  const shell = useShell()
  if (results.creators.length === 0 && results.trends.length === 0) return null
  return (
    <div className="flex flex-col gap-4 px-3">
      {results.creators.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Heading level={2} size="sm" weight="semibold" color="subtle">
            Creators
          </Heading>
          <ul className="grid grid-cols-1 gap-3 @min-[480px]/yak:grid-cols-2 @min-[900px]/yak:grid-cols-3">
            {results.creators.map((creator) => (
              <li key={creator.id} className="flex">
                <CreatorCard creator={creator} onClick={() => shell.notBuilt('Creator details')} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {results.trends.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Heading level={2} size="sm" weight="semibold" color="subtle">
            Trends
          </Heading>
          <ul className="flex flex-col gap-2">
            {results.trends.map((trend) => (
              <li key={trend.id}>
                <Card className="flex items-center gap-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Text render={<span />} weight="semibold" color="emphasized">
                      {trend.title}
                    </Text>
                    <Text render={<span />} size="sm" color="subtle">
                      {trend.posts.toLocaleString('en-US')} posts
                      {trend.note ? ` · ${trend.note}` : ''}
                    </Text>
                  </span>
                  <Badge color={trend.tone}>{trend.change}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function reply(prompt: string, posts: Post[]): string {
  return (
    allInsights(posts).find((insight) => insight.action === prompt)?.answer ??
    'Here’s a first pass. In the real product this is where I’d draft it into the right place — the calendar, a campaign or a report — for you to review.'
  )
}

/** The history panel: stacked over Yak in the panel, beside the page in the full view. */
export function YakHistory({
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
