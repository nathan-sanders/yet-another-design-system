import { useNavigate } from 'react-router'
import {
  CircleCheck,
  CircleCheckBig,
  ExternalLink,
  FileDiff,
  GitPullRequest,
  Zap,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Code } from '../../../../src/components/Code'
import { CodeBlock } from '../../../../src/components/CodeBlock'
import { Divider } from '../../../../src/components/Divider'
import { Icon } from '../../../../src/components/Icon'
import { Text } from '../../../../src/components/Text'
import { personFor } from '../../data/people'
import type { PullRequest, ReviewState, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { SectionHeading } from '../project/TaskPanel'
import { reviewPath } from '../project/paths'
import { useTasks } from '../project/tasksState'
import { REVIEW_BADGE, statLine } from './model'
import { authorName } from './pullState'

/** `_Reviewer Row` (`40006591:62667`): a 20px face, the name, and where they stand. */
export function ReviewerRow({ personId, state }: { personId: string; state: ReviewState }) {
  const person = personFor(personId)
  const badge = REVIEW_BADGE[state]
  return (
    <li className="flex items-center gap-2">
      <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
      <span className="min-w-0 flex-1 truncate text-content-primary">{person.name}</span>
      <Badge color={badge.color} className="shrink-0">
        {badge.label}
      </Badge>
    </li>
  )
}

/** "3 of 3 checks passed", with its check. */
export function Checks({ pull }: { pull: PullRequest }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 text-content-subtle">
      <Icon icon={CircleCheck} size="small" />
      <Text render={<span />} size="sm" color="subtle" truncate>
        {pull.checks.passed} of {pull.checks.total} checks passed
      </Text>
    </span>
  )
}

/** "Theo Lindqvist wants to merge 3 commits into `main` from `theo/…`", in subtle words. */
export function MergeLine({ pull, stat = false }: { pull: PullRequest; stat?: boolean }) {
  const who = authorName(pull.authorId, (id) => personFor(id).name)
  return (
    <Text size="sm" color="subtle">
      {who} wants to merge {pull.commits} {pull.commits === 1 ? 'commit' : 'commits'} into{' '}
      <Code color="secondary">{pull.base}</Code> from <Code color="secondary">{pull.branch}</Code>
      {stat ? ` · ${statLine(pull.files)}` : null}
    </Text>
  )
}

/**
 * Pull request, under a task's description (`Task - Linked pull request`,
 * `40006589:62036`): a Subtle Card with the title, number and state, who
 * wants to merge what, the reviewers, the checks and the size of the change,
 * then Review changes and Open in GitHub. Under it, the branch as a one-line
 * command and what the rule will do with the task.
 */
export function PullRequestSection({ task, pull }: { task: Task; pull: PullRequest }) {
  const navigate = useNavigate()
  const shell = useShell()
  const merged = pull.state === 'merged'
  return (
    <section aria-labelledby={`${task.id}-pull`} className="flex flex-col gap-2 pt-3">
      <SectionHeading id={`${task.id}-pull`}>Pull request</SectionHeading>
      <Card emphasis="subtle">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon icon={GitPullRequest} />
            <Text render={<span />} weight="semibold" color="emphasized" className="shrink-0">
              {pull.title}
            </Text>
            <Text render={<span />} color="subtle" className="min-w-0 flex-1">
              #{pull.number}
            </Text>
            <Badge color={merged ? 'purple' : 'blue'} className="shrink-0">
              {merged ? 'Merged' : 'In review'}
            </Badge>
          </div>
          <MergeLine pull={pull} />
          <Divider />
          <ul aria-label="Reviewers" className="flex flex-col gap-2">
            {pull.reviewers.map((r) => (
              <ReviewerRow key={r.personId} {...r} />
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Checks pull={pull} />
            <Text render={<span />} size="sm" color="subtle" className="shrink-0">
              {statLine(pull.files)}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              appearance="secondary"
              size="small"
              startIcon={FileDiff}
              onClick={() => navigate(reviewPath(task))}
            >
              Review changes
            </Button>
            <Button
              appearance="ghost"
              size="small"
              startIcon={ExternalLink}
              onClick={() => shell.notBuilt('Opening the pull request in GitHub')}
            >
              Open in GitHub
            </Button>
          </div>
        </div>
      </Card>
      <CodeBlock code={`git checkout ${pull.branch}`} language="bash" languageLabel={false} />
      <span className="flex items-center gap-2 text-content-subtle">
        <Icon icon={Zap} size="small" />
        <Text render={<span />} size="sm" color="subtle">
          Moved to In review when the pull request opened. Moves to Done when it merges.
        </Text>
      </span>
    </section>
  )
}

/** The run's steps, each with the done circle `_Task Name Cell` draws. */
export function AgentSteps({ steps }: { steps: string[] }) {
  return (
    <ul aria-label="What Yak did" className="flex flex-col gap-1">
      {steps.map((step) => (
        <li key={step} className="flex h-6 items-center gap-2 text-content-primary">
          <Icon icon={CircleCheckBig} />
          <span className="min-w-0 flex-1 truncate">{step}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Proposed change (`Task - Yak coding agent`, `40006589:63143`): Yak's note
 * on what it drafted from, the steps it took, the command it checked with
 * and the diff, both set into the card as Sections, then Open pull request
 * (Secondary), Review changes and Try again (Ghost), all small. Once the
 * pull request is open, the task shows that instead.
 */
export function AgentRunSection({ task }: { task: Task }) {
  const navigate = useNavigate()
  const { openAgentPull, retryAgent } = useTasks()
  const run = task.agent
  if (!run) return null
  return (
    <section aria-labelledby={`${task.id}-change`} className="flex flex-col gap-2 pt-3">
      <SectionHeading id={`${task.id}-change`}>Proposed change</SectionHeading>
      <Card emphasis="subtle">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2">
            <YakMark className="size-4 text-content-primary" />
            <Text render={<span />} size="sm" color="subtle" aria-live="polite">
              Yak drafted this change {run.attempt > 1 ? 'again ' : ''}from {run.from}
            </Text>
          </span>
          <AgentSteps steps={run.steps} />
          <CodeBlock
            code={run.command}
            language="bash"
            languageLabel={false}
            container="section"
            size="small"
          />
          {run.files.map((file) => (
            <CodeBlock
              key={file.path}
              code={file.diff}
              diff
              language={file.language}
              title={file.path}
              container="section"
              size="small"
            />
          ))}
          <div className="flex items-center gap-2">
            <Button appearance="secondary" size="small" onClick={() => openAgentPull(task.id)}>
              Open pull request
            </Button>
            <Button appearance="ghost" size="small" onClick={() => navigate(reviewPath(task))}>
              Review changes
            </Button>
            <Button appearance="ghost" size="small" onClick={() => retryAgent(task.id)}>
              Try again
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}
