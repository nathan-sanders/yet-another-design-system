import { useNavigate, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  AtSign,
  Ellipsis,
  ExternalLink,
  GitPullRequest,
  Paperclip,
  Smile,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { ChatComposer } from '../../../../src/components/Chat'
import { Code } from '../../../../src/components/Code'
import { CodeBlock } from '../../../../src/components/CodeBlock'
import { Divider } from '../../../../src/components/Divider'
import { Icon } from '../../../../src/components/Icon'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../src/components/Text'
import { useToast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { me } from '../../data/people'
import type { DiffFile, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { taskPagePath } from '../project/paths'
import { Comment } from '../project/TaskPanel'
import { useTasks } from '../project/tasksState'
import { statLine } from './model'
import { AgentSteps, Checks, MergeLine, ReviewerRow } from './PullParts'
import { NoSuchTask, TaskTrail } from './TaskPage'
import { useTaskFromKey } from './useTaskFromKey'

type DiffView = 'unified' | 'split'

/** One file's change: the library's diff CodeBlock, split before | after when asked. */
function FileChange({ file, view }: { file: DiffFile; view: DiffView }) {
  return (
    <CodeBlock
      code={file.diff}
      diff
      split={view === 'split'}
      language={file.language}
      title={file.path}
      size="small"
    />
  )
}

/**
 * A pull request's changes (`Review - Pull request changes`,
 * `40006589:62699`): the files on a subtle well with 16 of padding, beside a
 * 340 column of reviewers, checks and line comments with a composer under
 * them. The top bar holds Unified / Split (`?view=split`), Open in GitHub,
 * and your Request changes and Approve.
 *
 * Opened from Yak's proposed change before there is a pull request, it shows
 * the draft: the same files, Yak's run in the side column, and Open pull
 * request where Approve would be.
 */
export function ReviewPage() {
  const task = useTaskFromKey()
  if (!task) return <NoSuchTask />
  return <Review key={task.id} task={task} />
}

function Review({ task }: { task: Task }) {
  const navigate = useNavigate()
  const shell = useShell()
  const toast = useToast()
  const { reviewPull, addReviewComment, openAgentPull } = useTasks()
  const [params, setParams] = useSearchParams()
  const view: DiffView = params.get('view') === 'split' ? 'split' : 'unified'
  const pull = task.pullRequest
  const run = task.agent
  const files = pull?.files ?? run?.files ?? []
  const mine = pull?.reviewers.find((r) => r.personId === me.id)?.state

  const verdict = (state: 'approved' | 'changes') => {
    if (!pull) return
    reviewPull(task.id, state)
    toast.add(
      state === 'approved'
        ? { title: `You approved #${pull.number}`, description: pull.title }
        : {
            title: `You requested changes on #${pull.number}`,
            description: 'Leave a comment saying what to change.',
          },
    )
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label={`Back to ${task.title}`}
              className="shrink-0"
              onClick={() => navigate(taskPagePath(task))}
            />
            <Heading level={1} className="sr-only">
              {pull
                ? `Pull request #${pull.number}: ${pull.title}`
                : `Yak’s change to ${task.title}`}
            </Heading>
            <TaskTrail
              task={task}
              current={pull ? `Pull request #${pull.number}` : 'Proposed change'}
            />
          </div>
        }
        end={
          <>
            <SegmentedControl
              aria-label="Diff view"
              appearance="secondary"
              value={view}
              onValueChange={(next) =>
                setParams(next === 'split' ? { view: 'split' } : {}, { replace: true })
              }
              className="max-md:hidden"
            >
              <SegmentedControl.Item value="unified">Unified</SegmentedControl.Item>
              <SegmentedControl.Item value="split">Split</SegmentedControl.Item>
            </SegmentedControl>
            {pull ? (
              <>
                <Button
                  appearance="ghost"
                  startIcon={ExternalLink}
                  className="max-lg:hidden"
                  onClick={() => shell.notBuilt('Opening the pull request in GitHub')}
                >
                  Open in GitHub
                </Button>
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label="More"
                  onClick={() => shell.notBuilt('Pull request actions')}
                />
                <Button
                  appearance="secondary"
                  disabled={mine === 'changes'}
                  onClick={() => verdict('changes')}
                >
                  Request changes
                </Button>
                <Button disabled={mine === 'approved'} onClick={() => verdict('approved')}>
                  Approve
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  openAgentPull(task.id)
                  toast.add({ title: 'Pull request opened', description: task.title })
                }}
              >
                Open pull request
              </Button>
            )}
          </>
        }
      />
      <AppShell.Content className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-0">
          <section
            aria-label="Changes"
            className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg bg-surface-background-subtle p-4"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon={GitPullRequest} />
                <Text
                  render={<span />}
                  size="lg"
                  weight="semibold"
                  color="emphasized"
                  className="shrink-0"
                >
                  {pull?.title ?? task.title}
                </Text>
                <Text render={<span />} size="lg" color="subtle" className="min-w-0 flex-1">
                  {pull ? `#${pull.number}` : null}
                </Text>
                <Badge
                  color={pull ? (pull.state === 'merged' ? 'purple' : 'blue') : 'neutral'}
                  className="shrink-0"
                >
                  {pull ? (pull.state === 'merged' ? 'Merged' : 'In review') : 'Draft'}
                </Badge>
              </div>
              {pull ? (
                <MergeLine pull={pull} stat />
              ) : (
                <Text size="sm" color="subtle">
                  Yak drafted this change from {run?.from} · {statLine(files)}
                </Text>
              )}
            </div>
            {files.map((file) => (
              <FileChange key={file.path} file={file} view={view} />
            ))}
          </section>

          <aside aria-label="Review" className="flex shrink-0 flex-col gap-4 lg:w-89 lg:pl-4">
            {pull ? (
              <>
                <section aria-labelledby="reviewers" className="flex flex-col gap-2">
                  <Heading level={2} size="base" id="reviewers">
                    Reviewers
                  </Heading>
                  <ul className="flex flex-col gap-2">
                    {pull.reviewers.map((r) => (
                      <ReviewerRow key={r.personId} {...r} />
                    ))}
                  </ul>
                  <Checks pull={pull} />
                </section>
                <Divider />
                <section aria-labelledby="review-comments" className="flex flex-col gap-4">
                  <Heading level={2} size="base" id="review-comments">
                    {pull.comments.length ? `Comments · ${pull.comments.length}` : 'Comments'}
                  </Heading>
                  {pull.comments.length ? (
                    // The log is a wrapper: on the <ul> itself the role would replace the list's.
                    <div role="log" aria-label="Comments">
                      <ul className="flex flex-col gap-4">
                        {pull.comments.map((comment) => (
                          <li key={comment.id} className="flex flex-col items-start gap-2">
                            {comment.at ? <Code color="secondary">{comment.at}</Code> : null}
                            <div className="self-stretch">
                              <Comment comment={comment} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <ChatComposer
                    aria-label="Comment on this pull request"
                    placeholder="Comment on this pull request…"
                    actions={
                      <>
                        <Button
                          appearance="ghost"
                          startIcon={AtSign}
                          aria-label="Mention"
                          onClick={() => shell.notBuilt('Mentions')}
                        />
                        <Button
                          appearance="ghost"
                          startIcon={Paperclip}
                          aria-label="Attach"
                          onClick={() => shell.notBuilt('Attachments')}
                        />
                        <Button
                          appearance="ghost"
                          startIcon={Smile}
                          aria-label="Emoji"
                          onClick={() => shell.notBuilt('Emoji')}
                        />
                      </>
                    }
                    onSubmit={(body) => addReviewComment(task.id, body)}
                  />
                </section>
              </>
            ) : run ? (
              <section aria-labelledby="yak-run" className="flex flex-col gap-2">
                <Heading level={2} size="base" id="yak-run">
                  Yak’s run
                </Heading>
                <span className="flex items-center gap-2">
                  <YakMark className="size-4 text-content-primary" />
                  <Text render={<span />} size="sm" color="subtle">
                    {run.attempt > 1 ? `Run ${run.attempt}` : 'First run'}
                  </Text>
                </span>
                <AgentSteps steps={run.steps} />
                <CodeBlock code={run.command} language="bash" languageLabel={false} size="small" />
              </section>
            ) : null}
          </aside>
        </div>
      </AppShell.Content>
    </>
  )
}
