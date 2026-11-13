import { Fragment, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import {
  AudioLines,
  Clock,
  Copy,
  Fullscreen,
  Plus,
  RefreshCw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'

import { Badge } from '../../../src/components/Badge'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { ChatComposer, ChatMessage, ThoughtProcess, ToolCall } from '../../../src/components/Chat'
import { Mark } from '../../../src/components/Chat/story-mark'
import { Panel } from '../../../src/components/Panel'
import { Heading, Text } from '../../../src/components/Text'
import { Toast } from '../../../src/components/Toast'
import { Tooltip } from '../../../src/components/Tooltip'
import { me, personFor } from '../data/people'
import { useTasks } from '../screens/project/tasksState'
import { useShell } from '../shell/ShellContext'
import { useYakChat, type Turn } from './chat'
import { SUGGESTIONS, type Proposal } from './replies'

/** "Good afternoon, Nathan", by the clock, as Home's greeting reads. */
function greeting(): string {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${me.name.split(' ')[0]}`
}

/** The composer's question on a project's pages, as the file writes it; Yet Social's elsewhere. */
function placeholderFor(pathname: string): string {
  return pathname.startsWith('/projects/') ? 'Ask about this project…' : 'How can I help today?'
}

/**
 * Yak, the assistant, in a `Panel` beside the page (`Project - Overview +
 * Yak`, `40006277:14114`): Yet Social's Yak panel with Yet Project's words.
 * The header has History, New chat and Expand; History and the full view are
 * Yet Social's and not built here, so they say so. The answers are scripted —
 * one question so far — but every part of a turn is the library's.
 */
export function YakPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chat = useYakChat()
  const shell = useShell()
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
        actions={
          <>
            <Button
              appearance="ghost"
              startIcon={Clock}
              aria-label="History"
              onClick={() => shell.notBuilt('Yak’s history')}
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
              onClick={() => shell.notBuilt('Yak’s full view')}
            />
          </>
        }
      >
        Yak
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-6">
        {chat.turns.length === 0 ? (
          <StartScreen onAsk={chat.ask} />
        ) : (
          <Conversation turns={chat.turns} />
        )}
      </Panel.Body>
      <Panel.Footer>
        <YakComposer placeholder={placeholderFor(pathname)} />
      </Panel.Footer>
    </Panel>
  )
}

/**
 * The composer, as Yet Social's: Add context, Voice and Send. The file still
 * draws a model picker beside Voice, which Yet Social took out in #370, so it
 * is out here too.
 */
function YakComposer({ placeholder }: { placeholder: string }) {
  const chat = useYakChat()
  const shell = useShell()
  return (
    <ChatComposer
      aria-label="Message Yak"
      placeholder={placeholder}
      streaming={chat.thinking}
      onStop={chat.stop}
      onSubmit={chat.ask}
      // 16px rather than the library's 8, as Yet Social's Yak composers are.
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
        <Button
          appearance="ghost"
          startIcon={AudioLines}
          aria-label="Voice input"
          onClick={() => shell.notBuilt('Voice input')}
        />
      }
    />
  )
}

/**
 * Before the first question: the greeting with Yak's mark, and the questions
 * Home offers, as the "Next, I can" chips. Yet Project's file draws no start
 * screen, so this one is code-first and short.
 */
function StartScreen({ onAsk }: { onAsk: (prompt: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Mark className="size-6 text-content-emphasized" />
        <Heading level={2} size="lg" weight="semibold">
          {greeting()}
        </Heading>
      </div>
      <Chips label="Try asking" prompts={SUGGESTIONS} onAsk={onAsk} />
    </>
  )
}

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function Stamp({ at, actions }: { at: Date; actions?: ReactNode }) {
  return (
    <ChatMessage.Metadata
      timestamp={time.format(at)}
      dateTime={at.toISOString()}
      actions={actions}
    />
  )
}

/** The four ghost buttons under a reply, as Yet Social's are. */
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
 * The log, as the frame lays it out: the question as a sent bubble, then
 * Yak's reply — the thought row, open, with its tool calls in a card; the
 * answer as ghost bubbles, a proposal as a Subtle Card among them; the time
 * and actions — then "Next, I can". 24 between the three, 4 inside the reply.
 */
function Conversation({ turns }: { turns: Turn[] }) {
  const chat = useYakChat()
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  return (
    <div role="log" aria-label="Conversation with Yak" className="flex flex-col gap-6">
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
            <ThoughtProcess thinking icon={<Mark animate />} phrases={turn.reply.phrases}>
              {turn.reply.tools.map((tool, i) => (
                <ToolCall
                  key={tool}
                  status={i === turn.reply.tools.length - 1 ? 'running' : 'done'}
                >
                  {tool}
                </ToolCall>
              ))}
            </ThoughtProcess>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <ThoughtProcess label={turn.reply.summary} defaultOpen>
                  {turn.reply.tools.map((tool) => (
                    <ToolCall key={tool} status="done">
                      {tool}
                    </ToolCall>
                  ))}
                </ThoughtProcess>
                <ChatMessage
                  sender="Yak"
                  layout="fill"
                  metadata={<Stamp at={turn.repliedAt ?? turn.sentAt} actions={<ReplyActions />} />}
                >
                  {/* The proposal sits in the bubble group itself, the bubbles'
                      full width, as the frame draws it — not inside a ghost
                      bubble's 12px, where Yet Social's caption card is. */}
                  {turn.reply.bubbles.map((bubble, i) =>
                    bubble.kind === 'text' ? (
                      <ChatMessage.Bubble key={i} appearance="ghost">
                        {bubble.text}
                      </ChatMessage.Bubble>
                    ) : (
                      <ProposalCard key={i} turn={turn} proposal={bubble.proposal} />
                    ),
                  )}
                </ChatMessage>
              </div>
              {turn.reply.followUps?.length ? (
                <Chips label="Next, I can" prompts={turn.reply.followUps} onAsk={chat.ask} />
              ) : null}
            </>
          )}
        </Fragment>
      ))}
      <div ref={end} />
    </div>
  )
}

/**
 * Something Yak offers to change: a Subtle Card holding the words and its
 * own actions — Apply change Secondary, Not now Ghost, both Small. Applying
 * really moves the task (its lag behind the permit, so its start), writes it
 * into the task's Activity as Yak's, and says who heard; Undo puts it back.
 * Not now leaves the plan alone and keeps Apply within reach.
 */
function ProposalCard({ turn, proposal }: { turn: Turn; proposal: Proposal }) {
  const chat = useYakChat()
  const { setLag } = useTasks()
  const toast = Toast.useToast()
  const { taskId, onTaskId, from, to } = proposal.lag

  const apply = () => {
    setLag(taskId, onTaskId, to)
    chat.decide(turn.id, 'applied')
    toast.add({
      title: 'Change applied',
      description: `${personFor(proposal.headsUpId).name} got a heads-up.`,
    })
  }
  const undo = () => {
    setLag(taskId, onTaskId, from)
    chat.decide(turn.id, undefined)
  }

  return (
    <Card emphasis="subtle">
      <Text>{proposal.text}</Text>
      <div className="flex flex-wrap items-center gap-2">
        {turn.decision === 'applied' ? (
          <>
            <Badge color="green">Applied</Badge>
            <Button appearance="ghost" size="small" onClick={undo}>
              Undo
            </Button>
          </>
        ) : turn.decision === 'dismissed' ? (
          <>
            <Text render={<span />} size="sm" color="subtle">
              Left as planned
            </Text>
            <Button appearance="ghost" size="small" onClick={apply}>
              Apply change
            </Button>
          </>
        ) : (
          <>
            <Button appearance="secondary" size="small" onClick={apply}>
              Apply change
            </Button>
            <Button
              appearance="ghost"
              size="small"
              onClick={() => chat.decide(turn.id, 'dismissed')}
            >
              Not now
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

/** A label over a wrapping row of Secondary Small chips, each of which asks. */
function Chips({
  label,
  prompts,
  onAsk,
}: {
  label: string
  prompts: readonly string[]
  onAsk: (prompt: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" weight="semibold" color="subtle">
        {label}
      </Text>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <Button key={prompt} appearance="secondary" size="small" onClick={() => onAsk(prompt)}>
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}
