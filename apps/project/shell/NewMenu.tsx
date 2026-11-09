import type { ReactElement } from 'react'
import {
  CircleCheck,
  CircleUser,
  ClipboardList,
  FileText,
  FolderKanban,
  Goal,
  type LucideIcon,
} from 'lucide-react'

import { Menu } from '../../../src/components/Menu'
import { Tooltip } from '../../../src/components/Tooltip'
import { useShell } from './ShellContext'

interface NewItem {
  label: string
  description: string
  icon: LucideIcon
  /** What the not-built toast calls it. */
  what: string
}

/*
 * The file draws no menu under Yet Project's New button, so this is Yet
 * Social's (`40005939:57476`) with Yet Project's things in it. Task, Project
 * and Goal each have a dialog drawn (`New task` 40006275:13678, `New project /
 * Template` 40006285:18672, `Plan - Goals / New goal` 40006298:29382); none
 * is built yet.
 */
const create: NewItem[] = [
  { label: 'Task', description: 'Something to get done', icon: CircleCheck, what: 'New task' },
  {
    label: 'Project',
    description: 'Start from a template or blank',
    icon: FolderKanban,
    what: 'New project',
  },
  { label: 'Doc', description: 'A plan, a brief, meeting notes', icon: FileText, what: 'New doc' },
  {
    label: 'Request',
    description: 'Ask another team for something',
    icon: ClipboardList,
    what: 'New request',
  },
  { label: 'Goal', description: 'An outcome projects ladder up to', icon: Goal, what: 'New goal' },
]

const invite: NewItem[] = [
  {
    label: 'Invite team member',
    description: 'Add someone to Veggie Vault',
    icon: CircleUser,
    what: 'Inviting teammates',
  },
]

/**
 * The rail's New button and what it opens. The caller passes the trigger,
 * because the rail, the collapsed rail and the phone bar each draw it
 * differently; the menu is the same in all three.
 */
export function NewMenu({ trigger, tooltip }: { trigger: ReactElement; tooltip?: string }) {
  const shell = useShell()
  const row = (item: NewItem) => (
    <Menu.Item
      key={item.label}
      startIcon={item.icon}
      description={item.description}
      onClick={() => shell.notBuilt(item.what)}
    >
      {item.label}
    </Menu.Item>
  )
  return (
    <Menu>
      {tooltip ? (
        <Tooltip label={tooltip} side="right">
          <Menu.Trigger render={trigger} />
        </Tooltip>
      ) : (
        <Menu.Trigger render={trigger} />
      )}
      {/* w-71 = 284, Yet Social's width for this menu. */}
      <Menu.Popup aria-label="New" className="w-71">
        <Menu.Group>{create.map(row)}</Menu.Group>
        <Menu.Group>{invite.map(row)}</Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}
