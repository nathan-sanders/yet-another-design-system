import { useRef, useState } from 'react'

import { AlertDialog } from '../../../../src/components/AlertDialog'
import { Button } from '../../../../src/components/Button'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import type { Campaign } from '../../data/types'
import { useSchedule } from '../calendar/scheduleState'
import { useCampaigns } from './campaignsState'
import { activeCreators, campaignPosts, isOnBoard } from './model'

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/**
 * `Cancel campaign dialog` (`40006180:41085`): what stops, before it stops.
 * The file's six lines, each counted from the campaign rather than typed, and
 * a line left out when there is nothing for it to say — a campaign with no
 * creators has no offers to withdraw.
 *
 * Confirming does what the lines say: the scheduled posts go back to Drafts
 * with the campaign still on them, the published ones stay, an offer nobody
 * accepted is withdrawn, and the campaign ends today. Yak drafting the
 * withdrawal note is the file's promise and not built (FINDINGS 186).
 */
export function CancelCampaignDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const keepRef = useRef<HTMLButtonElement>(null)
  const { posts, returnToDrafts } = useSchedule()
  const { cancel } = useCampaigns()
  const toast = Toast.useToast()

  const planned = campaignPosts(campaign, posts)
  const scheduled = planned.filter((p) => !p.published)
  const published = planned.filter((p) => p.published)
  const awaitingApproval = scheduled.some((p) => p.post.needsApproval)
  const creators = activeCreators(campaign)
  const offers = creators.filter((c) => c.status === 'invited').length
  const onBoard = creators.filter(isOnBoard).length

  const lines = [
    scheduled.length > 0 &&
      `${plural(scheduled.length, 'scheduled post goes', 'scheduled posts go')} back to Drafts, still in the campaign`,
    published.length > 0 &&
      `${plural(published.length, 'published post and its results stay', 'published posts and their results stay')} on Measure`,
    awaitingApproval && 'Posts waiting for approval are cleared',
    offers > 0 &&
      `${plural(offers, 'open creator offer is', 'open creator offers are')} withdrawn — Yak drafts the note`,
    onBoard > 0 &&
      `${plural(onBoard, 'confirmed creator is', 'confirmed creators are')} flagged for follow-up; fees and agreements don’t change on their own`,
    'The calendar bar ends today',
  ].filter((line): line is string => Boolean(line))

  // What the dialog says is what was true when it opened. Confirming empties
  // the schedule while the dialog is still closing, and a list that shrank
  // under the pointer on its way out would read as a second, different answer.
  const said = lines.join('\n')
  const [shown, setShown] = useState(said)
  if (open && shown !== said) setShown(said)

  const confirm = () => {
    returnToDrafts(scheduled.map((p) => p.post.id))
    cancel(campaign.id)
    toast.add({
      title: `${campaign.name} cancelled`,
      description:
        scheduled.length > 0
          ? `${plural(scheduled.length, 'post is', 'posts are')} back in Drafts.`
          : undefined,
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Popup initialFocus={keepRef}>
        <AlertDialog.Title>Cancel {campaign.name}?</AlertDialog.Title>
        {/* One text in the file, its lines 8 apart: the lead and the list share that rhythm. */}
        <div className="flex flex-col gap-2">
          <AlertDialog.Description>
            {campaign.name} stops today and can’t be restarted. Here’s what changes:
          </AlertDialog.Description>
          <ul className="flex flex-col gap-2">
            {shown.split('\n').map((line) => (
              <Text key={line} render={<li />} color="subtle">
                • {line}
              </Text>
            ))}
          </ul>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialog.Close
            render={
              <Button ref={keepRef} appearance="secondary">
                Keep campaign
              </Button>
            }
          />
          <AlertDialog.Close
            render={
              <Button appearance="destructive" onClick={confirm}>
                Cancel campaign
              </Button>
            }
          />
        </div>
      </AlertDialog.Popup>
    </AlertDialog>
  )
}
