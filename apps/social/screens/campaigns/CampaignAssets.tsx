import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router'

// `screen` is FileInput's own rule-checker and not in its barrel; the Asset
// library's picker imports it the same way.
import { screen } from '../../../../src/components/FileInput/files'
import { Select } from '../../../../src/components/Select'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { AssetCard } from '../../components/AssetCard'
import { folders, type Asset } from '../../data/assets'
import { creatorById } from '../../data/creators'
import type { Campaign } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { AssetDetailPanel } from '../assets/AssetDetailPanel'
import { useAssets } from '../assets/assetsState'
import { ImportMenu } from '../assets/ImportMenu'
import {
  ACCEPT,
  assetsIn,
  byType,
  MAX_SIZE,
  metaFor,
  refusedMessage,
  sortAssets,
  SORTS,
  statusFor,
  TYPES,
  uploadedMessage,
  type AssetSort,
  type AssetTypeFilter,
  type UseCounts,
} from '../assets/model'
import { useSchedule } from '../calendar/scheduleState'

const handleFor = (id: string) => creatorById(id)?.handle

/**
 * The library's badge, with the file's "From creator" in front of Unused: on
 * a campaign, where a creator's file came from matters more than whether a
 * post has used it yet. Rights ending or expired still come first.
 */
function campaignStatusFor(asset: Asset, uses: number, now: Date) {
  const status = statusFor(asset, uses, now)
  if (status && status.label !== 'Unused') return status
  if (asset.rights) return { label: 'From creator', color: 'purple' } as const
  return status
}

/**
 * A campaign's Assets tab (`40006187:43721`): everything in its folder in the
 * Asset library, subfolders included, as the library's own cards. Type and
 * Sort by are the library's, in `?type=&sort=`, and a card opens the
 * library's details panel. Import uploads into the campaign's folder.
 *
 * A file licensed from a creator says so with the file's purple "From
 * creator", unless the library has something more pressing to say about it
 * — rights about to end, say (FINDINGS 205).
 * A campaign with no folder says so, and Import makes the upload land in the
 * library's root.
 */
export function CampaignAssets({ campaign }: { campaign: Campaign }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const shell = useShell()
  const toast = Toast.useToast()
  const { assets, upload } = useAssets()
  const { posts } = useSchedule()
  const folder = folders.find((f) => f.campaignId === campaign.id)

  const type = (TYPES.find((t) => t.value === params.get('type'))?.value ??
    'all') as AssetTypeFilter
  const sort = (SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'recent') as AssetSort
  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value === null) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  // How many posts use each file, as the library counts it: the posts whose photo it is.
  const uses: UseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const asset of assets) {
      const n = posts.filter((p) => p.photo === asset.src).length
      if (n) counts.set(asset.id, n)
    }
    return counts
  }, [assets, posts])

  const now = new Date()
  const inFolder = folder ? assetsIn({ folderId: folder.id }, assets, folders, uses, now) : []
  const shown = sortAssets(byType(inFolder, type), sort)

  const openId = shell.panel?.type === 'asset' ? shell.panel.assetId : undefined
  const [lastOpenId, setLastOpenId] = useState(openId)
  if (openId && openId !== lastOpenId) setLastOpenId(openId)
  const openAsset = (id: string) =>
    shell.setPanel(openId === id ? null : { type: 'asset', assetId: id })

  const picker = useRef<HTMLInputElement>(null)
  const onPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const { accepted, rejected } = screen(Array.from(event.target.files ?? []), {
      accept: ACCEPT,
      maxSize: MAX_SIZE,
      multiple: true,
    })
    event.target.value = ''
    if (accepted.length > 0) {
      const { undo } = upload(accepted, folder?.id ?? null)
      toast.add({
        type: 'success',
        title: uploadedMessage(accepted.length, folder?.name ?? 'Asset library'),
        action: { label: 'Undo', onClick: undo },
      })
    }
    if (rejected.length > 0) {
      toast.add({
        type: 'danger',
        title: refusedMessage(rejected.length),
        description: rejected[0]?.message,
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Text render={<span />} size="sm" color="subtle">
            Type
          </Text>
          <Select
            size="small"
            hug
            aria-label="Type"
            value={type}
            onValueChange={(value) => update('type', value === 'all' ? null : String(value))}
            items={TYPES}
          >
            {TYPES.map((t) => (
              <Select.Item key={t.value} value={t.value}>
                {t.label}
              </Select.Item>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Text render={<span />} size="sm" color="subtle">
            Sort by
          </Text>
          <Select
            size="small"
            hug
            aria-label="Sort assets"
            value={sort}
            onValueChange={(value) => update('sort', value === 'recent' ? null : String(value))}
            items={SORTS}
          >
            {SORTS.map((s) => (
              <Select.Item key={s.value} value={s.value}>
                {s.label}
              </Select.Item>
            ))}
          </Select>
        </div>
        <Text render={<span />} size="sm" color="subtle" className="ml-auto">
          {shown.length} {shown.length === 1 ? 'asset' : 'assets'}
        </Text>
        <ImportMenu onUpload={() => picker.current?.click()} onConnector={shell.notBuilt} />
        <input ref={picker} type="file" multiple accept={ACCEPT} onChange={onPicked} hidden />
      </div>

      {shown.length === 0 ? (
        <Text color="subtle">
          {!folder
            ? 'No folder for this campaign yet. Import adds files to the Asset library.'
            : type !== 'all'
              ? 'Nothing of this type in the campaign’s folder.'
              : 'The campaign’s folder is empty. Use Import to add some.'}
        </Text>
      ) : (
        <ul
          aria-label={`${campaign.name} assets`}
          className="grid grid-cols-1 gap-3 @min-[440px]/page:grid-cols-2 @min-[900px]/page:grid-cols-3 @min-[1080px]/page:grid-cols-4"
        >
          {shown.map((asset) => {
            const n = uses.get(asset.id) ?? 0
            return (
              <li key={asset.id} className="flex">
                <AssetCard
                  asset={asset}
                  meta={metaFor(asset, n, handleFor)}
                  status={campaignStatusFor(asset, n, now)}
                  selected={asset.id === openId}
                  onClick={() => openAsset(asset.id)}
                />
              </li>
            )
          })}
        </ul>
      )}

      {/* The library's details panel, portalled where the shell's panels go, as
          the library renders it. Show in folder opens that folder there. */}
      {shell.screenPanelHost
        ? createPortal(
            <AssetDetailPanel
              open={openId !== undefined}
              assetId={lastOpenId}
              uses={uses}
              order={shown.map((a) => a.id)}
              onClose={() => shell.setPanel(null)}
              onOpenFolder={(folderId) => {
                shell.setPanel(null)
                navigate(`/plan/assets?in=${folderId}`)
              }}
            />,
            shell.screenPanelHost,
          )
        : null}
    </div>
  )
}
