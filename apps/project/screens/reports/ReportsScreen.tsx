import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { CalendarDays, ChevronDown, Ellipsis, Mail, Plus, Users } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { personFor } from '../../data/people'
import { useTasks } from '../project/tasksState'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { floatingYakClearance } from '../../yak/floating'
import { BudgetReport } from './BudgetReport'
import { DeliveryReport } from './DeliveryReport'
import { CADENCE, SEND_ON } from './email'
import { EmailDialog } from './EmailDialog'
import { budgetRead, budgetRows, deliveryRead, RANGES, type Range } from './model'
import { BUILDER_PATH, REPORT_VIEWS, reportPath, type ReportView } from './paths'
import { useReports } from './reportsState'

/** `#/reports` opens on Delivery, the file's first segment. */
export function ReportsIndex() {
  return <Navigate to={reportPath('delivery')} replace />
}

/**
 * Reports: "Reports" and a Delivery / Workload / Budget segment, then the
 * range (`?range=7`), Email weekly (`?email=1`) and ⋯, whose New chart opens
 * the chart builder. Delivery and Budget are drawn; Workload is not, and
 * points at Plan's.
 */
export function ReportsScreen() {
  const { view: requested } = useParams()
  const view = REPORT_VIEWS.find((v) => v.id === requested)
  if (!view) return <ReportsIndex />
  return <ReportsView view={view.id} />
}

function ReportsView({ view }: { view: ReportView }) {
  const navigate = useNavigate()
  const toast = Toast.useToast()
  const [params, setParams] = useSearchParams()
  const { tasks } = useTasks()
  const reports = useReports()
  const asked = Number(params.get('range'))
  const range: Range = RANGES.includes(asked as Range) ? (asked as Range) : 30
  const emailing = params.get('email') === '1'
  const label = REPORT_VIEWS.find((v) => v.id === view)!.label

  const setEmailing = (on: boolean) => {
    const next = new URLSearchParams(params)
    if (on) next.set('email', '1')
    else next.delete('email')
    setParams(next)
  }

  const cadence = reports.schedule ? CADENCE[reports.schedule.cadence].toLowerCase() : 'weekly'
  const read = view === 'budget' ? budgetRead(budgetRows()) : deliveryRead(tasks, range)

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Reports
            </Heading>
            <SegmentedControl
              aria-label="Report"
              appearance="secondary"
              value={view}
              onValueChange={(next) => navigate(reportPath(next as ReportView, range))}
            >
              {REPORT_VIEWS.map((v) => (
                <SegmentedControl.Item key={v.id} value={v.id}>
                  {v.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        }
        end={
          <>
            <Menu>
              <Menu.Trigger
                render={
                  <Button
                    appearance="ghost"
                    startIcon={CalendarDays}
                    endIcon={ChevronDown}
                    className="max-md:hidden"
                  >
                    {`Last ${range} days`}
                  </Button>
                }
              />
              <Menu.Popup align="end" aria-label="Range">
                <Menu.Group>
                  <Menu.RadioGroup
                    value={String(range)}
                    onValueChange={(v) => navigate(reportPath(view, Number(v)))}
                  >
                    {RANGES.map((r) => (
                      <Menu.RadioItem key={r} value={String(r)}>
                        {`Last ${r} days`}
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
            <Button
              appearance="ghost"
              startIcon={Mail}
              onClick={() => setEmailing(true)}
              className="max-md:hidden"
            >
              {`Email ${cadence}`}
            </Button>
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Reports options">
                <Menu.Group>
                  <Menu.Item startIcon={Plus} onClick={() => navigate(BUILDER_PATH)}>
                    New chart
                  </Menu.Item>
                  <Menu.Item startIcon={Mail} onClick={() => setEmailing(true)}>
                    Email this report
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className={cn('flex flex-col gap-3 p-4', floatingYakClearance)}>
        {view === 'delivery' ? (
          <DeliveryReport range={range} />
        ) : view === 'budget' ? (
          <BudgetReport />
        ) : (
          <NotBuiltMessage
            icon={Users}
            title="Workload lives in Plan"
            body="Reports has no Workload frame. Plan › Workload already shows who has room, week by week, and can rebalance it."
            link={{ href: '#/plan/workload', label: 'Open Plan › Workload' }}
          />
        )}
      </AppShell.Content>
      <EmailDialog
        open={emailing}
        report={label}
        yakRead={read}
        schedule={reports.schedule}
        onClose={() => setEmailing(false)}
        onTest={() =>
          toast.add({
            title: 'Test sent',
            description: `${label} report, to ${personFor('nathan').name}.`,
          })
        }
        onSchedule={(schedule) => {
          const before = reports.schedule
          reports.setSchedule(schedule)
          setEmailing(false)
          const names = schedule.to.map((id) => personFor(id).name.split(' ')[0])
          const when = SEND_ON.find((o) => o.value === schedule.sendOn)!.label
          toast.add({
            title: `${label} report scheduled`,
            description: `${CADENCE[schedule.cadence]}, ${when}, to ${names.join(', ')}.`,
            action: { label: 'Undo', onClick: () => reports.setSchedule(before) },
          })
        }}
      />
    </>
  )
}
