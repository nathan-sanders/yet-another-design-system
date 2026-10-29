import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  Clock,
  Crop,
  Download,
  Folder,
  Fullscreen,
  Link,
  Maximize2,
  Megaphone,
  Play,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react'

import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Combobox, type ComboboxValue } from '../../../../src/components/Combobox'
import { formatFileSize } from '../../../../src/components/FileInput'
import { Icon } from '../../../../src/components/Icon'
import { Panel } from '../../../../src/components/Panel'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { NetworkIcon } from '../../components/NetworkIcon'
import { folders, type Asset } from '../../data/assets'
import { creatorById } from '../../data/creators'
import { monthDay } from '../../data/dates'
import { campaignFor } from '../../data/campaigns'
import { personFor } from '../../data/people'
import { profileFor } from '../../data/posts'
import { useShell } from '../../shell/ShellContext'
import { isPublished, postDate } from '../calendar/model'
import { useSchedule } from '../calendar/scheduleState'
import { composePath } from '../compose/paths'
import { AssetLightbox } from './AssetLightbox'
import { useAssets } from './assetsState'
import { daysLeft, folderPath, formatDuration, KIND_NAMES, rightsState, type UseCounts } from './model'

const fullDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * Asset details (`40006105:40392`): the file, its usage rights, tags, where it
 * lives and came from, and the posts that use it. The preview opens the file
 * larger, in `AssetLightbox`. Download, copy link and
 * favorite in the footer, with Edit and Use asset; Use asset opens the
 * composer with the file as its media.
 *
 * The asset library renders it, not the shell, so it reads that screen's
 * uploads; it is portalled after the Page with the shell's panels.
 */
