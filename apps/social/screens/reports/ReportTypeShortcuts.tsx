import { useSearchParams } from 'react-router'

import { Badge } from '../../../../src/components/Badge'
import { ClickableCard } from '../../../../src/components/Card'
import { Text } from '../../../../src/components/Text'
import { openNewReport } from './newReport'
import { REPORT_TYPES } from './reportTypes'

/**
 * New report's types as shortcuts above the list (`Report Types`,
 * `40006024:33222`): the badge its reports wear in the table and its name, in
 * the picker's order. Each one opens New report already on its setup step for
 * that type, so the list skips the picker; Back still reaches it.
 */
export function ReportTypeShortcuts() {
  const [params, setParams] = useSearchParams()

  return (
    <ul aria-label="New report" className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
      {REPORT_TYPES.map((type) => (
        <li key={type.value} className="flex">
          <ClickableCard
            onClick={() => openNewReport(params, setParams, type.value, { step: 'setup' })}
            className="flex-1 items-start"
          >
            <Badge color={type.color} startIcon={type.icon} aria-hidden />
            <Text render={<span />} weight="semibold">
              {type.label}
            </Text>
          </ClickableCard>
        </li>
      ))}
    </ul>
  )
}
