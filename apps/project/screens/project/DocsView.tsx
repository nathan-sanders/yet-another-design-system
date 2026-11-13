import { FileText, FolderOpen, ListFilter, Paperclip, Plus } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ClickableCard } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { OwnerCell } from '../../components/ProjectCells'
import { datedText } from '../../data/dates'
import { docsFor, type ProjectDoc } from '../../data/docs'
import { personFor } from '../../data/people'
import type { Project } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { projectPath } from './paths'

/** "Updated", as drawn, its one dated value moved with the schedule; lower-case after "updated" in a sentence. */
function updatedLabel(doc: ProjectDoc, inSentence = false): string {
  const label = datedText(doc.updated)
  return inSentence && label === 'Yesterday' ? 'yesterday' : label
}

/**
 * A project's Docs (`Docs - Project Docs tab`, `40006309:36927`): Filter on
 * the left and Upload and New doc on the right; the pinned brief as a card;
 * then every doc and file in a Table — Name, Type, Owner, Linked tasks,
 * Updated. Opening a doc, the editor and its comments, history and Yak's
 * to-dos (`Docs & status · Deep dive`, `40006309:36926`) are drawn and not
 * built, so a doc says so when opened.
 */
export function DocsView({ project }: { project: Project }) {
  const shell = useShell()
  const docs = docsFor(project.id)
  const open = () => shell.notBuilt('Opening a doc')

  if (docs.length === 0) {
    return (
      <NotBuiltMessage
        icon={FolderOpen}
        title="No docs in this mock yet"
        body={`Only Austin store opening has docs so far; ${project.name}’s come in a later slice.`}
        link={{ href: `#${projectPath('austin', 'docs')}`, label: 'Open Austin store opening' }}
      />
    )
  }

  const pinned = docs.find((doc) => doc.pinned)
  const columns: TableColumn<ProjectDoc>[] = [
    {
      key: 'name',
      header: 'Name',
      layout: 'fill',
      rowTarget: true,
      renderCell: (doc) => (
        <span className="flex min-w-0 items-center gap-2">
          <Icon icon={doc.kind === 'doc' ? FileText : Paperclip} className="shrink-0" />
          <button
            type="button"
            onClick={open}
            className={cn('min-w-0 truncate rounded-sm text-left', focusRing)}
          >
            {doc.name}
          </button>
        </span>
      ),
    },
    {
      key: 'kind',
      header: 'Type',
      width: pixel(110),
      // In a block, or the line the cell wraps it in adds a descender (FINDINGS 10).
      renderCell: (doc) => (
        <span className="flex">
          <Token>{doc.kind === 'doc' ? 'Doc' : 'File'}</Token>
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      width: pixel(170),
      renderCell: (doc) => <OwnerCell id={doc.ownerId} />,
    },
    {
      // A real number, so the Table sets it in mono; left, as drawn.
      key: 'linked',
      header: 'Linked tasks',
      width: pixel(110),
      align: 'left',
      renderCell: (doc) => doc.taskIds.length,
    },
    {
      key: 'updated',
      header: 'Updated',
      width: pixel(100),
      renderCell: (doc) => updatedLabel(doc),
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Ghost on the left; Upload Ghost and New doc Secondary on the right. */}
      <div className="flex flex-wrap items-center gap-1">
        <Button
          appearance="ghost"
          startIcon={ListFilter}
          onClick={() => shell.notBuilt('Filtering docs')}
        >
          Filter
        </Button>
        <span className="flex-1" />
        <Button
          appearance="ghost"
          startIcon={Paperclip}
          onClick={() => shell.notBuilt('Uploading')}
        >
          Upload
        </Button>
        <Button appearance="secondary" startIcon={Plus} onClick={() => shell.notBuilt('New doc')}>
          New doc
        </Button>
      </div>

      {pinned ? (
        <ClickableCard onClick={open} className="shrink-0 px-4">
          <span className="flex w-full items-center gap-3 text-left">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-background-subtle text-content-primary">
              <Icon icon={FileText} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <Text render={<span />} weight="semibold" color="emphasized" truncate>
                {pinned.name}
              </Text>
              <Text render={<span />} size="sm" color="subtle" truncate>
                {pinned.pinned!.kind} · updated {updatedLabel(pinned, true)} by{' '}
                {personFor(pinned.ownerId).name} · {pinned.taskIds.length} linked tasks
              </Text>
            </span>
            <Token>Pinned</Token>
          </span>
        </ClickableCard>
      ) : null}

      <div className="shrink-0">
        <Table label={`${project.name} docs`} columns={columns} data={docs} idKey="id" />
      </div>
    </div>
  )
}
