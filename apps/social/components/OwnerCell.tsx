import { Avatar } from '../../../src/components/Avatar'
import { personFor } from '../data/people'

/**
 * A person's face and name in a table cell: `_Measure Owner Cell`
 * (`40005882:26335`), an X-Small avatar beside the name. Measure › Reports
 * draws it for who made a report, Plan › Campaigns for who owns a campaign.
 * The `yet` id is the product itself, for the built-in reports.
 */
export function OwnerCell({ id }: { id: string }) {
  const person = id === 'yet' ? { name: 'Yet', avatar: undefined } : personFor(id)
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
      <span className="truncate">{person.name}</span>
    </span>
  )
}