export function AssetDetailPanel({
  open,
  assetId,
  uses,
  order,
  onClose,
  onOpenFolder,
}: {
  open: boolean
  /** The last one opened, so the panel keeps its content while it slides out. */
  assetId: string | undefined
  uses: UseCounts
  /** The grid's ids in its order: the lightbox's Previous and Next. */
  order: readonly string[]
  onClose: () => void
  onOpenFolder: (folderId: string) => void
}) {
  const { assets } = useAssets()
  const asset = assets.find((a) => a.id === assetId)
  const shell = useShell()
  // Held here rather than in the details, so stepping to the next file keeps it open.
  const [lightbox, setLightbox] = useState(false)

  return (
    <Panel
      aria-label="Asset details"
      open={open && asset !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header
        closeButton
        actions={
          <Button
            appearance="ghost"
            startIcon={Fullscreen}
            aria-label="Expand"
            onClick={() => shell.notBuilt('The full asset view')}
          />
        }
      >
        Asset details
      </Panel.Header>
      {asset ? (
        <AssetDetails
          asset={asset}
          uses={uses.get(asset.id) ?? 0}
          onOpenFolder={onOpenFolder}
          onEnlarge={() => setLightbox(true)}
        />
      ) : null}
      {asset ? (
        <AssetLightbox
          open={open && lightbox}
          onOpenChange={setLightbox}
          asset={asset}
          facts={factsFor(asset)}
          order={order}
          onNavigate={(id) => shell.setPanel({ type: 'asset', assetId: id })}
        />
      ) : null}
    </Panel>
  )
}

/** "Image · 1600 × 2400 · 3.2 MB", or that it is still on its way. */
function factsFor(asset: Asset): string {
  if (asset.upload) return 'Uploading…'
  return [
    KIND_NAMES[asset.kind],
    asset.width && asset.height ? `${asset.width} × ${asset.height}` : undefined,
    asset.durationSec !== undefined ? formatDuration(asset.durationSec) : undefined,
    formatFileSize(asset.sizeBytes),
  ]
    .filter(Boolean)
    .join(' · ')
}

function AssetDetails({
  asset,
  uses,
  onOpenFolder,
  onEnlarge,
}: {
  asset: Asset
  uses: number
  onOpenFolder: (folderId: string) => void
  onEnlarge: () => void
}) {
  const shell = useShell()
  const toast = Toast.useToast()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { toggleFavorite } = useAssets()
  const now = new Date()

  return (
    <>
      <Panel.Body className="flex flex-col gap-4">
        {/* The preview is the way in to the lightbox. Its corner glyph says
            so to the eye; the button's name says it to everyone else. */}
        <button
          type="button"
          onClick={onEnlarge}
          aria-label={`View ${asset.name} larger`}
          className={cn(
            // A square stage; the file sits in it at its own shape, letterboxed.
            'group relative block aspect-square w-full shrink-0 cursor-zoom-in overflow-hidden rounded-sm bg-surface-background-subtle',
            focusRing,
          )}
        >
          {asset.preview === 'video' ? (
            <video src={asset.src} muted playsInline preload="metadata" aria-hidden className="size-full object-contain" />
          ) : (
            <img src={asset.src} alt="" className="size-full object-contain" />
          )}
          {asset.kind === 'video' ? (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-surface-background-primary text-content-primary shadow-medium">
                <Icon icon={Play} size="large" />
              </span>
            </span>
          ) : null}
          <span
            aria-hidden
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-md bg-surface-background-primary text-content-primary opacity-0 shadow-low transition-opacity duration-fast ease-standard group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Icon icon={Maximize2} />
          </span>
        </button>
        <div className="flex flex-col">
          <Text weight="semibold" color="emphasized" className="break-all">
            {asset.name}
          </Text>
          <Text size="sm" color="subtle">
            {factsFor(asset)}
          </Text>
        </div>
        {asset.rights ? <RightsCard asset={asset} now={now} /> : null}
        <TagsCard asset={asset} />
        <DetailsCard asset={asset} onOpenFolder={onOpenFolder} />
        <UsedInCard asset={asset} count={uses} />
      </Panel.Body>
      <Panel.Footer className="flex items-center justify-between gap-2 pt-4">
        <div className="flex items-center gap-2">
          <Button
            appearance="ghost"
            startIcon={Download}
            aria-label={`Download ${asset.name}`}
            // Button renders a <button> only, so the download is a throwaway
            // link clicked on its behalf (FINDINGS 171).
            onClick={() => {
              const link = document.createElement('a')
              link.href = asset.src
              link.download = asset.name
              link.click()
            }}
          />
          <Button
            appearance="ghost"
            startIcon={Link}
            aria-label="Copy link"
            onClick={() => toast.add({ title: 'Link copied' })}
          />
          <Button
            appearance="ghost"
            startIcon={Star}
            aria-label="Favorite"
            aria-pressed={asset.favorite}
            // A filled star when it is one.
            className="aria-pressed:[&_svg]:fill-current"
            onClick={() => toggleFavorite(asset.id)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button appearance="secondary" startIcon={Crop} onClick={() => shell.notBuilt('Editing assets')}>
            Edit
          </Button>
          <Button
            disabled={asset.upload !== undefined}
            onClick={() =>
              navigate(composePath({ from: pathname + search }), {
                state: { prefill: { media: [asset.src] } },
              })
            }
          >
            Use asset
          </Button>
        </div>
      </Panel.Footer>
    </>
  )
}

/** A card's title: text-base/semibold on Content/Subtle, as all four are in the frame. */
function CardLabel({ children }: { children: string }) {
  return (
    <Text weight="semibold" color="subtle">
      {children}
    </Text>
  )
}

function RightsCard({ asset, now }: { asset: Asset; now: Date }) {
  const creator = creatorById(asset.rights!.creatorId)
  const left = daysLeft(asset, now)!
  const state = rightsState(asset, now)
  return (
    <Card className="flex flex-col gap-2">
      <CardLabel>Usage rights</CardLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={state === 'expired' ? 'red' : state === 'ending' ? 'amber' : 'green'} startIcon={Clock}>
          {left < 0
            ? `Ended ${-left} ${left === -1 ? 'day' : 'days'} ago`
            : left === 0
              ? 'Ends today'
              : `${left} ${left === 1 ? 'day' : 'days'} left`}
        </Badge>
        <Text weight="semibold" color="emphasized">
          {left < 0 ? 'Ended' : 'Ends'} {monthDay.format(asset.rights!.endsAt)}
        </Text>
      </div>
      <Text size="sm" color="subtle">
        Licensed from {creator?.name ?? 'the creator'}
        {creator ? ` (@${creator.handle})` : ''}. {asset.rights!.terms}
      </Text>
    </Card>
  )
}

function TagsCard({ asset }: { asset: Asset }) {
  const { tagCatalog, createTag, setTags } = useAssets()
  // A stable array: Combobox matches chosen rows by identity.
  const chosen = useMemo(
    () => tagCatalog.filter((t) => asset.tags.includes(String(t.value))),
    [tagCatalog, asset.tags],
  )
  const seeded = !asset.id.startsWith('a-new-')
  return (
    <Card className="flex flex-col gap-2">
      <CardLabel>Tags</CardLabel>
      <Combobox
        multiple
        aria-label="Tags"
        items={tagCatalog}
        value={chosen}
        onValueChange={(value: ComboboxValue) =>
          setTags(asset.id, Array.isArray(value) ? value.map((v) => String(v.value)) : [])
        }
        onCreate={createTag}
        placeholder="Add tags…"
      />
      {seeded && asset.tags.length > 0 ? (
        <span className="flex items-center gap-1.5 text-content-subtle">
          <Icon icon={Sparkles} size="small" />
          <Text render={<span />} size="sm" color="subtle">
            Tagged by Yak from the image
          </Text>
        </span>
      ) : null}
    </Card>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Text color="subtle" className="w-24 shrink-0">
        {label}
      </Text>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  )
}

function DetailsCard({
  asset,
  onOpenFolder,
}: {
  asset: Asset
  onOpenFolder: (folderId: string) => void
}) {
  const path = asset.folderId ? folderPath(asset.folderId, folders) : []
  const folder = path.at(-1)
  const campaign = campaignFor(path.find((f) => f.campaignId)?.campaignId)
  const creator = asset.rights ? creatorById(asset.addedBy) : undefined
  const source = creator ?? personFor(asset.addedBy)
  return (
    <Card className="flex flex-col gap-2">
      <CardLabel>Details</CardLabel>
      <DetailRow label="Folder">
        {folder ? (
          <Token startIcon={Folder} onClick={() => onOpenFolder(folder.id)}>
            {folder.name}
          </Token>
        ) : (
          <Text color="subtle">Not in a folder</Text>
        )}
      </DetailRow>
      <DetailRow label="Source">
        <Token avatar={<Token.Avatar name={source?.name ?? 'Unknown'} src={source?.avatar} />}>
          {source?.name ?? 'Unknown'}
        </Token>
      </DetailRow>
      <DetailRow label="Added">
        <Token startIcon={Upload}>{fullDate.format(asset.addedAt)}</Token>
      </DetailRow>
      {campaign ? (
        <DetailRow label="Campaign">
          <Token startIcon={Megaphone}>{campaign.name}</Token>
        </DetailRow>
      ) : null}
    </Card>
  )
}

function UsedInCard({ asset, count }: { asset: Asset; count: number }) {
  const { posts } = useSchedule()
  const shell = useShell()
  const used = posts.filter((p) => p.photo === asset.src)
  return (
    <Card className="flex flex-col gap-2">
      <CardLabel>{count > 0 ? `Used in · ${count} ${count === 1 ? 'post' : 'posts'}` : 'Used in'}</CardLabel>
      {used.length === 0 ? (
        <Text size="sm" color="subtle">
          Not in any post yet.
        </Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {used.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => shell.setPanel({ type: 'post', postId: post.id })}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 rounded-xs text-left hover:underline',
                  focusRing,
                )}
              >
                <NetworkIcon network={profileFor(post).network} />
                <Text render={<span />} truncate className="min-w-0 flex-1">
                  {post.body}
                </Text>
                <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                  {isPublished(post) ? 'Published' : 'Scheduled'} {monthDay.format(postDate(post))}
                </Text>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
