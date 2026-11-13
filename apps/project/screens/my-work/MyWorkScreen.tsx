import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { useShell } from '../../shell/ShellContext'
import { floatingYakClearance } from '../../yak/floating'
import { TASK_PARAM, taskKey } from '../project/paths'
import { TaskPanel } from '../project/TaskPanel'
import { useTasks } from '../project/tasksState'
import { MY_WORK_VIEWS, myWorkPath, type MyWorkView } from './paths'
import { WorkBoard } from './WorkBoard'
import { WorkCalendar } from './WorkCalendar'
import { WorkList } from './WorkList'

/** `#/my-work` opens on the List, the file's first view. */
export function MyWorkIndex() {
  return <Navigate to={myWorkPath()} replace />
}

/**
 * My work (`My work - List`, `40006266:4756`): everything that is yours,
 * across projects. The Top Bar holds the title and the Segment Control
 * that switches List, Board and Calendar, then Filter and More, Ghost at
 * the default size; the view is in the path. A task opens in its panel over
 * whichever view it was opened from, as on a project's page, and Yak and a
 * task's panel take turns, one at a time.
 */
export function MyWorkScreen() {
  const { view } = useParams()
  const current = MY_WORK_VIEWS.find((v) => v.id === view)
  if (!current) return <MyWorkIndex />
  return <MyWork view={current.id} />
}

function MyWork({ view }: { view: MyWorkView }) {
  const navigate = useNavigate()
  const shell = useShell()
  const [params] = useSearchParams()
  const { tasks } = useTasks()
  const requested = params.get(TASK_PARAM)
  const openTask = tasks.find((task) => requested !== null && taskKey(task) === requested)

  // ProjectPage's arrangement: a task opening closes Yak, and the panel
  // keeps the last task while it slides closed.
  const { yakOpen, closeYak } = shell
  const lastTaskId = useRef(openTask?.id)
  useEffect(() => {
    if (openTask && openTask.id !== lastTaskId.current && yakOpen) closeYak()
    lastTaskId.current = openTask?.id
  }, [openTask, yakOpen, closeYak])
  const [shownTaskId, setShownTaskId] = useState(openTask?.id)
  if (openTask && openTask.id !== shownTaskId) setShownTaskId(openTask.id)
  const closeTask = () => navigate(myWorkPath(view))

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              My work
            </Heading>
            <SegmentedControl
              aria-label="View"
              appearance="secondary"
              value={view}
              // Switching views keeps an open task open.
              onValueChange={(next) =>
                navigate({ pathname: myWorkPath(next as MyWorkView), search: params.toString() })
              }
            >
              {MY_WORK_VIEWS.map((v) => (
                <SegmentedControl.Item key={v.id} value={v.id}>
                  {v.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        }
        end={
          <>
            {/* Hidden on a phone, as a project's Copy link is: the views need the room. */}
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              className="max-md:hidden"
              onClick={() => shell.notBuilt('Filtering My work')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('My work actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {view === 'list' ? (
          <WorkList selectedTaskId={openTask?.id} panelOpen={Boolean(openTask) || yakOpen} />
        ) : view === 'board' ? (
          <WorkBoard selectedTaskId={openTask?.id} />
        ) : (
          <WorkCalendar />
        )}
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
