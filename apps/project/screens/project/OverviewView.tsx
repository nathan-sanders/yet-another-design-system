import { useNavigate } from 'react-router'
import {
  Calendar,
  ChartLine,
  CircleUser,
  Folders,
  FolderOpen,
  MessageCircle,
  RefreshCw,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { MenuBlock } from '../../components/MenuBlock'
import { PropertyRow } from '../../components/PropertyRow'
import { HEALTH } from '../../components/taskMeta'
import { datedText, day, rangeLabel, shortDate, weekdayLong } from '../../data/dates'
import { overviewFor } from '../../data/overview'
import { personFor } from '../../data/people'
import type { Project, ProjectOverview } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { projectPath } from './paths'

/** "Since last update"'s glyphs, as the file draws each kind of change. */
const CHANGE_ICON: Record<ProjectOverview['latestUpdate']['changes'][number]['kind'], LucideIcon> =
  {
    date: Calendar,
    people: Users,
    progress: ChartLine,
  }

/** "$312K", as the Budget row reads. */
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
})

/**
 * A project's Overview tab (`Project - Overview`, `40006268:5150`): Yak's
 * summary, the latest update and the milestones in an 806 column, and the
 * properties and activity in a 340 side column beside it. Below `xl` the
 * side column drops under the main one, properties first.
 */
export function OverviewView({ project }: { project: Project }) {
  const overview = overviewFor(project.id)
  if (!overview) {
    return (
      <NotBuiltMessage
        icon={FolderOpen}
        title="No overview in this mock yet"
        body={`Only Austin store opening has an overview so far; ${project.name}’s comes with its tasks in a later slice.`}
        link={{ href: `#${projectPath('austin', 'overview')}`, label: 'Open Austin store opening' }}
      />
    )
  }
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <YakSummary overview={overview} />
        <LatestUpdate overview={overview} />
        <Milestones project={project} overview={overview} />
      </div>
      <div className="flex flex-col gap-3 xl:w-85 xl:shrink-0">
        <Properties project={project} overview={overview} />
        <Activity overview={overview} />
      </div>
    </div>
  )
}

/**
 * Yak's read of the project: a Subtle Card, its header a 16px mark and a
 * small subtle title with two Small Secondary buttons, then a paragraph a
 * line. Yak is not built in this app, so both buttons say so.
 */
function YakSummary({ overview }: { overview: ProjectOverview }) {
  const shell = useShell()
  return (
    <Card emphasis="subtle" className="shrink-0">
      <div className="flex items-center gap-2">
        <YakMark className="size-4 shrink-0" />
        <Text render={<h2 />} size="sm" weight="semibold" color="subtle" className="flex-1">
          Yak summary
        </Text>
        <Button
          appearance="secondary"
          size="small"
          startIcon={RefreshCw}
          onClick={() => shell.notBuilt('Regenerating Yak’s summary')}
        >
          Regenerate
        </Button>
        <Button
          appearance="secondary"
          size="small"
          startIcon={MessageCircle}
          onClick={() => shell.notBuilt('Yak')}
        >
          Ask
        </Button>
      </div>
      {overview.summary.map((line) => (
        <Text key={line}>{datedText(line)}</Text>
      ))}
    </Card>
  )
}

/**
 * The owner's latest update: a byline of face, name, weekday and the health
 * it was posted with, the words, then what moved since the one before as
 * view-only Tokens. The ⋯ menu leads to Post update and the update history,
 * both drawn and not built.
 */
function LatestUpdate({ overview }: { overview: ProjectOverview }) {
  const shell = useShell()
  const update = overview.latestUpdate
  const author = personFor(update.authorId)
  const posted = day(update.posted)
  const health = HEALTH[update.health]
  return (
    <MenuBlock
      title="Latest update"
      contentClassName="gap-4"
      menu={[
        { label: 'Post update', onClick: () => shell.notBuilt('Post update') },
        { label: 'See all updates', onClick: () => shell.notBuilt('Update history') },
      ]}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Avatar name={author.name} src={author.avatar} alt="" size="small" />
        <Text render={<span />} weight="semibold" color="emphasized">
          {author.name}
        </Text>
        <Text
          render={<time dateTime={update.posted} />}
          size="sm"
          color="subtle"
          title={shortDate.format(posted)}
        >
          {weekdayLong.format(posted)}
        </Text>
        <Badge color={health.color}>{health.label}</Badge>
      </div>
      <Text>{datedText(update.body)}</Text>
      <div className="flex flex-col gap-1">
        <Text size="sm" color="subtle" id="since-last-update">
          Since last update
        </Text>
        <ul aria-labelledby="since-last-update" className="flex flex-wrap gap-1">
          {update.changes.map((change) => (
            <li key={change.text} className="flex">
              <Token startIcon={CHANGE_ICON[change.kind]}>{datedText(change.text)}</Token>
            </li>
          ))}
        </ul>
      </div>
    </MenuBlock>
  )
}

