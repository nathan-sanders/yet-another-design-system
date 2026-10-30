import { Badge } from '../../../../src/components/Badge'
import { Link } from '../../../../src/components/Link'
import { Heading, Text } from '../../../../src/components/Text'
import { changeKinds, releases, REPO, type Release } from '../../data/changelog'

const longDate = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** `2026-10-30` read as a calendar day, not as midnight UTC. */
function dayOf(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Settings › Changelog: what has shipped in Yet Social, newest first, from
 * the app's own pull requests (`data/changelog.ts`). Code-first, no Figma
 * frame. A release is a date beside its notes on a wide dialog and stacks
 * under it on a narrow one, the way most product changelogs read.
 */
export function ChangelogSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Heading level={3} size="lg" weight="semibold">
          Changelog
        </Heading>
        <Text color="subtle">What’s new in Yet Social, as it gets built.</Text>
      </div>
      <ol className="flex flex-col">
        {releases.map((release, index) => (
          <ReleaseEntry key={release.date} release={release} latest={index === 0} />
        ))}
      </ol>
    </div>
  )
}

function ReleaseEntry({ release, latest }: { release: Release; latest: boolean }) {
  return (
    <li className="grid gap-2 border-t border-surface-border py-6 first:border-t-0 first:pt-0 @xl/settings:grid-cols-[8rem_1fr] @xl/settings:gap-6">
      <Text render={<time dateTime={release.date} />} size="sm" color="subtle">
        {longDate.format(dayOf(release.date))}
      </Text>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={4} size="base" weight="semibold">
              {release.title}
            </Heading>
            {latest ? <Badge>Latest</Badge> : null}
          </div>
          <Text color="subtle">{release.summary}</Text>
        </div>
        <ul className="flex flex-col gap-2">
          {release.changes.map((change) => (
            <li key={change.text} className="flex items-start gap-3">
              {/* w-18 = the widest badge, Improved, so every note starts on one line. */}
              <span className="flex w-18 shrink-0">
                <Badge color={changeKinds[change.kind].color}>
                  {changeKinds[change.kind].label}
                </Badge>
              </span>
              <Text className="min-w-0">
                {change.text}
                {change.pr ? (
                  <>
                    {' '}
                    <Link href={`${REPO}/pull/${change.pr}`} external>
                      <span className="sr-only">Pull request </span>#{change.pr}
                    </Link>
                  </>
                ) : null}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
