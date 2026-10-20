import type { ReactElement } from 'react'
import {
  Bug,
  CircleArrowUp,
  CircleQuestionMark,
  CircleUser,
  CreditCard,
  Globe,
  Link,
  LogOut,
  Plug,
  Scroll,
  Settings,
  type LucideIcon,
} from 'lucide-react'

import { Menu, type MenuPopupProps } from '../../../src/components/Menu'
import { useShell } from './ShellContext'

export type MyStatus = 'available' | 'away'

interface UserItem {
  label: string
  icon: LucideIcon
  /** What the not-built toast calls it. */
  what: string
}

/** Figma's user `Menu` (`40005964:74176`): status, then account, help, and out. */
const account: UserItem[] = [
  { label: 'Settings', icon: Settings, what: 'Settings' },
  { label: 'Billing', icon: CreditCard, what: 'Billing' },
  { label: 'Upgrade plan', icon: CircleArrowUp, what: 'Upgrading plans' },
  { label: 'Integrations', icon: Plug, what: 'Integrations' },
  { label: 'Shared links', icon: Link, what: 'Shared links' },
  { label: 'Connect new channel', icon: Globe, what: 'Connecting channels' },
  { label: 'Invite team member', icon: CircleUser, what: 'Inviting teammates' },
]

const help: UserItem[] = [
  { label: 'Get help', icon: CircleQuestionMark, what: 'Help' },
  { label: 'View changelog', icon: Scroll, what: 'The changelog' },
  { label: 'Send feedback', icon: Bug, what: 'Sending feedback' },
]

const out: UserItem[] = [{ label: 'Log out', icon: LogOut, what: 'Logging out' }]

/**
 * What the rail's last item, "Hi, Nathan!", opens. The caller passes the
 * trigger and where the popup sits, because the rail and the phone sheet hold
 * the account row in different places; the status lives in the shell so both
 * avatars agree.
 */
export function UserMenu({
  trigger,
  status,
  onStatusChange,
  side,
  align,
}: {
  trigger: ReactElement
  status: MyStatus
  onStatusChange: (status: MyStatus) => void
} & Pick<MenuPopupProps, 'side' | 'align'>) {
  const shell = useShell()
  const row = (item: UserItem) => (
    <Menu.Item key={item.label} startIcon={item.icon} onClick={() => shell.notBuilt(item.what)}>
      {item.label}
    </Menu.Item>
  )
  return (
    <Menu>
      <Menu.Trigger render={trigger} />
      {/* w-71 = 284, Figma's width for this menu. */}
      <Menu.Popup aria-label="Account" side={side} align={align} className="w-71">
        <Menu.Group label="My status">
          <Menu.RadioGroup
            value={status}
            onValueChange={(value) => onStatusChange(value as MyStatus)}
          >
            <Menu.RadioItem value="available">Available</Menu.RadioItem>
            <Menu.RadioItem value="away">Away</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Group>
        <Menu.Group>{account.map(row)}</Menu.Group>
        <Menu.Group>{help.map(row)}</Menu.Group>
        <Menu.Group>{out.map(row)}</Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}
