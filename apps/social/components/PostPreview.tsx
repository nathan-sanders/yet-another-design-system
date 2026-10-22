import { Bookmark, Ellipsis, Heart, MessageCircle, Repeat2, Send } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Card } from '../../../src/components/Card'
import { Text } from '../../../src/components/Text'
import type { Network, PostFormat, Profile } from '../data/types'
import { scheduleLabel } from '../screens/calendar/scheduleCommit'
import type { ScheduleAt } from '../screens/calendar/scheduleState'

export interface PostPreviewProps {
  profile: Profile
  caption: string
  media: string[]
  format: PostFormat
  at: ScheduleAt | null
}

/**
 * The post as its network will show it: the composer's right column
 * (`40006009:29479`, the `Instagram preview` card). Instagram is the file's
 * drawing — avatar and handle, the first photo square, carousel dots, the
 * three actions, a likes line, the caption behind the bold handle, "View 1
 * comment" and when it goes out. Threads has no frame yet (FINDINGS 150) and is
 * drawn text-first, the way that network reads.
 */
export function PostPreview({ network, ...props }: PostPreviewProps & { network: Network }) {
  return network === 'threads' ? <ThreadsPreview {...props} /> : <InstagramPreview {...props} />
}

/** The network's action row: 20px marks 24 apart, 4 above and below, and the save mark at the far end. */
function Actions({ icons, end: End }: { icons: typeof Heart[]; end?: typeof Heart }) {
  return (
    <div aria-hidden className="flex items-center gap-6 py-1 text-content-primary">
      {icons.map((Icon, i) => (
        <Icon key={i} className="size-5" strokeWidth={1.75} />
      ))}
      {End ? (
        <>
          <span className="flex-1" />
          <End className="size-5" strokeWidth={1.75} />
        </>
      ) : null}
    </div>
  )
}

function InstagramPreview({ profile, caption, media, format, at }: PostPreviewProps) {
  const [first] = media
  const dots = format === 'carousel' ? Math.max(media.length, 2) : media.length > 1 ? media.length : 0
  return (
    <Card padding={3} className="flex flex-col gap-2" aria-label="Instagram preview">
      {/* Account row: 24 avatar, the handle at base/semibold, the menu mark; 8 off the right and 4 under. */}
      <div className="flex items-center gap-2 pr-2 pb-1">
        <Avatar size="small" name={profile.name} src={profile.avatar} alt="" />
        <Text render={<span />} weight="semibold" color="emphasized" className="flex-1">
          {profile.name}
        </Text>
        <Ellipsis aria-hidden className="size-4 text-content-primary" />
      </div>
      {first ? (
        <img src={first} alt="" className="h-64 w-full rounded-sm object-cover" />
      ) : (
        <div className="flex h-64 w-full items-center justify-center rounded-sm bg-surface-background-subtle">
          <Text size="sm" color="subtle">
            Add a photo
          </Text>
        </div>
      )}
      {dots ? (
        <div aria-hidden className="flex justify-center gap-1">
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              className={
                i === 0
                  ? 'size-1.5 rounded-full bg-content-emphasized'
                  : 'size-1.5 rounded-full bg-surface-border-emphasized'
              }
            />
          ))}
        </div>
      ) : null}
      <Actions icons={[Heart, MessageCircle, Send]} end={Bookmark} />
      <Text size="sm" weight="semibold" color="emphasized">
        Liked by feelgoodfoods and 1,204 others
      </Text>
      <Text size="sm" className="whitespace-pre-line">
        <b className="font-semibold text-content-emphasized">{profile.name}</b>{' '}
        {caption || 'Your caption will appear here.'}
      </Text>
      <Text size="sm" color="subtle">
        View 1 comment
      </Text>
      <Text size="xs" color="subtle">
        {at ? `Scheduled for ${scheduleLabel(at)}` : 'Not scheduled yet'}
      </Text>
    </Card>
  )
}

function ThreadsPreview({ profile, caption, media, at }: PostPreviewProps) {
  const [first] = media
  return (
    <Card padding={3} className="flex gap-3" aria-label="Threads preview">
      <Avatar size="base" name={profile.name} src={profile.avatar} alt="" className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Text render={<span />} size="sm" weight="semibold" color="emphasized" className="flex-1">
            {profile.name}
          </Text>
          <Text render={<span />} size="xs" color="subtle">
            {at ? scheduleLabel(at) : 'Unscheduled'}
          </Text>
        </div>
        <Text size="sm" className="whitespace-pre-line">
          {caption || 'Your post will appear here.'}
        </Text>
        {first ? <img src={first} alt="" className="max-h-60 w-full rounded-lg object-cover" /> : null}
        <Actions icons={[Heart, MessageCircle, Repeat2, Send]} />
      </div>
    </Card>
  )
}
