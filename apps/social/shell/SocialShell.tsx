import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Bell, Moon, Plus, Sun } from 'lucide-react'

import { AppShell } from '../../../src/components/AppShell'
import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { Button } from '../../../src/components/Button'
import { Kbd } from '../../../src/components/Kbd'
import { MobileNav, NavItem, SideNav } from '../../../src/components/Nav'
import { Toast } from '../../../src/components/Toast'
import { useDocumentTheme } from '../../shared/theme'
import { FloatingYak } from '../components/FloatingYak'
import type { MentionQuery } from '../data/mentions'
import { me } from '../data/people'
import { DayDetailPanel } from '../screens/calendar/DayDetail'
import { PostDetailPanel } from '../screens/calendar/PostDetail'
import { CreatorDetailPanel } from '../screens/creators/CreatorDetail'
import { ContactDetailPanel } from '../screens/inbox/ContactDetail'
import { MentionsPanel } from '../screens/mentions/MentionsPanel'
import { NotificationsPanel } from '../screens/notifications/NotificationsPanel'
import { useNotifications } from '../screens/notifications/notificationsState'
import { useInbox } from '../screens/inbox/inboxState'
import { isOpen } from '../screens/inbox/model'
import { NewReportDialog } from '../screens/reports/NewReportDialog'
import { ScheduleDialog } from '../screens/calendar/ScheduleDialog'
import { WidgetEditPanel } from '../screens/reports/WidgetEditPanel'
import { useIdeas } from '../screens/ideas/ideasState'
import { useSchedule } from '../screens/calendar/scheduleState'
import { YakChatContext, useYakChatState } from '../yak/chat'
import { floatingYakFor } from '../yak/floating'
import { useMarkActive } from '../yak/useMarkActive'
import { YakMark } from '../yak/YakMark'
import { YakHistory, YakPanel } from '../yak/YakPanel'
import { yakFrom, yakPath } from '../yak/paths'
import { HomeLogo } from './Logo'
import { NewMenu } from './NewMenu'
import { UserMenu, type MyStatus } from './UserMenu'
import { groups, home, type AppRoute } from './routes'
import { ShellContext, type ShellPanel, type ShellState } from './ShellContext'

/**
 * The frame every screen sits in: Figma's `Side Navigation` beside a `Page`, and
 * the 384-wide panel when one is open (`40005911:33082`).
 *
 * `contained`, because the file draws the page as a bordered white panel with
 * the rail flush on the canvas — AppShell's Example 2. That mode reads best on
 * the `canvas` nav theme, which `main.tsx` writes on `<html>` before the first
 * paint.
 */
