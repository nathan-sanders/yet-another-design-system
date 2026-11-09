import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  AudioLines,
  ChevronDown,
  Ellipsis,
  MessageCircle,
  Plus,
  SquarePen,
  TriangleAlert,
  UserRoundCheck,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { ClickableCard } from '../../../../src/components/Card'
import { ChatComposer } from '../../../../src/components/Chat'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Menu } from '../../../../src/components/Menu'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { HomeTaskRow } from '../../components/HomeTaskRow'
import { HealthBadge, ProjectDot, ProjectProgress } from '../../components/ProjectCells'
import { day, fullDate, shortDate, today } from '../../data/dates'
import { projectFor } from '../../data/projects'
import type { Project } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { projectPath } from '../project/paths'
import { WeekStrip } from './WeekStrip'

const SUGGESTIONS = ['Plan the rest of my week', 'Summarize yesterday', 'What’s blocking Austin?']

/** Home's three, in the file's order. */
const YOUR_PROJECTS = ['austin', 'protein-plates', 'gift-cards']

function greeting(): string {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, Nathan`
}

/**
 * Home (`Home - Daily brief`, `40006266:3768`): Yet Social's daily brief in a
 * 700 column — a greeting and the day, Yak's composer with three
 * suggestions, then what needs you, your projects, and the week.
 *
 * Yak is not built in this app yet, so the composer and the suggestions say
 * so; Home has no floating bar, because the composer is the bar.
 */
export function HomeScreen() {
  const navigate = useNavigate()
  const shell = useShell()
  const tasks = useNeedsYou()

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
            onClick={() => shell.notBuilt('Customizing Home')}
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
                {fullDate.format(today)}. Four things need you today; Austin is the one to watch.
              </Text>
            </div>
            <ChatComposer
              aria-label="Message Yak"
              placeholder="Ask Yak, or tell it what to do…"
              onSubmit={() => shell.notBuilt('Yak')}
              // Yet Social's Yak composers are rounder than a form field.
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
                    size="small"
                    endIcon={ChevronDown}
                    onClick={() => shell.notBuilt('Choosing a model')}
                  >
                    Opus 5.5
                  </Button>
                  <Button
                    appearance="ghost"
                    startIcon={AudioLines}
                    aria-label="Voice input"
                    onClick={() => shell.notBuilt('Voice input')}
                  />
                </>
              }
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((prompt) => (
                <Button
                  key={prompt}
                  appearance="secondary"
                  size="small"
                  onClick={() => shell.notBuilt('Yak')}
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
            title="Your projects"
            menu={[{ label: 'All projects', onClick: () => navigate('/projects') }]}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {YOUR_PROJECTS.map((id) => (
                <ProjectCard key={id} project={projectFor(id)!} />
              ))}
            </div>
          </Block>

          <Block
            title="This week"
            menu={[{ label: 'Open My work', onClick: () => navigate('/my-work') }]}
            flush
          >
            <WeekStrip />
          </Block>
        </div>
      </AppShell.Content>
    </>
  )
}

/**
 * One of "Your projects": its name and dot, health and progress, and the next
 * milestone, on the subtle well the file draws (12 padding, 8 between rows).
 * The whole card opens the project.
 *
 * ClickableCard has no subtle emphasis (FINDINGS 3), so this is its ghost
 * card on the subtle fill, hovering to the translucent overlay so the pointer
 * still adds ink to a well that already sits at the usual hover fill.
 */
function ProjectCard({ project }: { project: Project }) {
  return (
    <ClickableCard
      emphasis="ghost"
      href={`#${projectPath(project.id)}`}
      className="min-w-0 border-surface-background-subtle bg-surface-background-subtle hover:border-transparent hover:bg-surface-overlay-subtle"
    >
      <span className="flex min-w-0 items-center gap-2">
        <ProjectDot project={project} />
        <span className="truncate">{project.name}</span>
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <HealthBadge project={project} />
        <ProjectProgress project={project} className="flex-1" />
      </span>
      <Text size="sm" color="subtle" truncate>
        {project.milestone.name} · {shortDate.format(day(project.milestone.date))}
      </Text>
    </ClickableCard>
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
 * "Needs you", as the file writes it. Each row goes somewhere real where it
 * can: the blocked permit opens Austin's list. The signage proof, the weekly
 * update and Priya's question are drawn (`Task - Proof review`, `Project -
 * Post update`, `Inbox - Reply in place`) and not built.
 */
function useNeedsYou() {
  const navigate = useNavigate()
  const shell = useShell()
  return [
    {
      id: 'signage',
      icon: UserRoundCheck,
      title: 'Approve the Austin signage proof',
      meta: 'Requested by Katie Powell · due today',
      action: 'Review',
      onAction: () => shell.notBuilt('Proof review'),
    },
    {
      id: 'permit',
      icon: TriangleAlert,
      title: 'Health permit is blocked',
      meta: 'Austin store opening · waiting on the electrical inspection',
      action: 'Open',
      onAction: () => navigate(projectPath('austin', 'list')),
    },
    {
      id: 'update',
      icon: SquarePen,
      title: 'Post your weekly update',
      meta: 'Protein Plates launch · due tomorrow',
      action: 'Write',
      onAction: () => shell.notBuilt('Post update'),
    },
    {
      id: 'priya',
      icon: MessageCircle,
      title: 'Priya asked about the Austin supplier list',
      meta: 'Finalize Austin supplier list · 2h ago',
      action: 'Reply',
      onAction: () => shell.notBuilt('Replying from Home'),
    },
  ]
}
