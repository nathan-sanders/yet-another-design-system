import { useNavigate } from 'react-router'
import {
  AudioLines,
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
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { HomeTaskRow } from '../../components/HomeTaskRow'
import { MenuBlock } from '../../components/MenuBlock'
import { HealthBadge, ProjectDot, ProjectProgress } from '../../components/ProjectCells'
import { day, fullDate, shortDate, today } from '../../data/dates'
import { projectFor } from '../../data/projects'
import type { Project } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useYakChat } from '../../yak/chat'
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
 * The composer and the suggestions open Yak's panel on a fresh chat. Home
 * has no floating bar, because the composer is the bar.
 */
export function HomeScreen() {
  const navigate = useNavigate()
  const shell = useShell()
  const tasks = useNeedsYou()
  const chat = useYakChat()
  const askYak = (prompt: string) => {
    chat.start(prompt)
    shell.openYak()
  }

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
              onSubmit={askYak}
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
              // No model picker: Yet Social took it out of Yak's composers (#370).
              endActions={
                <Button
                  appearance="ghost"
                  startIcon={AudioLines}
                  aria-label="Voice input"
                  onClick={() => shell.notBuilt('Voice input')}
                />
              }
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((prompt) => (
                <Button
                  key={prompt}
                  appearance="secondary"
                  size="small"
                  onClick={() => askYak(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </section>

          <MenuBlock
            title={`Needs you · ${tasks.length}`}
            menu={[{ label: 'Hide this card', onClick: () => shell.notBuilt('Hiding cards') }]}
          >
            <ul className="flex flex-col divide-y divide-surface-border">
              {tasks.map((task) => (
                <HomeTaskRow key={task.id} {...task} />
              ))}
            </ul>
          </MenuBlock>

          <MenuBlock
            title="Your projects"
            menu={[{ label: 'All projects', onClick: () => navigate('/projects') }]}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {YOUR_PROJECTS.map((id) => (
                <ProjectCard key={id} project={projectFor(id)!} />
              ))}
            </div>
          </MenuBlock>

          <MenuBlock
            title="This week"
            menu={[{ label: 'Open My work', onClick: () => navigate('/my-work') }]}
            flush
          >
            <WeekStrip />
          </MenuBlock>
        </div>
      </AppShell.Content>
    </>
  )
}

/**
 * One of "Your projects": its name and dot, health and progress, and the next
 * milestone, on ClickableCard's default card (12 padding, 8 between rows).
 * The whole card opens the project.
 *
 * The file draws these as subtle wells; Nathan's call is the default card
 * (FINDINGS 3), so the library needs no subtle emphasis for it.
 */
function ProjectCard({ project }: { project: Project }) {
  return (
    <ClickableCard href={`#${projectPath(project.id)}`} className="min-w-0">
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
