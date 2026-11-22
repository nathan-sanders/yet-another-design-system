import { useNavigate, useSearchParams } from 'react-router'
import { Ellipsis, FileText, ListFilter, Upload } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { OwnerCell, ProjectNameCell } from '../../components/ProjectCells'
import { datedText } from '../../data/dates'
import type { ProjectDoc } from '../../data/docs'
import { me } from '../../data/people'
import { projectFor } from '../../data/projects'
import { useShell } from '../../shell/ShellContext'
import { floatingYakClearance } from '../../yak/floating'
import { useDocs } from './docsState'
import { docsShown, linkedCount, type DocsShow } from './model'
import { docPath, docsPath } from './paths'

const EMPTY: Record<Exclude<DocsShow, 'all'>, string> = {
  mine: 'Docs you own or have edited show up here.',
  shared: 'Docs someone shares with you by name show up here.',
}

/**
 * Docs (`Docs - All docs`, `40006283:18038`): every doc across projects in
 * one Table — Name, Project, Owner, Linked tasks, Updated, at the file's
 * 556 / 220 / 170 / 110 / 100 — under "Docs" and an All / Mine / Shared
 * segment (`?show=`). Files stay on their project's Docs tab. A row opens
 * the doc.
 */
export function AllDocsScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const shell = useShell()
  const { docs } = useDocs()
  const requested = params.get('show')
  const show: DocsShow = requested === 'mine' || requested === 'shared' ? requested : 'all'
  const shown = docsShown(docs, show, me.id)

  const columns: TableColumn<ProjectDoc>[] = [
    {
      key: 'name',
      header: 'Name',
      layout: 'fill',
      rowTarget: true,
      renderCell: (doc) => (
        <span className="flex min-w-0 items-center gap-2">
          <Icon icon={FileText} className="shrink-0" />
          <a
            href={`#${docPath(doc.id, docsPath(show))}`}
            className={cn('min-w-0 truncate rounded-sm text-content-primary', focusRing)}
          >
            {doc.name}
          </a>
        </span>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      width: pixel(220),
      renderCell: (doc) => <ProjectNameCell project={projectFor(doc.projectId)!} />,
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
      renderCell: (doc) => linkedCount(doc),
    },
    {
      key: 'updated',
      header: 'Updated',
      width: pixel(100),
      renderCell: (doc) => datedText(doc.updated),
    },
  ]

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Docs
            </Heading>
            <SegmentedControl
              aria-label="Show"
              appearance="secondary"
              value={show}
              onValueChange={(next) => navigate(docsPath(next as DocsShow))}
            >
              <SegmentedControl.Item value="all">All</SegmentedControl.Item>
              <SegmentedControl.Item value="mine">Mine</SegmentedControl.Item>
              <SegmentedControl.Item value="shared">Shared</SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <>
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              onClick={() => shell.notBuilt('Filtering docs')}
            >
              Filter
            </Button>
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="Docs options">
                <Menu.Group>
                  <Menu.Item startIcon={Upload} onClick={() => shell.notBuilt('Importing a doc')}>
                    Import a doc
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className={cn('p-4', floatingYakClearance)}>
        {show !== 'all' && shown.length === 0 ? (
          <Text color="subtle" className="py-16 text-center">
            {EMPTY[show]}
          </Text>
        ) : (
          <div className="shrink-0">
            <Table label="Docs" columns={columns} data={shown} idKey="id" />
          </div>
        )}
      </AppShell.Content>
    </>
  )
}
