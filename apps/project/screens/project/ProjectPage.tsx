import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  Calendar,
  CircleCheck,
  CircleUser,
  Ellipsis,
  Link as LinkIcon,
  PencilRuler,
  SquarePen,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Breadcrumbs } from '../../../../src/components/Breadcrumbs'
import { Button } from '../../../../src/components/Button'
import { Tabs } from '../../../../src/components/Tabs'
import { Heading } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { floatingYakClearance } from '../../yak/floating'
import { HEALTH } from '../../components/taskMeta'
import { day, rangeLabel } from '../../data/dates'
import { personFor } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { Project, ProjectHealth } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { NotBuilt } from '../NotBuilt'
import { BoardView } from './BoardView'
import { CalendarView } from './CalendarView'
import { ListView } from './ListView'
import { OverviewView } from './OverviewView'
import { DEFAULT_TAB, projectPath, TASK_PARAM, tabsFor, taskKey, type ProjectTab } from './paths'
import { TaskPanel } from './TaskPanel'
import { TimelineView } from './TimelineView'
import { useTasks } from './tasksState'

/** The health button's glyph: the warning for trouble, a check when it is fine. */
const HEALTH_ICON: Record<ProjectHealth, LucideIcon> = {
  'at-risk': TriangleAlert,
  'off-track': TriangleAlert,
  'on-track': CircleCheck,
  'not-started': CircleCheck,
}

/** `#/projects/austin` opens the project on its default tab. */
export function ProjectIndex() {
  const { projectId = '' } = useParams()
  return <Navigate to={projectPath(projectId)} replace />
}

/**
 * A project's page (`Yet Project / Project shell`, `40006263:1152`): Back and
 * the Projects breadcrumb in the Top Bar, `_Project Header`'s row of
 * Secondary buttons, the tabs, then the open tab's view. The tab is in the
 * path (`#/projects/austin/list`), so every view has a link.
 */
export function ProjectPage() {
  const { projectId = '', tab } = useParams()
  const project = projectFor(projectId)
  if (!project) return <NotBuilt />
  const tabs = tabsFor(project.sprints)
  const current = tabs.find((t) => t.id === tab)
  if (!current) return <Navigate to={projectPath(project.id, DEFAULT_TAB)} replace />
  return <ProjectView project={project} tab={current.id} />
}

