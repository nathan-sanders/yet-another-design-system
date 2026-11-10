import { ArrowUpDown, ChevronDown, List, ListFilter, Rows3 } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { useShell } from '../../shell/ShellContext'

/**
 * The row over a project's view (`Project - List`, `40006268:6554`;
 * `Project - Board`, `40006268:8728`): the saved view, Filter, the grouping
 * and Sort, all Ghost at the default size. Only the grouping's word differs
 * between views. Saved views, filtering, grouping and sorting are drawn
 * (`Project - List / Filtered, unsaved view`, `40006277:12040`) and not built.
 */
export function ViewToolbar({ group }: { group: string }) {
  const shell = useShell()
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        appearance="ghost"
        startIcon={List}
        endIcon={ChevronDown}
        onClick={() => shell.notBuilt('Saved views')}
      >
        All tasks
      </Button>
      <Button appearance="ghost" startIcon={ListFilter} onClick={() => shell.notBuilt('Filtering')}>
        Filter
      </Button>
      <Button appearance="ghost" startIcon={Rows3} onClick={() => shell.notBuilt('Grouping')}>
        Group: {group}
      </Button>
      <Button appearance="ghost" startIcon={ArrowUpDown} onClick={() => shell.notBuilt('Sorting')}>
        Sort
      </Button>
    </div>
  )
}
