import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  Link as LinkIcon,
  SearchX,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Badge } from '../../../../src/components/Badge'
import { Breadcrumbs } from '../../../../src/components/Breadcrumbs'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Heading, Text } from '../../../../src/components/Text'
import { useToast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { RichBody } from '../../components/RichBody'
import { blockerOf } from '../../components/taskMeta'
import { projectFor } from '../../data/projects'
import type { Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { projectPath, taskKey, taskPagePath } from '../project/paths'
import {
  CommentComposer,
  Dependencies,
  DetailTabs,
  Linked,
  Properties,
  Subtasks,
  type DetailTab,
} from '../project/TaskPanel'
import { SectionLevel } from '../project/sectionLevel'
import { useTasks } from '../project/tasksState'
import { neighbours } from './model'
import { AgentRunSection, PullRequestSection } from './PullParts'
import { useTaskFromKey } from './useTaskFromKey'

/** A task key that names nothing: one typed by hand, or a task taken away. */
export function NoSuchTask() {
  return (
    <AppShell.Content>
      <NotBuiltMessage
        icon={SearchX}
        title="No task here"
        body="This link doesn’t open a task any more."
        link={{ href: '#/projects', label: 'All projects' }}
      />
    </AppShell.Content>
  )
}

/** The trail in the top bar: Projects / Mobile ordering app / MOB-52, and more after it. */
export function TaskTrail({ task, current }: { task: Task; current?: string }) {
  const project = projectFor(task.projectId)
  return (
    <Breadcrumbs className="min-w-0">
      {project ? <Breadcrumbs.Item href="#/projects">Projects</Breadcrumbs.Item> : null}
      {project ? (
        <Breadcrumbs.Item href={`#${projectPath(project.id, 'list')}`}>
          {project.name}
        </Breadcrumbs.Item>
      ) : (
        <Breadcrumbs.Item href="#/my-work/list">My work</Breadcrumbs.Item>
      )}
      {/* Semibold is the file's override on the current item, as the project page's is. */}
      <Breadcrumbs.Item className="font-semibold">
        {current ? `${taskKey(task)} · ${current}` : taskKey(task)}
      </Breadcrumbs.Item>
    </Breadcrumbs>
  )
}

/**
 * A task's full view: the panel's pieces in two columns, as `Task - Code in
 * description` (`40006589:61264`), `Task - Linked pull request`
 * (`40006589:62036`) and `Task - Yak coding agent` (`40006589:63143`) draw
 * it. The main column is 40 from a 320 side column of properties and links;
 * the conversation and its composer close the main column. The top bar's
 * arrows step through the project's tasks in place.
 */
export function TaskPage() {
  const task = useTaskFromKey()
  if (!task) return <NoSuchTask />
  // Keyed, so stepping to the next task starts on its Comments, at the top.
  return <TaskView key={task.id} task={task} />
}

function TaskView({ task }: { task: Task }) {
  const navigate = useNavigate()
  const shell = useShell()
  const toast = useToast()
  const { tasks } = useTasks()
  const [tab, setTab] = useState<DetailTab>('comments')
  const at = neighbours(task, tasks)
  const blocker = blockerOf(task, tasks)

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href)
    toast.add({ title: 'Link copied', description: `${taskKey(task)} · ${task.title}` })
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back to the project"
              className="shrink-0"
              onClick={() =>
                navigate(task.projectId ? projectPath(task.projectId, 'list') : '/my-work/list')
              }
            />
            <TaskTrail task={task} />
          </div>
        }
        end={
          <>
            <Text render={<span />} size="sm" color="subtle" className="max-md:hidden">
              {at.position} of {at.total}
            </Text>
            <Button
              appearance="ghost"
              startIcon={ChevronUp}
              aria-label="Previous task"
              disabled={!at.previous}
              onClick={() => at.previous && navigate(taskPagePath(at.previous))}
            />
            <Button
              appearance="ghost"
              startIcon={ChevronDown}
              aria-label="Next task"
              disabled={!at.next}
              onClick={() => at.next && navigate(taskPagePath(at.next))}
            />
            <Button
              appearance="ghost"
              startIcon={LinkIcon}
              aria-label="Copy link"
              onClick={copyLink}
            />
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Task actions')}
            />
          </>
        }
      />
      <AppShell.Content className="p-4">
        <SectionLevel.Provider value={2}>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <Heading level={1} size="xl" weight="bold">
                {task.title}
              </Heading>
              {blocker ? (
                <Card emphasis="subtle" className="flex-row items-center">
                  <Badge color="red">Blocked</Badge>
                  <Text render={<span />} size="sm" className="min-w-0 flex-1 truncate">
                    Waiting on {blocker.title}
                  </Text>
                  <Button
                    appearance="secondary"
                    size="small"
                    aria-label={`Open ${blocker.title}`}
                    onClick={() => navigate(taskPagePath(blocker))}
                  >
                    Open
                  </Button>
                </Card>
              ) : null}
              {task.description ? <RichBody body={task.description} /> : null}
              {task.pullRequest ? (
                <PullRequestSection task={task} pull={task.pullRequest} />
              ) : (
                <AgentRunSection task={task} />
              )}
              <Subtasks task={task} />
              <Dependencies task={task} tasks={tasks} />
              <div className="flex flex-col gap-3">
                <DetailTabs
                  task={task}
                  tab={tab}
                  onTabChange={setTab}
                  reactions={false}
                  className="pt-3"
                />
                {tab === 'comments' ? <CommentComposer task={task} /> : null}
              </div>
            </div>
            <aside aria-label="Details" className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
              <Properties task={task} />
              <Linked task={task} />
            </aside>
          </div>
        </SectionLevel.Provider>
      </AppShell.Content>
    </>
  )
}
