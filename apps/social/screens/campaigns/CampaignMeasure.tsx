import { ListFilter } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { campaignReportId } from '../../data/reports'
import type { Campaign } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { ReportBoard } from '../reports/ReportScreen'
import { useReports } from '../reports/reportsState'

/**
 * A campaign's Measure tab (`40006187:44493`): the campaign's own report, as
 * a real board — drag a widget, resize a row, Add widget, open a widget's
 * page — under the campaign's tabs instead of a report's Top Bar. The file
 * puts Filter where a report has Compare. Filtering isn't designed, so it
 * says so, as the reports' Filters does.
 */
export function CampaignMeasure({ campaign }: { campaign: Campaign }) {
  const shell = useShell()
  const report = useReports().reportFor(campaignReportId(campaign.id))
  if (!report) return null
  return (
    <div className="flex flex-col gap-3">
      <ReportBoard
        report={report}
        rangeExtra={
          <Button
            appearance="secondary"
            startIcon={ListFilter}
            className="shrink-0"
            onClick={() => shell.notBuilt('Filters')}
          >
            Filter
          </Button>
        }
      />
    </div>
  )
}