/**
 * `_Milestone Marker` (`Yet Project / Components`): a filled 16px diamond in
 * the emphasized ink, then the name. The diamond is a square turned a
 * quarter, 10px a side for the file's 14px across.
 */
function MilestoneMarker({ name }: { name: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1">
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        <span className="size-2.5 rotate-45 bg-content-emphasized" />
      </span>
      <Text render={<span />} size="sm" weight="semibold" color="emphasized" truncate>
        {name}
      </Text>
    </span>
  )
}

/** The milestones in date order, each 36 tall with its date and health at the end. */
function Milestones({ project, overview }: { project: Project; overview: ProjectOverview }) {
  const navigate = useNavigate()
  const shell = useShell()
  return (
    <MenuBlock
      title="Milestones"
      contentClassName="gap-0"
      menu={[
        { label: 'Open timeline', onClick: () => navigate(projectPath(project.id, 'timeline')) },
        { label: 'Add milestone', onClick: () => shell.notBuilt('Adding a milestone') },
      ]}
    >
      <ol className="flex flex-col">
        {overview.milestones.map((milestone) => {
          const health = HEALTH[milestone.health]
          return (
            <li key={milestone.name} className="flex items-center gap-3 py-2">
              <MilestoneMarker name={milestone.name} />
              <Text render={<time dateTime={milestone.date} />} size="sm" color="subtle">
                {shortDate.format(day(milestone.date))}
              </Text>
              <Badge color={health.color}>{health.label}</Badge>
            </li>
          )
        })}
      </ol>
    </MenuBlock>
  )
}

/**
 * What the header has no room for, as `_Property Row`s. Goal and Portfolio
 * are view-only Tokens in the file, links rather than values, so each goes to
 * its Plan page — drawn and not built — as the task panel's Linked rows do.
 */
function Properties({ project, overview }: { project: Project; overview: ProjectOverview }) {
  const owner = personFor(project.ownerId)
  return (
    <MenuBlock title="Properties" contentClassName="gap-0">
      <dl aria-label="Properties" className="flex flex-col">
        <PropertyRow icon={CircleUser} label="Owner">
          <Avatar name={owner.name} src={owner.avatar} alt="" size="x-small" />
          <span className="truncate">{owner.name}</span>
        </PropertyRow>
        <PropertyRow icon={Users} label="Team">
          {overview.team.join(', ')}
        </PropertyRow>
        <PropertyRow icon={Calendar} label="Dates">
          {rangeLabel(day(project.start), day(project.due))}
        </PropertyRow>
        <PropertyRow icon={Wallet} label="Budget">
          {money.format(overview.budget.spent)} of {money.format(overview.budget.total)}
        </PropertyRow>
        <PropertyRow icon={Target} label="Goal">
          <Token href="#/plan/goals">{overview.goal}</Token>
        </PropertyRow>
        <PropertyRow icon={Folders} label="Portfolio">
          <Token href="#/plan/portfolios">{overview.portfolio}</Token>
        </PropertyRow>
      </dl>
    </MenuBlock>
  )
}

/** `_Activity Row`: a 20px face, the line, and its age, newest first. */
function Activity({ overview }: { overview: ProjectOverview }) {
  return (
    <MenuBlock title="Activity">
      <ol className="flex flex-col gap-2">
        {overview.activity.map((event) => {
          const actor = personFor(event.actorId)
          return (
            <li key={event.text} className="flex items-start gap-2">
              <Avatar name={actor.name} src={actor.avatar} alt="" size="x-small" />
              <Text size="sm" className="min-w-0 flex-1">
                {datedText(event.text)}
              </Text>
              <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                {event.age}
              </Text>
            </li>
          )
        })}
      </ol>
    </MenuBlock>
  )
}
