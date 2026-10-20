import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Ellipsis, FilePenLine, MessageCircle, TriangleAlert, UserCheck } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Menu } from '../../../../src/components/Menu'
import { MetricCard, MetricGrid } from '../../../../src/components/Metric'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { HomeTaskRow } from '../../components/HomeTaskRow'
import { addDays, formatTime } from '../../data/dates'
import { posts } from '../../data/posts'
import { useShell } from '../../shell/ShellContext'
import { useYakChat } from '../../yak/chat'
import { yakPath } from '../../yak/paths'
import { greeting } from '../../yak/greeting'
import { YakComposer } from '../../yak/YakPanel'
import { YakMark } from '../../yak/YakMark'
import { today } from '../calendar/model'
import { WeekStrip } from './WeekStrip'

const HOME = '/home'

const SUGGESTIONS = [
  'Plan the rest of the week',
  'Summarize the weekend',
  'Draft replies to urgent messages',
]

const dayAndDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']

/**
 * Home (`40005972:26336`, "Home - B · Daily brief"): a 700 column that opens on
 * Yak. A greeting and the day, Yak's composer with three suggestions, then what
 * needs you today, how the last few days went, and the week ahead.
 *
 * Anything asked here, typed or a suggestion, goes to Yak's full view, which
 * comes back here, so the page has no floating bar (`yak/floating.ts`).
 */
export function HomeScreen() {
  const navigate = useNavigate()
  const shell = useShell()
  const chat = useYakChat()
  const tasks = useTasks()

  const toYak = () => {
    shell.setPanel(null)
    navigate(yakPath(HOME))
  }
  const ask = (prompt: string) => {
    chat.ask(prompt, HOME)
    toYak()
  }

  // On a Monday that is Friday, as the file has it: the last three days.
  const since = `Since ${weekdayLong.format(addDays(today, -3))}`

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="semibold">
            Home
          </Heading>
        }
        end={
          <Button
            appearance="ghost"
            startIcon={Ellipsis}
            aria-label="More"
            onClick={() => shell.notBuilt('More actions')}
          />
        }
      />
      <AppShell.Content>
        <div className="mx-auto flex w-full max-w-175 flex-col gap-4 pt-10 pb-4">
          <section aria-labelledby="home-greeting" className="flex flex-col gap-4 pb-10">
            <div className="flex flex-col gap-2">
              <YakMark className="size-6 text-content-emphasized" />
              <Heading id="home-greeting" level={2} size="2xl" weight="bold">
                {greeting()}
              </Heading>
              <Text color="subtle">
                {dayAndDate.format(today)}. {COUNT_WORDS[tasks.length] ?? tasks.length} things need
                you today; everything else is on track.
              </Text>
            </div>
            <YakComposer from={HOME} placeholder="Ask Yak, or tell it what to do…" onAsk={toYak} />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((prompt) => (
                <Button
                  key={prompt}
                  appearance="secondary"
                  size="small"
                  onClick={() => ask(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </section>

          <Block
            title={`Needs you · ${tasks.length}`}
            menu={[{ label: 'Hide this card', onClick: () => shell.notBuilt('Hiding cards') }]}
          >
            <ul className="flex flex-col divide-y divide-surface-border">
              {tasks.map((task) => (
                <HomeTaskRow key={task.id} {...task} />
              ))}
            </ul>
          </Block>

          <Block
            title={since}
            menu={[{ label: 'Open reports', onClick: () => navigate('/measure/reports') }]}
          >
            <MetricGrid columns={3}>
              <MetricCard label="New followers" value="+1,284" trend={18} />
              <MetricCard label="Engagements" value="14.9K" trend={6} />
              <MetricCard label="Replies sent" value="212" trend={9} />
            </MetricGrid>
          </Block>

          <Block
            title="This week"
            menu={[{ label: 'Open calendar', onClick: () => navigate('/plan/calendar') }]}
            flush
          >
            <WeekStrip />
          </Block>
        </div>
      </AppShell.Content>
    </>
  )
}

/** A Home card: Content Block with the file's header and its ⋯ menu. */
function Block({
  title,
  menu,
  flush = false,
  children,
}: {
  title: string
  menu: { label: string; onClick: () => void }[]
  /** Content runs to the block's edges, for the week strip. */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <ContentBlock headingLevel={2} className="h-auto shrink-0">
      <ContentBlock.Header
        actions={
          <Menu>
            <Menu.Trigger
              render={
                <Button appearance="ghost" startIcon={Ellipsis} aria-label={`${title} options`} />
              }
            />
            <Menu.Popup aria-label={`${title} options`}>
              <Menu.Group>
                {menu.map((item) => (
                  <Menu.Item key={item.label} onClick={item.onClick}>
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu>
        }
      >
        {title}
      </ContentBlock.Header>
      <ContentBlock.Content className={flush ? 'p-0' : undefined}>{children}</ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * The "Needs you" list. Each row points at something real in the mock: the
 * week to review, the Instagram post from the calendar, the Reddit question
 * from Discover, the idea in progress on the board.
 */
function useTasks() {
  const navigate = useNavigate()
  const shell = useShell()
  // The post the file says failed: this morning's Instagram post.
  const failed = posts.find((post) => post.id === 'p-13')!

  return [
    {
      id: 'approve',
      icon: UserCheck,
      title: 'Approve 2 posts for Smoothie Week',
      meta: 'Submitted by Maya Okafor · due today, 11:00 am',
      action: 'Review',
      onAction: () => navigate('/plan/calendar'),
    },
    {
      id: 'failed',
      icon: TriangleAlert,
      title: 'An Instagram post didn’t publish',
      meta: `${failed.body} · ${formatTime(failed.time)} · reconnect Instagram to retry`,
      action: 'Fix',
      onAction: () => shell.setPanel({ type: 'post', postId: failed.id }),
    },
    {
      id: 'reply',
      icon: MessageCircle,
      title: 'Reply to @carterdokidis',
      meta: 'Packaging question · trending on Reddit · 8h ago',
      action: 'Reply',
      onAction: () => shell.notBuilt('Replying from Home'),
    },
    {
      id: 'draft',
      icon: FilePenLine,
      title: 'Finish the Harvest Glow reel',
      meta: 'In progress on Ideas · Seasonal Items',
      action: 'Open',
      onAction: () => navigate('/plan/ideas'),
    },
  ]
}