export function SocialShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [panel, setPanel] = useState<ShellPanel>(null)
  // What Yak may read when it answers, through refs so a prompt asked at any
  // moment sees the schedule and the ideas as they are then.
  const { posts } = useSchedule()
  const { ideas } = useIdeas()
  const yakContext = useRef({ posts, ideas })
  yakContext.current = { posts, ideas }
  const getYakContext = useCallback((from: string) => {
    const ideaId = from.match(/^\/plan\/ideas\/([^/?]+)/)?.[1]
    return {
      posts: yakContext.current.posts,
      idea: ideaId ? yakContext.current.ideas[ideaId] : undefined,
    }
  }, [])
  const yakChat = useYakChatState({ getContext: getYakContext })
  // On the full view, Yak *is* the page: the rail's button closes it, and the
  // panel stays shut however the shell's state says it was left.
  const onYakPage = location.pathname === '/yak'
  const yakFromPage = yakFrom(params)
  // The post panel keeps showing the last post while it slides closed.
  const [lastPostId, setLastPostId] = useState<string>()
  if (panel?.type === 'post' && panel.postId !== lastPostId) setLastPostId(panel.postId)
  const [lastDay, setLastDay] = useState<string>()
  if (panel?.type === 'day' && panel.date !== lastDay) setLastDay(panel.date)
  const [lastCustomerId, setLastCustomerId] = useState<string>()
  if (panel?.type === 'contact' && panel.customerId !== lastCustomerId) {
    setLastCustomerId(panel.customerId)
  }
  const [lastCreatorId, setLastCreatorId] = useState<string>()
  if (panel?.type === 'creator' && panel.creatorId !== lastCreatorId) {
    setLastCreatorId(panel.creatorId)
  }
  const [lastWidget, setLastWidget] = useState<{ reportId: string; widgetId: string }>()
  if (
    panel?.type === 'widget' &&
    (panel.reportId !== lastWidget?.reportId || panel.widgetId !== lastWidget?.widgetId)
  ) {
    setLastWidget({ reportId: panel.reportId, widgetId: panel.widgetId })
  }
  const [lastMentions, setLastMentions] = useState<MentionQuery>()
  if (panel?.type === 'mentions' && panel.query.key !== lastMentions?.key) {
    setLastMentions(panel.query)
  }

  // A post, contact or widget panel belongs to the screen that opened it: leave the
  // screen and it closes. Yak follows you everywhere, so it stays. A navigation
  // can carry the panel the next screen opens with (`state.panel`): a full view
  // collapsing back to its panel.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    const carried = (location.state as { panel?: ShellPanel } | null)?.panel
    if (carried) setPanel(carried)
    else if (panel && panel.type !== 'yak') setPanel(null)
  }
  const [theme, setTheme] = useDocumentTheme()
  // Held here only so the New button can drop its label on the 56px rail: the
  // top slot is ours, and SideNav does not reshape what we put in it.
  const [railCollapsed, setRailCollapsed] = useState(false)
  // The user menu's My status; both account rows' avatars read it.
  const [myStatus, setMyStatus] = useState<MyStatus>('available')
  const toast = Toast.useToast()

  const notBuilt = useCallback(
    (what: string) =>
      toast.add({ title: `${what} isn't built yet`, description: 'This is a mock app.' }),
    [toast],
  )

  const toggleYak = useCallback(() => {
    if (onYakPage) {
      navigate(yakFromPage)
      return
    }
    setPanel((current) => (current?.type === 'yak' ? null : { type: 'yak' }))
  }, [onYakPage, navigate, yakFromPage])

  // The floating bar: on every page but Engage's (they pin a reply box to the
  // bottom) and the full view, and gone while Yak is open in its panel.
  const floatingYak = floatingYakFor(location.pathname)
  const yakInPanel = panel?.type === 'yak' || panel?.type === 'yak-history'
  const floatingYakInput = useRef<HTMLInputElement>(null)

  // `/` is Yak, as the rail's key says: the floating bar when there is one on
  // screen, the panel when there is not. Never while the person is typing — a
  // slash in the composer is a slash.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        // `offsetParent` is null while the bar is `display: none` — on a phone.
        const input = floatingYakInput.current
        if (input?.offsetParent) input.focus()
        else toggleYak()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleYak])

  const [screenPanelHost, setScreenPanelHost] = useState<HTMLElement | null>(null)
  const shell = useMemo<ShellState>(
    () => ({ panel, setPanel, notBuilt, screenPanelHost }),
    [panel, notBuilt, screenPanelHost],
  )
  // My inbox's count is live: assign a ticket to yourself anywhere and it goes
  // up, complete one and it goes down. It counts what My inbox's Open shows.
  const myInboxCount = useInbox().tickets.filter((t) => t.assigneeId === me.id && isOpen(t)).length
  const badgeFor = (route: AppRoute) => {
    const count = route.path === '/engage/my-inbox' ? myInboxCount : route.badge
    return count ? <Badge>{count}</Badge> : undefined
  }
  const yakOpen = panel?.type === 'yak' && !onYakPage
  const notificationsOpen = panel?.type === 'notifications'
  const toggleNotifications = () =>
    setPanel((current) => (current?.type === 'notifications' ? null : { type: 'notifications' }))
  // The bell's dot is the unread count, so reading the last one puts it out.
  // NavItem draws the dot `aria-hidden`; the count is said in the name instead.
  const { unreadCount } = useNotifications()
  const notificationsLabel = unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'
  // The nav marks scribble while pointed at or focused, and while Yak answers.
  const railYak = useMarkActive()
  const mobileYak = useMarkActive()

  /** The navigation, written once for the rail and the phone sheet. */
  const sections = (
    <SideNav.Section>
      <NavItem
        href={`#${home.path}`}
        startIcon={home.icon}
        selected={location.pathname === home.path}
      >
        {home.label}
      </NavItem>
      {groups.map((group) => (
        <SideNav.Group key={group.label} label={group.label} startIcon={group.icon}>
          {group.routes.map((route) => (
            <NavItem
              key={route.path}
              href={`#${route.path}`}
              selected={location.pathname.startsWith(route.path)}
              end={badgeFor(route)}
            >
              {route.label}
            </NavItem>
          ))}
        </SideNav.Group>
      ))}
    </SideNav.Section>
  )

  const themeItem = (iconOnly: boolean): ReactNode => {
    const label = theme === 'dark' ? 'Light mode' : 'Dark mode'
    const icon = theme === 'dark' ? Sun : Moon
    const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')
    return iconOnly ? (
      <NavItem startIcon={icon} aria-label={label} onClick={toggle} />
    ) : (
      <NavItem startIcon={icon} onClick={toggle}>
        {label}
      </NavItem>
    )
  }

  // The last item opens the user menu (`40005964:74176`), above the row in
  // both the rail and the phone sheet.
  const account = (
    <UserMenu
      status={myStatus}
      onStatusChange={setMyStatus}
      trigger={
        <NavItem
          start={
            <Avatar
              name={me.name}
              src={me.avatar}
              size="x-small"
              status={myStatus === 'away' ? 'offline' : 'online'}
              statusLabel={myStatus === 'away' ? 'Away' : 'Available'}
              surface="nav"
            />
          }
        >
          Hi, Nathan!
        </NavItem>
      }
    />
  )

  return (
    <ShellContext.Provider value={shell}>
      <YakChatContext.Provider value={yakChat}>
        <AppShell mode="contained">
          <SideNav
            aria-label="Main"
            logo={<HomeLogo />}
            collapsed={railCollapsed}
            onCollapsedChange={setRailCollapsed}
            top={
              <>
                {/* Figma's Top Slot leads with it (`40005939:57450`): 40 tall,
                    the rail's full width, flush on Yak with no gap. */}
                {railCollapsed ? (
                  <NewMenu
                    tooltip="New"
                    trigger={<Button size="large" startIcon={Plus} aria-label="New" />}
                  />
                ) : (
                  <NewMenu
                    trigger={
                      <Button size="large" startIcon={Plus} className="w-full">
                        New
                      </Button>
                    }
                  />
                )}
                <NavItem
                  {...railYak.handlers}
                  start={
                    <YakMark className="size-4" animate={railYak.active || yakChat.thinking} />
                  }
                  end={<Kbd keys="/" />}
                  aria-pressed={yakOpen || onYakPage}
                  onClick={toggleYak}
                >
                  Yak
                </NavItem>
              </>
            }
            utilities={
              <>
                {themeItem(false)}
                <NavItem
                  startIcon={Bell}
                  newIndicator={unreadCount > 0}
                  aria-label={notificationsLabel}
                  aria-pressed={notificationsOpen}
                  onClick={toggleNotifications}
                >
                  Notifications
                </NavItem>
                {account}
              </>
            }
          >
            {sections}
          </SideNav>

          {/* A size container, so a screen can lay out by the room the page
            really has: the window minus the rail and whatever panel is open
            at whatever width it was dragged to. `@max-[…]/page:` reads it. */}
          <AppShell.Page className="relative @container/page">
            <Outlet />
            {floatingYak && !yakInPanel && (
              <FloatingYak
                key={location.pathname}
                inputRef={floatingYakInput}
                placeholder={floatingYak.placeholder}
                mode={floatingYak.mode}
                opens={floatingYak.opens}
              />
            )}
          </AppShell.Page>

          {/* A screen's own panel portals in here (`ShellState.screenPanelHost`).
            `contents`, so the panel is still a child of the shell's row. */}
          <div ref={setScreenPanelHost} className="contents" />

          {/* Both always rendered and driven by `open`, so each slides out with
            its content instead of vanishing — a closed Panel renders nothing. */}
          <YakPanel
            open={yakOpen}
            history={panel?.type === 'yak' && (panel.history ?? false)}
            onHistoryChange={(history) => setPanel({ type: 'yak', history })}
            onClose={() => setPanel(null)}
            onExpand={() => {
              setPanel(null)
              navigate(yakPath(location.pathname))
            }}
          />
          <YakHistory
            open={panel?.type === 'yak-history'}
            onOpenChange={(open) => setPanel(open ? { type: 'yak-history' } : null)}
            onNewChat={() => {
              yakChat.clear()
              setPanel(null)
            }}
            onPick={(title) => {
              yakChat.clear()
              yakChat.ask(title, yakFromPage)
              setPanel(null)
            }}
          />
          <PostDetailPanel
            open={panel?.type === 'post'}
            postId={lastPostId}
            tab={panel?.type === 'post' ? panel.tab : undefined}
            noteId={panel?.type === 'post' ? panel.noteId : undefined}
            onClose={() => setPanel(null)}
          />
          <DayDetailPanel
            open={panel?.type === 'day'}
            date={lastDay}
            onClose={() => setPanel(null)}
          />
          <ContactDetailPanel
            open={panel?.type === 'contact'}
            customerId={lastCustomerId}
            onClose={() => setPanel(null)}
          />
          <CreatorDetailPanel
            open={panel?.type === 'creator'}
            creatorId={lastCreatorId}
            tab={panel?.type === 'creator' ? panel.tab : undefined}
            onClose={() => setPanel(null)}
          />
          <WidgetEditPanel
            open={panel?.type === 'widget'}
            target={lastWidget}
            onClose={() => setPanel(null)}
          />
          <MentionsPanel
            open={panel?.type === 'mentions'}
            query={lastMentions}
            onClose={() => setPanel(null)}
          />
          <NotificationsPanel open={notificationsOpen} onClose={() => setPanel(null)} />
          <NewReportDialog />
          <ScheduleDialog />

          <MobileNav
            aria-label="Main"
            logo={<HomeLogo />}
            utilities={
              <>
                <NavItem
                  {...mobileYak.handlers}
                  start={
                    <YakMark className="size-4" animate={mobileYak.active || yakChat.thinking} />
                  }
                  aria-label="Yak"
                  aria-pressed={yakOpen || onYakPage}
                  onClick={toggleYak}
                />
                <NewMenu trigger={<Button startIcon={Plus} aria-label="New" />} />
                {themeItem(true)}
              </>
            }
          >
            {sections}
            <SideNav.Section header="Account">
              <NavItem
                startIcon={Bell}
                newIndicator={unreadCount > 0}
                aria-label={notificationsLabel}
                aria-pressed={notificationsOpen}
                onClick={toggleNotifications}
              >
                Notifications
              </NavItem>
              {account}
            </SideNav.Section>
          </MobileNav>
        </AppShell>
        <Toast.Viewport />
      </YakChatContext.Provider>
    </ShellContext.Provider>
  )
}
