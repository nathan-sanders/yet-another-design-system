import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  ChartArea,
  ChartColumn,
  ChartLine,
  ChartPie,
  Ellipsis,
  Gauge,
  Plus,
  RotateCcw,
  Sheet,
  type LucideIcon,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Field } from '../../../../src/components/Field'
import { Icon } from '../../../../src/components/Icon'
import { InputGroup } from '../../../../src/components/Input'
import { Menu } from '../../../../src/components/Menu'
import { Radio } from '../../../../src/components/Radio'
import { Select } from '../../../../src/components/Select'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { Token } from '../../../../src/components/Token'
import { TopBar } from '../../../../src/components/TopBar'
import { projectFor, projects } from '../../data/projects'
import { useShell } from '../../shell/ShellContext'
import { YakMark } from '../../yak/YakMark'
import { useTasks } from '../project/tasksState'
import { ChartView } from './ChartView'
import {
  chartTitle,
  FIELD_LABEL,
  readRequest,
  type BuilderConfig,
  type BuilderField,
  type BuilderMeasure,
  type BuilderViz,
} from './model'
import { reportPath } from './paths'
import { useReports } from './reportsState'

const VIZ: { value: BuilderViz; label: string; icon: LucideIcon }[] = [
  { value: 'line', label: 'Line', icon: ChartLine },
  { value: 'area', label: 'Area', icon: ChartArea },
  { value: 'bar', label: 'Bar', icon: ChartColumn },
  { value: 'donut', label: 'Donut', icon: ChartPie },
  { value: 'metric', label: 'Metric', icon: Gauge },
  { value: 'table', label: 'Table', icon: Sheet },
]

const FIELDS = Object.keys(FIELD_LABEL) as BuilderField[]
const MEASURES: { value: BuilderMeasure; label: string }[] = [
  { value: 'count', label: 'Number of tasks' },
  { value: 'hours', label: 'Estimated hours' },
]

const DEFAULT: BuilderConfig = {
  projectId: 'austin',
  measure: 'count',
  groupBy: 'phase',
  splitBy: 'status',
  viz: 'bar',
}

/** The builder's state, read from the URL so a half-built chart has a link. */
function configFrom(params: URLSearchParams): BuilderConfig {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const v = params.get(key) as T | null
    return v && allowed.includes(v) ? v : fallback
  }
  return {
    projectId: params.get('data') ?? DEFAULT.projectId,
    measure: pick('measure', ['count', 'hours'] as const, DEFAULT.measure),
    groupBy: pick('group', FIELDS, DEFAULT.groupBy),
    splitBy: pick('split', [...FIELDS, 'none'] as const, DEFAULT.splitBy),
    viz: pick(
      'viz',
      VIZ.map((v) => v.value),
      DEFAULT.viz,
    ),
  }
}

function paramsFrom(config: BuilderConfig): URLSearchParams {
  return new URLSearchParams({
    data: config.projectId,
    measure: config.measure,
    group: config.groupBy,
    split: config.splitBy,
    viz: config.viz,
  })
}

/** The way the request line writes a chart: "Austin tasks by phase and status". */
function requestFor(config: BuilderConfig): string {
  const project = projectFor(config.projectId)!
  const what = config.measure === 'count' ? 'tasks' : 'hours'
  const split = config.splitBy === 'none' ? '' : ` and ${config.splitBy}`
  return `${project.short ?? project.name} ${what} by ${config.groupBy}${split}`
}

/**
 * The chart builder (`Reports - Chart builder`, `40006312:39249`): a
 * request for Yak on top, then Data, Measure, Group by and Split by,
 * Visualization as six Radio Cards, and Filters, in a 340 column; the
 * preview beside it, drawn from the live tasks. Add to dashboard puts the
 * chart on Delivery. Typing a request — "Mobile tasks by assignee and
 * status" — sets the fields.
 */
