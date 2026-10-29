import {
  Box,
  ChevronDown,
  HardDrive,
  Layers,
  Library,
  Link,
  Palette,
  Plug,
  Upload,
} from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'

/**
 * Figma's Import menu (`40006104:93167`). Upload from computer opens the file
 * picker; the connectors are the mock's, so they say so.
 */
export function ImportMenu({
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
          <Menu.Item
            startIcon={Palette}
            description="Connected"
            onClick={() => onConnector('Canva')}
          >
            Canva
          </Menu.Item>
          <Menu.Item
            startIcon={HardDrive}
            description="Connected"
            onClick={() => onConnector('Google Drive')}
          >
            Google Drive
          </Menu.Item>
          <Menu.Item
            startIcon={Box}
            description="Not connected"
            onClick={() => onConnector('Dropbox')}
          >
            Dropbox
          </Menu.Item>
          <Menu.Item
            startIcon={Layers}
            description="Not connected"
            onClick={() => onConnector('Adobe Experience Manager')}
          >
            Adobe Experience Manager
          </Menu.Item>
          <Menu.Item
            startIcon={Library}
            description="Not connected"
            onClick={() => onConnector('Bynder')}
          >
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
