import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router'
import {
  Check,
  CircleCheck,
  CircleDashed,
  CircleDot,
  ClipboardList,
  Ellipsis,
  MessageCircle,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { ChatComposer } from '../../../../src/components/Chat'
import { Icon } from '../../../../src/components/Icon'
import { Menu } from '../../../../src/components/Menu'
import { Panel } from '../../../../src/components/Panel'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { focusRing } from '../../../../src/lib/focus'
import { cn } from '../../../../src/lib/cn'
import { datedText, day, shortDate } from '../../data/dates'
import { personFor } from '../../data/people'
import type { MyRequest } from '../../data/requests'
import { useShell } from '../../shell/ShellContext'
import { Comment } from '../project/TaskPanel'
import { FormsMenu } from './FormsMenu'
import { firstName, MY_STATUS, openCount } from './model'
import { minePath, queuePath } from './paths'
import { useRequests } from './requestsState'

/**
 * My requests (`Requests - My requests`, `40006301:30717`): what you asked
 * other teams for, in a table — Request, Status, Owner, Updated — under
 * "Requests" and a "Queue · 5 / My requests" segment. A row opens its
 * Request panel (`Request Panel`, `40006420:161456`), `?request=`.
 */
export function MyRequestsScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const shell = useShell()
  const { requests, mine } = useRequests()
  const openId = params.get('request')
  const open = mine.find((r) => r.id === openId)
  // Kept after the URL drops it, so the panel slides out with what it showed.
  const [shownId, setShownId] = useState(open?.id)
  if (open && open.id !== shownId) setShownId(open.id)
  const shown = mine.find((r) => r.id === shownId)

  const columns: TableColumn<MyRequest>[] = [
    {
      key: 'title',
      header: 'Request',
      layout: 'fill',
      rowTarget: true,
      renderCell: (request) => (
        <a
          href={`#${minePath(request.id)}`}
          className={cn('min-w-0 truncate rounded-sm text-content-primary', focusRing)}
        >
          {request.title}
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(130),
      renderCell: (request) => (
        <Badge color={MY_STATUS[request.status].color}>{MY_STATUS[request.status].label}</Badge>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      width: pixel(160),
      renderCell: (request) => {
        const owner = personFor(request.ownerId)
        return (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={owner.name} src={owner.avatar} alt="" size="x-small" />
            <span className="truncate">{owner.name}</span>
          </span>
        )
      },
    },
    {
      key: 'updated',
      header: 'Updated',
      width: pixel(90),
      renderCell: (request) => request.updatedAge ?? shortDate.format(day(request.updated)),
    },
  ]

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Requests
            </Heading>
            <SegmentedControl
              aria-label="Requests"
              appearance="secondary"
              value="mine"
              onValueChange={(next) => {
                if (next === 'queue') navigate(queuePath('new'))
              }}
            >
              <SegmentedControl.Item value="queue">
                {`Queue · ${openCount(requests)}`}
              </SegmentedControl.Item>
              <SegmentedControl.Item value="mine">My requests</SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <>
            <FormsMenu className="max-md:hidden" />
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup align="end" aria-label="My requests options">
                <Menu.Group>
                  <Menu.Item
                    startIcon={ClipboardList}
                    onClick={() => navigate('/requests/forms/creative/submit')}
                  >
                    New creative request
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          </>
        }
      />
      <AppShell.Content className="p-4">
        <div className="shrink-0">
          <Table
            label="My requests"
            columns={columns}
            data={mine}
            idKey="id"
            selectedKeys={open ? [open.id] : []}
          />
        </div>
      </AppShell.Content>
      {shell.screenPanelHost
        ? createPortal(
            <RequestPanel
              request={shown}
              open={Boolean(open)}
              onClose={() => navigate(minePath())}
            />,
            shell.screenPanelHost,
          )
        : null}
    </>
  )
}

const LINKED_ICON = { todo: CircleDashed, 'in-progress': CircleDot, done: CircleCheck } as const

