import { useState, type FormEvent } from 'react'
import { Ellipsis } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Menu } from '../../../../src/components/Menu'
import { Select } from '../../../../src/components/Select'
import { pixel, proportional, Table, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { me, personFor } from '../../data/people'
import { ROLE_LABELS, ROLES, SEATS, type TeamRow } from '../../data/team'
import { SettingsGroup, SettingsHeader } from './SettingsBlock'

const ROLE_ITEMS = ROLES.map((role) => ({ value: role.value, label: role.label }))

type InviteRole = (typeof ROLES)[number]['value']

/**
 * Settings › Team: who is in the workspace, what each can do, and inviting
 * someone new. Code-first, no Figma frame.
 *
 * Members and pending invites share one table, because both hold a seat and
 * the seat count is what the page is really about: inviting stops at the
 * plan's seats and points at Billing, which counts the same five. Roles,
 * invites and removals are live for as long as the dialog is; the owner's row
 * is fixed, and so is your own.
 */
export function TeamSection({
  team,
  onTeamChange,
  onShowBilling,
}: {
  team: TeamRow[]
  onTeamChange: (next: TeamRow[]) => void
  onShowBilling: () => void
}) {
  const toast = Toast.useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('editor')
  const [submitted, setSubmitted] = useState(false)
  const full = team.length >= SEATS

  const trimmed = email.trim().toLowerCase()
  const error =
    trimmed === ''
      ? 'Enter an email address.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
        ? 'That doesn’t look like an email address.'
        : team.some((row) => row.email === trimmed)
          ? 'They’re already on the team.'
          : undefined

  function invite(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (error || full) return
    onTeamChange([...team, { kind: 'invite', id: trimmed, email: trimmed, role, sentDaysAgo: 0 }])
    toast.add({ title: `Invite sent to ${trimmed}` })
    setEmail('')
    setSubmitted(false)
  }

  function remove(row: TeamRow) {
    onTeamChange(team.filter((other) => other.id !== row.id))
    toast.add({
      title:
        row.kind === 'invite'
          ? `Invite to ${row.email} revoked`
          : `${personFor(row.id).name} removed`,
    })
  }

  function changeRole(row: TeamRow, next: InviteRole) {
    onTeamChange(team.map((other) => (other.id === row.id ? { ...other, role: next } : other)))
  }

  const columns: TableColumn<TeamRow>[] = [
    {
      key: 'member',
      header: 'Member',
      width: proportional(1, 220),
      renderCell: (row) => <MemberCell row={row} />,
    },
    {
      key: 'role',
      header: 'Role',
      width: pixel(144),
      renderCell: (row) =>
        row.role === 'owner' || row.id === me.id ? (
          ROLE_LABELS[row.role]
        ) : (
          <Select
            hug
            aria-label={`Role for ${nameOf(row)}`}
            value={row.role}
            onValueChange={(value) => changeRole(row, value as InviteRole)}
            items={ROLE_ITEMS}
          >
            {ROLES.map((option) => (
              <Select.Item key={option.value} value={option.value} description={option.description}>
                {option.label}
              </Select.Item>
            ))}
          </Select>
        ),
    },
    {
      key: 'status',
      header: 'Last active',
      width: pixel(144),
      renderCell: (row) =>
        row.kind === 'invite' ? (
          <Badge color="blue">Invited</Badge>
        ) : (
          <Text color="subtle">{row.lastActive}</Text>
        ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      width: pixel(56),
      align: 'right',
      renderCell: (row) =>
        row.role === 'owner' || row.id === me.id ? null : (
          <Menu>
            <Menu.Trigger
              render={
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label={`${nameOf(row)} options`}
                />
              }
            />
            <Menu.Popup aria-label={`${nameOf(row)} options`}>
              <Menu.Group>
                <Menu.Item onClick={() => remove(row)}>
                  {row.kind === 'invite' ? 'Revoke invite' : 'Remove from workspace'}
                </Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      <SettingsHeader
        title="Team"
        description="Who can work in this workspace, and what each of them can do."
      />

      <SettingsGroup
        title="Invite people"
        description={`${team.length} of ${SEATS} seats in use. Invites hold a seat until they’re answered or revoked.`}
      >
        {full ? (
          <div className="flex flex-col items-start gap-3">
            <Text>Every seat is taken. Add seats to your plan to invite anyone else.</Text>
            <Button appearance="secondary" onClick={onShowBilling}>
              Go to Billing
            </Button>
          </div>
        ) : (
          <form
            onSubmit={invite}
            noValidate
            className="flex flex-col gap-3 @xl/settings:flex-row @xl/settings:items-start"
          >
            <Field
              label="Email"
              invalid={submitted && error !== undefined}
              error={submitted ? error : undefined}
              className="@xl/settings:max-w-sm"
            >
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@veggievault.com"
              />
            </Field>
            <Field label="Role" nativeLabel={false} className="@xl/settings:w-40">
              <Select
                value={role}
                onValueChange={(value) => setRole(value as InviteRole)}
                items={ROLE_ITEMS}
              >
                {ROLES.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    description={option.description}
                  >
                    {option.label}
                  </Select.Item>
                ))}
              </Select>
            </Field>
            {/* The label row's height, so the button lines up with the fields. */}
            <Button type="submit" appearance="primary" className="self-start @xl/settings:mt-7">
              Send invite
            </Button>
          </form>
        )}
      </SettingsGroup>

      {/* A div, not a named section: the Table's scroll region is already the
          "Members" landmark (BillingSection's invoices, again). */}
      <div className="flex flex-col gap-3">
        <Heading level={4} size="base" weight="semibold">
          Members
        </Heading>
        <Table label="Members" columns={columns} data={team} idKey="id" sortable={false} />
      </div>
    </div>
  )
}

function nameOf(row: TeamRow) {
  return row.kind === 'invite' ? row.email : personFor(row.id).name
}

function MemberCell({ row }: { row: TeamRow }) {
  if (row.kind === 'invite') {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="base" name={row.email} alt="" />
        <div className="flex min-w-0 flex-col">
          <Text className="truncate">{row.email}</Text>
          <Text size="sm" color="subtle">
            {row.sentDaysAgo === 0
              ? 'Invited today'
              : `Invited ${row.sentDaysAgo} day${row.sentDaysAgo === 1 ? '' : 's'} ago`}
          </Text>
        </div>
      </div>
    )
  }
  const person = personFor(row.id)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="base" name={person.name} src={person.avatar} alt="" />
      <div className="flex min-w-0 flex-col">
        <Text className="truncate">
          {person.name}
          {row.id === me.id ? <span className="text-content-subtle"> (you)</span> : null}
        </Text>
        <Text size="sm" color="subtle" className="truncate">
          {row.email}
        </Text>
      </div>
    </div>
  )
}