export function ChartBuilder() {
  const navigate = useNavigate()
  const shell = useShell()
  const toast = Toast.useToast()
  const [params, setParams] = useSearchParams()
  const { tasks } = useTasks()
  const reports = useReports()
  const config = configFrom(params)
  const project = projectFor(config.projectId) ?? projectFor(DEFAULT.projectId)!
  const [request, setRequest] = useState(() => requestFor(config))
  const [notArchived, setNotArchived] = useState(true)

  const withTasks = projects.filter((p) => tasks.some((t) => t.projectId === p.id))
  const set = (patch: Partial<BuilderConfig>) => {
    const next = { ...config, ...patch }
    setParams(paramsFrom(next), { replace: true })
    setRequest(requestFor(next))
  }

  const ask = (event: FormEvent) => {
    event.preventDefault()
    const read = readRequest(
      request,
      config,
      // A project answers to its name, its short name, or its first word: "Mobile".
      withTasks.map((p) => ({
        id: p.id,
        names: [p.name, p.short ?? p.name, p.name.split(' ')[0]],
      })),
    )
    if (!read) {
      toast.add({
        title: 'Yak couldn’t place that',
        description: 'Try a project and what to group by: “Mobile tasks by assignee and status”.',
      })
      return
    }
    setParams(paramsFrom(read), { replace: true })
    setRequest(requestFor(read))
  }

  const title = chartTitle(config, project.short ?? project.name)
  const count = tasks.filter((t) => t.projectId === project.id).length
  const back = () => navigate(reportPath('delivery'))

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back to Reports"
              onClick={back}
            />
            <Heading level={1} size="base" weight="bold" truncate>
              New chart
            </Heading>
          </div>
        }
        end={
          <>
            <Button appearance="ghost" onClick={back}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              startIcon={Plus}
              onClick={() => {
                reports.addChart({ title, config })
                navigate(reportPath('delivery'))
                toast.add({ title: 'Added to Delivery', description: title })
              }}
            >
              Add to dashboard
            </Button>
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Chart options">
                <Menu.Group>
                  <Menu.Item startIcon={RotateCcw} onClick={() => set(DEFAULT)}>
                    Start over
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className="p-4">
        <div className="flex flex-col gap-3 @4xl/page:flex-row @4xl/page:items-start">
          <div className="flex w-full shrink-0 flex-col gap-3 @4xl/page:w-85">
            <form onSubmit={ask} aria-label="Ask Yak for a chart">
              <InputGroup className="bg-surface-background-subtle">
                <InputGroup.Addon align="inline-start">
                  <YakMark className="size-4 text-content-emphasized" />
                </InputGroup.Addon>
                <InputGroup.Input
                  aria-label="Ask Yak for a chart"
                  value={request}
                  onValueChange={setRequest}
                />
              </InputGroup>
            </form>
            <Field label="Data" nativeLabel={false}>
              <Select
                value={project.id}
                onValueChange={(v) => set({ projectId: String(v) })}
                items={withTasks.map((p) => ({ value: p.id, label: `Tasks in ${p.name}` }))}
              >
                {withTasks.map((p) => (
                  <Select.Item key={p.id} value={p.id}>
                    {`Tasks in ${p.name}`}
                  </Select.Item>
                ))}
              </Select>
            </Field>
            <Field label="Measure" nativeLabel={false}>
              <Select
                value={config.measure}
                onValueChange={(v) => set({ measure: v as BuilderMeasure })}
                items={MEASURES}
              >
                {MEASURES.map((m) => (
                  <Select.Item key={m.value} value={m.value}>
                    {m.label}
                  </Select.Item>
                ))}
              </Select>
            </Field>
            <Field label="Group by" nativeLabel={false}>
              <Select
                value={config.groupBy}
                onValueChange={(v) => set({ groupBy: v as BuilderField })}
                items={FIELDS.map((f) => ({ value: f, label: FIELD_LABEL[f] }))}
              >
                {FIELDS.map((f) => (
                  <Select.Item key={f} value={f}>
                    {FIELD_LABEL[f]}
                  </Select.Item>
                ))}
              </Select>
            </Field>
            <Field label="Split by" nativeLabel={false}>
              <Select
                value={config.splitBy}
                onValueChange={(v) => set({ splitBy: v as BuilderField | 'none' })}
                items={[
                  { value: 'none', label: 'Nothing' },
                  ...FIELDS.filter((f) => f !== config.groupBy).map((f) => ({
                    value: f,
                    label: FIELD_LABEL[f],
                  })),
                ]}
              >
                <Select.Item value="none">Nothing</Select.Item>
                {FIELDS.filter((f) => f !== config.groupBy).map((f) => (
                  <Select.Item key={f} value={f}>
                    {FIELD_LABEL[f]}
                  </Select.Item>
                ))}
              </Select>
            </Field>
            <Field label="Visualization" nativeLabel={false}>
              <Radio.Group
                aria-label="Visualization"
                value={config.viz}
                onValueChange={(v) => set({ viz: v as BuilderViz })}
                className="grid grid-cols-3 gap-2"
              >
                {VIZ.map((v) => (
                  <Radio.Card key={v.value} value={v.value} padding={3}>
                    <span className="flex flex-col items-center gap-1 text-sm">
                      <Icon icon={v.icon} />
                      {v.label}
                    </span>
                  </Radio.Card>
                ))}
              </Radio.Group>
            </Field>
            <Field label="Filters" nativeLabel={false}>
              <div className="flex flex-wrap gap-2">
                {notArchived ? (
                  <Token
                    onRemove={() => setNotArchived(false)}
                    removeLabel="Remove the Not archived filter"
                  >
                    Not archived
                  </Token>
                ) : null}
                <Token
                  interactive
                  startIcon={Plus}
                  onClick={() => shell.notBuilt('Adding a filter')}
                >
                  Add filter
                </Token>
              </div>
            </Field>
          </div>
          <ContentBlock headingLevel={2} className="h-auto min-w-0 flex-1">
            <ContentBlock.Header>{title}</ContentBlock.Header>
            <ContentBlock.Content className="gap-3">
              <Text size="sm" color="subtle" className="-mt-2">
                {`${count} tasks · updates live`}
              </Text>
              <ChartView config={config} tasks={tasks} title={title} height={300} />
            </ContentBlock.Content>
          </ContentBlock>
        </div>
      </AppShell.Content>
    </>
  )
}
