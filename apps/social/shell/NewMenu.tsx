import type { ReactElement } from 'react'
import {
  CircleUser,
  Globe,
  LayoutGrid,
  Lightbulb,
  Megaphone,
  Radar,
  SquarePen,
  type LucideIcon,
} from 'lucide-react'

import { useSearchParams } from 'react-router'

import { Menu } from '../../../src/components/Menu'
import { Tooltip } from '../../../src/components/Tooltip'
import type { ReportType } from '../data/types'
import { openNewReport } from '../screens/reports/newReport'
import { useShell } from './ShellContext'

interface NewItem {
  label: string
  description?: string
  icon: LucideIcon
  /** What the not-built toast calls it. */
  what: string
  /** Opens New report, on this type when there is one, instead of the toast. */
  report?: ReportType | true
}

/** Figma's `Menu` (`40005939:57476`): things to make, then people and channels to add. */
const create: NewItem[] = [
  {
    label: 'Post',
    description: 'Publish content to a channel',
    icon: SquarePen,
    what: 'The post composer',
  },
  {
    label: 'Campaign',
    description: 'Plan a coordinated push',
    icon: Megaphone,
    what: 'Creating campaigns',
  },
  {
    label: 'Idea',
    description: 'Capture a content idea',
    icon: Lightbulb,
    what: 'Capturing ideas',
  },
  {
    label: 'Report',
    description: 'Measure how content performs',
    icon: LayoutGrid,
    what: 'Building reports',
    report: true,
  },
  {
    label: 'Topic',
    description: 'Track conversations on a theme',
    icon: Radar,
    what: 'Topic tracking',
    report: 'listening',
  },
]

const invite: NewItem[] = [
  { label: 'Connect new channel', icon: Globe, what: 'Connecting channels' },
  { label: 'Invite team member', icon: CircleUser, what: 'Inviting teammates' },
]

/**
 * The rail's New button and what it opens — create anything from any page.
 * The caller passes the trigger, because the rail, the collapsed rail and the
 * phone bar each draw it differently; the menu is the same in all three.
 */
export function NewMenu({ trigger, tooltip }: { trigger: ReactElement; tooltip?: string }) {
  const shell = useShell()
  const [params, setParams] = useSearchParams()
  const row = (item: NewItem) => (
    <Menu.Item
      key={item.label}
      startIcon={item.icon}
      description={item.description}
      onClick={() =>
        item.report
          ? openNewReport(params, setParams, item.report === true ? undefined : item.report)
          : shell.notBuilt(item.what)
      }
    >
      {item.label}
    </Menu.Item>
  )
  return (
    <Menu>
      {/* The tooltip wraps the menu's trigger, not the Button inside it, so both
          sets of props land on the one element. */}
      {tooltip ? (
        <Tooltip label={tooltip} side="right">
          <Menu.Trigger render={trigger} />
        </Tooltip>
      ) : (
        <Menu.Trigger render={trigger} />
      )}
      {/* w-71 = 284, Figma's width for this menu. */}
      <Menu.Popup aria-label="New" className="w-71">
        <Menu.Group>{create.map(row)}</Menu.Group>
        <Menu.Group>{invite.map(row)}</Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}
