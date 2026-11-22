import { useNavigate } from 'react-router'
import { ClipboardList, FilePen, Send } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { useRequests } from './requestsState'
import { formPath, submitPath } from './paths'

/**
 * The Top Bar's Forms button (`Requests - Queue`, `40006284:19161`). The file
 * draws the button and no menu under it, nor a list of forms, so it opens the
 * two places a form is used: filling it in, and building it. Only the
 * Creative request form is drawn, so it is the only one listed.
 */
export function FormsMenu({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { form } = useRequests()
  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button appearance="ghost" startIcon={ClipboardList} className={className}>
            Forms
          </Button>
        }
      />
      <Menu.Popup align="end" aria-label="Forms" className="w-71">
        <Menu.Group label="Ask for something">
          <Menu.Item
            startIcon={Send}
            description={`The ${form.team} team reviews it`}
            onClick={() => navigate(submitPath(form.id))}
          >
            {form.short}
          </Menu.Item>
        </Menu.Group>
        <Menu.Group label="Forms you manage">
          <Menu.Item
            startIcon={FilePen}
            description={form.published ? 'Published' : 'Not published'}
            onClick={() => navigate(formPath(form.id, 'settings'))}
          >
            {form.name}
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}
