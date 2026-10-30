import { plan } from './billing'

/**
 * Who is in the workspace, for Settings › Team. The three people are the
 * app's own (`people.ts`); the pending invite holds the fourth seat. Billing
 * counts the same rows, so the two pages agree on how many are in use.
 */

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const ROLES: { value: Exclude<TeamRole, 'owner'>; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Everything, including billing and the team' },
  { value: 'editor', label: 'Editor', description: 'Write, schedule and reply' },
  { value: 'viewer', label: 'Viewer', description: 'See the calendar and reports' },
]

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export interface TeamMember {
  personId: string
  email: string
  role: TeamRole
  /** As the table prints it. */
  lastActive: string
}

export const members: TeamMember[] = [
  { personId: 'nathan', email: 'nathan@veggievault.com', role: 'owner', lastActive: 'Active now' },
  { personId: 'katie', email: 'katie@veggievault.com', role: 'admin', lastActive: 'Active now' },
  { personId: 'dana', email: 'dana@veggievault.com', role: 'editor', lastActive: 'Yesterday' },
]

export interface Invite {
  email: string
  role: Exclude<TeamRole, 'owner'>
  /** Days before today it went out. */
  sentDaysAgo: number
}

export const invites: Invite[] = [{ email: 'sam@veggievault.com', role: 'viewer', sentDaysAgo: 2 }]

/** Seats are the plan's; members and pending invites both hold one. */
export const SEATS = plan.seats

/** One row of the Team table: a member, or an invite still waiting on its answer. */
export type TeamRow =
  ({ kind: 'member'; id: string } & TeamMember) | ({ kind: 'invite'; id: string } & Invite)

export function initialTeam(): TeamRow[] {
  return [
    ...members.map((member) => ({ kind: 'member' as const, id: member.personId, ...member })),
    ...invites.map((invite) => ({ kind: 'invite' as const, id: invite.email, ...invite })),
  ]
}
