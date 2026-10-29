import { useMemo } from 'react'

import { Avatar } from '../../../src/components/Avatar'
import { Combobox, type ComboboxValue } from '../../../src/components/Combobox'
import { Field } from '../../../src/components/Field'
import { Select } from '../../../src/components/Select'
import { campaigns } from '../data/campaigns'
import { people } from '../data/people'
import { createTag, useTagCatalog } from '../data/tags'

const NONE = '__none__'

const campaignItems = [
  { value: NONE, label: 'No campaign' },
  ...campaigns.map((c) => ({ value: c.id, label: c.name })),
]
const peopleItems = [
  { value: NONE, label: 'Unassigned' },
  ...people.map((p) => ({ value: p.id, label: p.name })),
]
/** Each person's face with their presence on it, for the Assignee rows and trigger. */
const personIcon = (id: string) => {
  const person = people.find((p) => p.id === id)
  return person ? (
    <Avatar size="x-small" name={person.name} src={person.avatar} alt="" status={person.status} />
  ) : undefined
}

/**
 * Campaign, Tags and Assignee — the `Details` block a post and an idea share
 * (`40006009:29479`, `40006058:33896`). Campaign and Assignee are Selects over
 * the two short lists the app has; Tags is a tokenizer over the tag catalog
 * (`data/tags.ts`). A tag the catalog does not have is created from the
 * field (Combobox `onCreate`, FINDINGS 148) and joins the catalog for every
 * Tags field after it.
 *
 * `layout="row"` puts Campaign and Tags side by side with Assignee under them,
 * as the file's two-column block; `column` stacks all three for a panel.
 */
export function DetailsFields({
  campaignId,
  tagNames: chosen,
  assigneeId,
  onChange,
  layout = 'row',
}: {
  campaignId?: string
  tagNames: string[]
  assigneeId?: string
  onChange: (patch: { campaignId?: string; tagNames?: string[]; assigneeId?: string }) => void
  layout?: 'row' | 'column'
}) {
  const tagItems = useTagCatalog()
  // A stable array for the tokenizer: a fresh one each render would read as a change.
  const chosenItems = useMemo(
    () => tagItems.filter((item) => chosen.includes(String(item.value))),
    [tagItems, chosen],
  )
  const campaign = (
    <Field label="Campaign" nativeLabel={false}>
      <Select
        items={campaignItems}
        value={campaignId ?? NONE}
        onValueChange={(value) => onChange({ campaignId: value === NONE ? undefined : (value as string) })}
      >
        {campaignItems.map((item) => (
          <Select.Item key={item.value} value={item.value}>
            {item.label}
          </Select.Item>
        ))}
      </Select>
    </Field>
  )
  const tags = (
    <Field label="Tags">
      <Combobox
        multiple
        items={tagItems}
        value={chosenItems}
        onValueChange={(value: ComboboxValue) =>
          onChange({ tagNames: Array.isArray(value) ? value.map((v) => String(v.value)) : [] })
        }
        onCreate={createTag}
        placeholder="Add tags…"
      />
    </Field>
  )
  const assignee = (
    <Field label="Assignee" nativeLabel={false}>
      <Select
        items={peopleItems}
        value={assigneeId ?? NONE}
        onValueChange={(value) => onChange({ assigneeId: value === NONE ? undefined : (value as string) })}
      >
        {peopleItems.map((item) => (
          <Select.Item key={item.value} value={item.value} startIcon={personIcon(item.value)}>
            {item.label}
          </Select.Item>
        ))}
      </Select>
    </Field>
  )
  if (layout === 'column') {
    return (
      <div className="flex flex-col gap-4">
        {campaign}
        {tags}
        {assignee}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 @min-[640px]/page:grid-cols-2">
        {campaign}
        {tags}
      </div>
      <div className="grid gap-4 @min-[640px]/page:grid-cols-2">{assignee}</div>
    </div>
  )
}
