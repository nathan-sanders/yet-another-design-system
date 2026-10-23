import { Play } from 'lucide-react'

import { Badge } from '../../../src/components/Badge'
import { ClickableCard } from '../../../src/components/Card'
import { ProgressBar } from '../../../src/components/ProgressBar'
import { Text } from '../../../src/components/Text'
import type { Asset } from '../data/assets'
import { formatDuration } from '../screens/assets/model'

/**
 * `_Asset Card Content` (`40006101:39712`) in a `Clickable Card`: the file at
 * 4:3, its name, a meta line, and at most one status badge. A video carries
 * its length over the bottom corner, Figma's `Duration` badge.
 *
 * An upload in flight swaps the badge row for a progress bar under the image
 * and says "Uploading…" in the meta. Code-first: the file draws no uploading
 * card (FINDINGS 168).
 */
export function AssetCard({
  asset,
  meta,
  status,
  selected,
  onClick,
}: {
  asset: Asset
  meta: string
  status: { label: string; color: NonNullable<Parameters<typeof Badge>[0]['color']> } | null
  /** Its details are open in the panel: Figma's `State=Selected`. */
  selected?: boolean
  onClick?: () => void
}) {
  const progress = asset.upload ? Math.round(asset.upload.progress * 100) : null
  return (
    <ClickableCard onClick={onClick} selected={selected} className="w-full" aria-busy={progress !== null || undefined}>
      <span className="flex w-full min-w-0 flex-col gap-2 text-left">
        <span className="relative block aspect-4/3 overflow-hidden rounded-sm bg-surface-background-subtle">
          {asset.preview === 'video' ? (
            <video
              src={asset.src}
              muted
              playsInline
              preload="metadata"
              aria-hidden
              className="size-full object-cover"
            />
          ) : (
            <img src={asset.src} alt="" draggable={false} className="size-full object-cover" />
          )}
          {asset.durationSec !== undefined ? (
            <Badge startIcon={Play} className="absolute bottom-2 left-2">
              <span className="sr-only">Length </span>
              {formatDuration(asset.durationSec)}
            </Badge>
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col px-1">
          <Text render={<span />} weight="semibold" color="emphasized" truncate>
            {asset.name}
          </Text>
          <Text render={<span />} size="sm" color="subtle" truncate>
            {meta}
          </Text>
        </span>
        {progress !== null ? (
          <span className="block px-1 pb-1">
            <ProgressBar value={progress} aria-label={`Uploading ${asset.name}`} />
          </span>
        ) : status ? (
          <span className="flex px-1 pb-1">
            <Badge color={status.color}>{status.label}</Badge>
          </span>
        ) : null}
      </span>
    </ClickableCard>
  )
}