/**
 * Request (`Request Panel`): the title (lg semibold), then its steps a line
 * each — a check for each one done, an open circle for where it is now, the
 * date at the end — the linked task, and the owner's last note with
 * "Message Marcus". One waiting on you shows the owner's question and a box
 * to answer it, which puts it back with them.
 */
function RequestPanel({
  request,
  open,
  onClose,
}: {
  request?: MyRequest
  open: boolean
  onClose: () => void
}) {
  const shell = useShell()
  const toast = Toast.useToast()
  const { answerMine } = useRequests()
  return (
    <Panel
      aria-label="Request"
      open={open && request !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      {request ? (
        <>
          <Panel.Header icon={ClipboardList}>Request</Panel.Header>
          <Panel.Body className="flex flex-col gap-3">
            <Heading level={2} size="lg" weight="semibold">
              {request.title}
            </Heading>
            <ol aria-label="Progress" className="flex flex-col gap-2">
              {request.steps.map((step) => (
                <li key={step.text} className="flex items-center gap-2">
                  <Icon
                    icon={step.current ? CircleDot : Check}
                    className="shrink-0 text-content-primary"
                  />
                  <Text render={<span />} className="min-w-0 flex-1">
                    {step.current ? <span className="sr-only">Now: </span> : null}
                    {datedText(step.text)}
                  </Text>
                  <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                    {step.date === 'now' ? 'Now' : shortDate.format(day(step.date))}
                  </Text>
                </li>
              ))}
            </ol>
            {request.answers?.length ? (
              <>
                <Heading level={3} size="base" weight="semibold">
                  What you asked
                </Heading>
                {request.answers.map((a) => (
                  <div key={a.question} className="flex flex-col">
                    <Text size="sm" color="subtle">
                      {a.question}
                    </Text>
                    <Text>{a.answer}</Text>
                  </div>
                ))}
              </>
            ) : null}
            {request.linkedTask ? (
              <>
                <Heading level={3} size="base" weight="semibold">
                  Linked task
                </Heading>
                <span className="flex items-center gap-2">
                  <Icon
                    icon={LINKED_ICON[request.linkedTask.status]}
                    className="shrink-0 text-content-primary"
                  />
                  <Text render={<span />}>{request.linkedTask.title}</Text>
                </span>
              </>
            ) : null}
            {request.question ? (
              <>
                <Heading level={3} size="base" weight="semibold">
                  {firstName(request.ownerId)} asked
                </Heading>
                <Comment
                  comment={{
                    id: `${request.id}-question`,
                    authorId: request.ownerId,
                    age: request.updatedAge ?? '',
                    body: request.question,
                  }}
                />
                <ChatComposer
                  aria-label={`Answer ${firstName(request.ownerId)}`}
                  placeholder={`Answer ${firstName(request.ownerId)}…`}
                  onSubmit={(body) => {
                    answerMine(request.id, body)
                    toast.add({
                      title: 'Answered',
                      description: `It’s back with ${firstName(request.ownerId)}.`,
                    })
                  }}
                />
              </>
            ) : null}
            {request.replies?.length ? (
              <>
                <Heading level={3} size="base" weight="semibold">
                  Your answer
                </Heading>
                {request.replies.map((reply) => (
                  <Comment key={reply.id} comment={reply} />
                ))}
              </>
            ) : null}
            {request.note ? (
              <>
                <Heading level={3} size="base" weight="semibold">
                  {firstName(request.ownerId)}’s last note
                </Heading>
                <Text>{datedText(request.note)}</Text>
                <Button
                  appearance="secondary"
                  startIcon={MessageCircle}
                  className="self-start"
                  onClick={() => shell.notBuilt(`Messaging ${firstName(request.ownerId)}`)}
                >
                  Message {firstName(request.ownerId)}
                </Button>
              </>
            ) : null}
          </Panel.Body>
        </>
      ) : null}
    </Panel>
  )
}
