import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router'
import {
  Box,
  ChevronDown,
  Clock,
  Ellipsis,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Images,
  Layers,
  LayoutGrid,
  Library,
  Link,
  List,
  ListFilter,
  Palette,
  Plug,
  Plus,
  Star,
  Upload,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Badge } from '../../../../src/components/Badge'
import { Breadcrumbs } from '../../../../src/components/Breadcrumbs'
import { Button } from '../../../../src/components/Button'
import { useFileDrop } from '../../../../src/components/FileInput'
// `screen` is FileInput's own rule-checker and not in its barrel; the picker
// path needs the same rules a drop gets (FINDINGS 170).
import { screen } from '../../../../src/components/FileInput/files'
import { Icon } from '../../../../src/components/Icon'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { pixel, proportional, Table, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { TreeList, type TreeListItem } from '../../../../src/components/TreeList'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { AssetCard } from '../../components/AssetCard'
import { floatingYakClearance } from '../../components/FloatingYak'
import { folders, type Asset, type AssetFolder } from '../../data/assets'
import { creatorById } from '../../data/creators'
import { monthDay } from '../../data/dates'
import { formatFileSize } from '../../../../src/components/FileInput'
import { useShell } from '../../shell/ShellContext'
import { useSchedule } from '../calendar/scheduleState'
import { AssetDetailPanel } from './AssetDetailPanel'
import { useAssets } from './assetsState'
import {
  ACCEPT,
  assetsIn,
  byType,
  folderPath,
  KIND_NAMES,
  MAX_SIZE,
  metaFor,
  parseScope,
  refusedMessage,
  scopeId,
  scopeParam,
  sortAssets,
  SORTS,
  statusFor,
  targetName,
  TYPES,
  uploadedMessage,
  uploadTarget,
  VIEWS,
  type AssetScope,
  type AssetSort,
  type AssetTypeFilter,
  type AssetView,
  type UseCounts,
} from './model'

const VIEW_ICONS: Record<AssetView, typeof Images> = {
  all: Images,
  favorites: Star,
  unused: Box,
  expiring: Clock,
}

/** Figma's tree opens with these folders expanded. */
const DEFAULT_EXPANDED = ['summer-menu', 'reels', 'brand-kit']

const handleFor = (id: string) => creatorById(id)?.handle

/**
 * Plan › Asset library (`40006104:39766`; details open `40006105:40365`): the
 * brand's files in folders, as a grid of `_Asset Card Content` or a table.
 * The folder column is two TreeLists, the views above and the folders below,
 * and one `?in=` in the URL says which row is selected. Type, sort and view
 * are in the URL too.
 *
 * **Drop files anywhere on the grid side to upload them** to the folder that
 * is open, or to the library's root from a view (All assets, Favorites, …).
 * Import › Upload from computer is the same upload for the keyboard. Both are
 * code-first: the file draws neither the drag-over state nor an uploading card
 * (FINDINGS 168).
 */
export function AssetsScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const toast = Toast.useToast()
  const { assets, upload } = useAssets()
  const { posts } = useSchedule()

  const scope = parseScope(params.get('in'), folders)
  const type = (TYPES.find((t) => t.value === params.get('type'))?.value ?? 'all') as AssetTypeFilter
  const sort = (SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'recent') as AssetSort
  const view = params.get('view') === 'list' ? 'list' : 'grid'

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value === null) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  // How many posts use each file: the posts whose photo it is.
  const uses: UseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const asset of assets) {
      const n = posts.filter((p) => p.photo === asset.src).length
      if (n) counts.set(asset.id, n)
    }
    return counts
  }, [assets, posts])

  const now = new Date()
  const shown = sortAssets(byType(assetsIn(scope, assets, folders, uses, now), type), sort)
  const where = targetName(scope, folders)

  const openId = shell.panel?.type === 'asset' ? shell.panel.assetId : undefined
  const [lastOpenId, setLastOpenId] = useState(openId)
  if (openId && openId !== lastOpenId) setLastOpenId(openId)
  const openAsset = (id: string) => shell.setPanel(openId === id ? null : { type: 'asset', assetId: id })

  const report = (accepted: File[], rejectedCount: number, firstReason?: string) => {
    if (accepted.length > 0) {
      const { undo } = upload(accepted, uploadTarget(scope))
      // Favorites, Unused and Rights expiring would hide a new file, so the
      // drop opens All assets, where it can be seen landing.
      if ('view' in scope && scope.view !== 'all') update('in', null)
      toast.add({
        type: 'success',
        title: uploadedMessage(accepted.length, where),
        action: { label: 'Undo', onClick: undo },
      })
    }
    if (rejectedCount > 0) {
      toast.add({ type: 'danger', title: refusedMessage(rejectedCount), description: firstReason })
    }
  }

  const { dragging, dropProps } = useFileDrop({
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    onDrop: (accepted, rejected) => report(accepted, rejected.length, rejected[0]?.message),
  })

  // Import › Upload from computer: the keyboard's way to the same upload.
  const picker = useRef<HTMLInputElement>(null)
  const onPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const { accepted, rejected } = screen(Array.from(event.target.files ?? []), {
      accept: ACCEPT,
      maxSize: MAX_SIZE,
      multiple: true,
    })
    event.target.value = ''
    report(accepted, rejected.length, rejected[0]?.message)
  }

  const path = 'folderId' in scope ? folderPath(scope.folderId, folders) : []
  const title = 'folderId' in scope ? path.at(-1)!.name : 'Asset library'

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-3">
            {path.length > 0 ? (
              <>
                {/* The trail on a desk; the folder's name alone on a phone,
                    where the trail and the view switch will not both fit. */}
                <Heading level={1} size="base" weight="semibold" truncate className="min-w-0 md:sr-only">
                  {title}
                </Heading>
                <Breadcrumbs className="max-md:hidden">
                  <Breadcrumbs.Item href="#/plan/assets">Asset library</Breadcrumbs.Item>
                  {path.map((folder) => (
                    <Breadcrumbs.Item key={folder.id} href={`#/plan/assets?in=${folder.id}`}>
                      {folder.name}
                    </Breadcrumbs.Item>
                  ))}
                </Breadcrumbs>
              </>
            ) : (
              <Heading level={1} size="base" weight="semibold">
                Asset library
              </Heading>
            )}
            {/* A phone gets the grid: the top bar's start is half its width
                there, and the folder's name needs it more. */}
            <SegmentedControl
              aria-label="View"
              value={view}
              onValueChange={(value) => update('view', value === 'list' ? 'list' : null)}
              className="max-md:hidden"
            >
              <SegmentedControl.Item value="grid" startIcon={LayoutGrid}>
                Grid
              </SegmentedControl.Item>
              <SegmentedControl.Item value="list" startIcon={List}>
                List
              </SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <div className="flex items-center gap-2 max-md:hidden">
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              onClick={() => shell.notBuilt('Filtering assets')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Link}
              aria-label="Copy link to this view"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href)
                toast.add({ title: 'Link copied' })
              }}
            />
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      <AppShell.Content className="flex-row gap-0 overflow-hidden p-0">
        <FolderColumn
          scope={scope}
          assets={assets}
          uses={uses}
          now={now}
          onScopeChange={(next) => update('in', scopeParam(next))}
          onNewFolder={() => shell.notBuilt('New folders')}
        />

        {/* The drop target is the whole grid side, toolbar included, and it
            does not scroll: the overlay covers what you see, not the top of
            a long list. */}
        <div
          {...dropProps}
          data-drop="assets-grid"
          data-dragging={dragging || undefined}
          className="relative flex min-w-0 flex-1 flex-col"
        >
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4',
              floatingYakClearance,
            )}
          >
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <ScopeSelect scope={scope} onScopeChange={(next) => update('in', scopeParam(next))} />
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
              <input
                ref={picker}
                type="file"
                multiple
                accept={ACCEPT}
                onChange={onPicked}
                hidden
              />
            </div>

            {shown.length === 0 ? (
              <EmptyState where={where} filtered={type !== 'all'} />
            ) : view === 'grid' ? (
              <ul
                aria-label={title}
                className="grid shrink-0 grid-cols-1 gap-3 @min-[440px]/page:grid-cols-2 @min-[900px]/page:grid-cols-3 @min-[1080px]/page:grid-cols-4"
              >
                {shown.map((asset) => {
                  const n = uses.get(asset.id) ?? 0
                  return (
                    <li key={asset.id} className="flex">
                      <AssetCard
                        asset={asset}
                        meta={metaFor(asset, n, handleFor)}
                        status={statusFor(asset, n, now)}
                        selected={asset.id === openId}
                        onClick={() => openAsset(asset.id)}
                      />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="shrink-0">
                <Table
                  label={title}
                  columns={columnsFor(openAsset, uses)}
                  data={shown}
                  idKey="id"
                  textOverflow="truncate"
                  hasHover
                />
              </div>
            )}
          </div>

          {dragging ? <DropOverlay where={where} /> : null}
        </div>
      </AppShell.Content>

      {/* Rendered here so it reads this screen's uploads and folder, and
          portalled after the Page where the shell's panels go — the calendar's
          Drafts panel does the same. */}
      {shell.screenPanelHost
        ? createPortal(
            <AssetDetailPanel
              open={openId !== undefined}
              assetId={lastOpenId}
              uses={uses}
              order={shown.map((a) => a.id)}
              onClose={() => shell.setPanel(null)}
              onOpenFolder={(folderId) => update('in', folderId)}
            />,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}

/**
 * The drag-over state. FileInput's dropzone paint at the size of the grid —
 * `border-input-selected` on `action-ghost-background-hover` — never an
 * overlay token, which lightens in dark. It names where the files will land.
 */
function DropOverlay({ where }: { where: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg border-2 border-dashed border-input-selected bg-action-ghost-background-hover"
    >
      {/* The wash is 10%, so the cards show through it; the message sits on
          the page's own surface to stay readable over them. */}
      <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-background-primary px-8 py-6 text-center shadow-medium">
        <Icon icon={Upload} size="large" className="text-content-primary" />
        <Text weight="semibold" color="emphasized">
          Drop to upload to {where}
        </Text>
        <Text size="sm" color="subtle">
          Images and videos, up to {formatFileSize(MAX_SIZE)} each
        </Text>
      </div>
    </div>
  )
}

function EmptyState({ where, filtered }: { where: string; filtered: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center">
      <Text weight="semibold" color="emphasized">
        {filtered ? 'Nothing of this type here' : `Nothing in ${where} yet`}
      </Text>
      <Text size="sm" color="subtle">
        Drop files here, or use Import to add some.
      </Text>
    </div>
  )
}

/**
 * Figma's Import menu (`40006104:93167`). Upload from computer opens the file
 * picker; the connectors are the mock's, so they say so.
 */
function ImportMenu({
  onUpload,
  onConnector,
}: {
  onUpload: () => void
  onConnector: (what: string) => void
}) {
  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button appearance="secondary" startIcon={Upload} endIcon={ChevronDown}>
            {/* Icon-only beside an open panel, as the details frame draws it. */}
            <span className="@max-[900px]/page:sr-only">Import</span>
          </Button>
        }
      />
      <Menu.Popup align="end" aria-label="Import">
        <Menu.Group>
          <Menu.Item startIcon={Upload} onClick={onUpload}>
            Upload from computer
          </Menu.Item>
          <Menu.Item startIcon={Link} onClick={() => onConnector('Importing from a link')}>
            Paste a link
          </Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Group>
          <Menu.Item startIcon={Palette} description="Connected" onClick={() => onConnector('Canva')}>
            Canva
          </Menu.Item>
          <Menu.Item
            startIcon={HardDrive}
            description="Connected"
            onClick={() => onConnector('Google Drive')}
          >
            Google Drive
          </Menu.Item>
          <Menu.Item startIcon={Box} description="Not connected" onClick={() => onConnector('Dropbox')}>
            Dropbox
          </Menu.Item>
          <Menu.Item
            startIcon={Layers}
            description="Not connected"
            onClick={() => onConnector('Adobe Experience Manager')}
          >
            Adobe Experience Manager
          </Menu.Item>
          <Menu.Item startIcon={Library} description="Not connected" onClick={() => onConnector('Bynder')}>
            Bynder
          </Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Group>
          <Menu.Item startIcon={Plug} onClick={() => onConnector('Integrations')}>
            Manage integrations
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}

/** The folder tree. Figma counts the views and not the folders, and so does this. */
function folderItems(parentId: string | undefined, expanded: readonly string[]): TreeListItem[] {
  return folders
    .filter((f: AssetFolder) => f.parentId === parentId)
    .map((f) => {
      const children = folderItems(f.id, expanded)
      const open = children.length > 0 && expanded.includes(f.id)
      return {
        id: f.id,
        label: f.name,
        startContent: <Icon icon={open ? FolderOpen : Folder} />,
        children: children.length > 0 ? children : undefined,
      }
    })
}

/**
 * The folder column: Library (the views, no guides) over Folders (the tree,
 * with guides), Figma's two `Tree List`s. One selection across both.
 */
function FolderColumn({
  scope,
  assets,
  uses,
  now,
  onScopeChange,
  onNewFolder,
}: {
  scope: AssetScope
  assets: readonly Asset[]
  uses: UseCounts
  now: Date
  onScopeChange: (scope: AssetScope) => void
  onNewFolder: () => void
}) {
  const selected = scopeId(scope)
  // Open the folders Figma opens, and whatever leads to the selected one.
  const [expanded, setExpanded] = useState<string[]>(() => [
    ...new Set([
      ...DEFAULT_EXPANDED,
      ...('folderId' in scope ? folderPath(scope.folderId, folders).map((f) => f.id) : []),
    ]),
  ])
  const viewItems: TreeListItem[] = VIEWS.map((v) => ({
    id: v.id,
    label: v.label,
    startContent: <Icon icon={VIEW_ICONS[v.id]} />,
    endContent: <Badge>{assetsIn({ view: v.id }, assets, folders, uses, now).length}</Badge>,
  }))
  const isFolder = 'folderId' in scope

  return (
    <nav
      aria-label="Asset folders"
      className="flex w-62 shrink-0 flex-col gap-4 overflow-y-auto border-r border-surface-border p-4 max-md:hidden"
    >
      <section className="flex flex-col">
        <Heading level={2} size="sm" weight="semibold" color="subtle" className="px-2 py-1.5">
          Library
        </Heading>
        <TreeList
          aria-label="Library"
          guides={false}
          items={viewItems}
          selectedId={isFolder ? null : selected}
          onSelectedChange={(id) => onScopeChange({ view: id as AssetView })}
        />
      </section>
      <section className="flex flex-col">
        <div className="flex items-center justify-between gap-2 py-1 pr-0 pl-2">
          <Heading level={2} size="sm" weight="semibold" color="subtle">
            Folders
          </Heading>
          <Button
            appearance="ghost"
            size="small"
            startIcon={Plus}
            aria-label="New folder"
            onClick={onNewFolder}
          />
        </div>
        <TreeList
          aria-label="Folders"
          items={folderItems(undefined, expanded)}
          expandedIds={expanded}
          onExpandedChange={setExpanded}
          selectedId={isFolder ? selected : null}
          onSelectedChange={(id) => onScopeChange({ folderId: id })}
        />
      </section>
      <Button appearance="secondary" startIcon={FolderPlus} onClick={onNewFolder} className="w-full">
        New folder
      </Button>
    </nav>
  )
}

/**
 * Below 768 the folder column folds away, and this picks the view or folder
 * instead: every row of both trees, folders indented by depth.
 */
function ScopeSelect({
  scope,
  onScopeChange,
}: {
  scope: AssetScope
  onScopeChange: (scope: AssetScope) => void
}) {
  const items = [
    ...VIEWS.map((v) => ({ value: v.id, label: v.label })),
    ...folders.map((f) => ({
      value: f.id,
      // Em spaces survive HTML's whitespace collapsing; ASCII spaces would not.
      label: `${'\u2003'.repeat(folderPath(f.id, folders).length - 1)}${f.name}`,
    })),
  ]
  return (
    <div className="md:hidden">
      <Select
        size="small"
        hug
        aria-label="Folder"
        value={scopeId(scope)}
        onValueChange={(value) => onScopeChange(parseScope(String(value), folders))}
        items={items}
      >
        {items.map((item) => (
          <Select.Item key={item.value} value={item.value}>
            {item.label}
          </Select.Item>
        ))}
      </Select>
    </div>
  )
}

const added = (asset: Asset) => (asset.upload ? 'Uploading…' : monthDay.format(asset.addedAt))

const columnsFor = (open: (id: string) => void, uses: UseCounts): TableColumn<Asset>[] => [
  {
    key: 'name',
    header: 'Name',
    width: proportional(),
    rowTarget: true,
    renderCell: (a) => (
      <span className="flex min-w-0 items-center gap-2">
        {a.preview === 'video' ? (
          <video src={a.src} muted aria-hidden className="size-8 shrink-0 rounded-xs object-cover" />
        ) : (
          <img src={a.src} alt="" className="size-8 shrink-0 rounded-xs object-cover" />
        )}
        <button
          type="button"
          onClick={() => open(a.id)}
          className={cn(
            'truncate rounded-xs text-left font-semibold text-content-emphasized hover:underline',
            focusRing,
          )}
        >
          {a.name}
        </button>
      </span>
    ),
  },
  { key: 'kind', header: 'Type', width: pixel(104), renderCell: (a) => KIND_NAMES[a.kind] },
  {
    key: 'folder',
    header: 'Folder',
    width: pixel(168),
    renderCell: (a) => (a.folderId ? folderPath(a.folderId, folders).at(-1)!.name : '—'),
  },
  {
    key: 'uses',
    header: 'Used in',
    numeric: true,
    width: pixel(96),
    renderCell: (a) => uses.get(a.id) ?? 0,
  },
  { key: 'added', header: 'Added', width: pixel(104), renderCell: added },
  {
    key: 'size',
    header: 'Size',
    numeric: true,
    width: pixel(96),
    renderCell: (a) => formatFileSize(a.sizeBytes),
  },
]