function ProjectView({ project, tab }: { project: Project; tab: ProjectTab }) {
  const navigate = useNavigate()
  const shell = useShell()
  const tabs = tabsFor(project.sprints)
  const health = HEALTH[project.health]
  const owner = personFor(project.ownerId)

  // The open task is in the URL (`?task=AUS-24`); the panel keeps showing the
  // last one while it slides closed.
  const [params] = useSearchParams()
  const { tasks } = useTasks()
  const requested = params.get(TASK_PARAM)
  const openTask = tasks.find(
    (task) => task.projectId === project.id && requested !== null && taskKey(task) === requested,
  )
  // One panel at a time: a task opening closes Yak. Only when the task
  // changes — Yak opening over a task clears `?task=` itself.
  const { yakOpen, closeYak } = shell
  const lastTaskId = useRef(openTask?.id)
  useEffect(() => {
    if (openTask && openTask.id !== lastTaskId.current && yakOpen) closeYak()
    lastTaskId.current = openTask?.id
  }, [openTask, yakOpen, closeYak])
  const [shownTaskId, setShownTaskId] = useState(openTask?.id)
  if (openTask && openTask.id !== shownTaskId) setShownTaskId(openTask.id)
  const closeTask = () => navigate(projectPath(project.id, tab))

  const toast = Toast.useToast()
  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href)
    toast.add({
      title: 'Link copied',
      description: `Anyone in Veggie Vault can open ${project.name}.`,
    })
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            {/* A path, not history, so it works on a link opened cold. */}
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back to all projects"
              className="shrink-0"
              onClick={() => navigate('/projects')}
            />
            {/* The breadcrumb names the page to the eye; this names it to a
                screen reader's heading list, as Yet Social's campaign page does. */}
            <Heading level={1} className="sr-only">
              {project.name}
            </Heading>
            <Breadcrumbs className="min-w-0">
              <Breadcrumbs.Item href="#/projects">Projects</Breadcrumbs.Item>
              {/* Semibold is the file's override on this instance; the library's
                  Current Page is normal (Yet Social's FINDINGS 214). */}
              <Breadcrumbs.Item className="font-semibold">{project.name}</Breadcrumbs.Item>
            </Breadcrumbs>
          </div>
        }
        end={
          <>
            {/* Hidden on a phone, as Yet Social's is: the breadcrumb needs the room. */}
            <Button
              appearance="ghost"
              startIcon={LinkIcon}
              aria-label="Copy link"
              className="max-md:hidden"
              onClick={copyLink}
            />
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Project actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {/* Every level down to the view is `flex-1`, so the Board can fill
            what is left of the page and scroll inside it; the List's own
            height still pushes the page past it and the page scrolls. */}
        <div className="flex flex-1 flex-col gap-3">
          {/* `_Project Header` (`40006263:1518`): health, dates and owner on the
              left, Post update on the right, all Secondary at the default size. */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              appearance="secondary"
              startIcon={HEALTH_ICON[project.health]}
              aria-label={`Health: ${health.label}`}
              onClick={() => shell.notBuilt('Changing health')}
            >
              {health.label}
            </Button>
            <Button
              appearance="secondary"
              startIcon={Calendar}
              aria-label={`Dates: ${rangeLabel(day(project.start), day(project.due))}`}
              onClick={() => shell.notBuilt('Changing dates')}
            >
              {rangeLabel(day(project.start), day(project.due))}
            </Button>
            <Button
              appearance="secondary"
              startIcon={CircleUser}
              aria-label={`Owner: ${owner.name}`}
              onClick={() => shell.notBuilt('Changing the owner')}
            >
              {owner.name}
            </Button>
            <Button
              appearance="secondary"
              startIcon={SquarePen}
              className="ml-auto"
              onClick={() => shell.notBuilt('Post update')}
            >
              Post update
            </Button>
          </div>

          <Tabs
            value={tab}
            onValueChange={(value) => navigate(projectPath(project.id, value as ProjectTab))}
            className="flex flex-1 flex-col gap-3"
          >
            {/* Seven tabs are wider than a phone and Tabs has no overflow menu
                (Yet Social's FINDINGS 188), so below that the strip scrolls. */}
            <div className="-mx-4 overflow-x-auto px-4">
              <Tabs.List aria-label={`${project.name} views`} className="min-w-max">
                {tabs.map((t) => (
                  <Tabs.Tab key={t.id} value={t.id}>
                    {t.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </div>
            {tabs.map((t) => (
              <Tabs.Panel key={t.id} value={t.id} className="flex flex-1 flex-col">
                {t.id === 'overview' ? (
                  <OverviewView project={project} />
                ) : t.id === 'list' ? (
                  <ListView
                    project={project}
                    selectedTaskId={openTask?.id}
                    panelOpen={Boolean(openTask)}
                  />
                ) : t.id === 'board' ? (
                  <BoardView project={project} selectedTaskId={openTask?.id} />
                ) : t.id === 'timeline' ? (
                  <TimelineView project={project} />
                ) : t.id === 'calendar' ? (
                  <CalendarView project={project} />
                ) : (
                  <NotBuiltMessage
                    icon={PencilRuler}
                    title="Designed, not built yet"
                    body={`${project.name}’s ${t.label} view is drawn in Figma and comes in a later slice of this app.`}
                    figma={t.figma}
                  />
                )}
              </Tabs.Panel>
            ))}
          </Tabs>
        </div>
      </AppShell.Content>
      {shell.screenPanelHost
        ? createPortal(
            <TaskPanel taskId={shownTaskId} open={Boolean(openTask)} onClose={closeTask} />,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}
