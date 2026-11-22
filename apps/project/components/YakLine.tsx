import type { ReactNode } from 'react'

import { Card } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import { YakMark } from '../yak/YakMark'

/**
 * Yak's one-line read of a Plan page, over its content: a Subtle Card holding
 * the 16px mark and a line of body text, with Small buttons after it when Yak
 * has something to offer (Workload's Apply and Not now, `40006279:21820`).
 * Every Plan frame opens with one.
 */
export function YakLine({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <Card emphasis="subtle" className="shrink-0 flex-row items-center gap-2">
      <YakMark className="size-4 shrink-0" />
      <Text className="min-w-0 flex-1">{children}</Text>
      {actions}
    </Card>
  )
}
