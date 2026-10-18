import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Bell, Bot, Moon, Search, Sun } from 'lucide-react'

import { AppShell } from '../../../src/components/AppShell'
import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { Kbd } from '../../../src/components/Kbd'
import { MobileNav, NavItem, SideNav } from '../../../src/components/Nav'
import { Toast } from '../../../src/components/Toast'
import { useDocumentTheme } from '../../shared/theme'
import { me } from '../data/people'
import { PostDetailPanel } from '../screens/calendar/PostDetail'
import { ContactDetailPanel } from '../screens/inbox/ContactDetail'
import { useInbox } from '../screens/inbox/inboxState'
import { WidgetEditPanel } from '../screens/reports/WidgetEditPanel'
import { YakPanel } from '../yak/YakPanel'
import { Logo } from './Logo'
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
  const [panel, setPanel] = useState<ShellPanel>(null)
  // The post panel keeps showing the last post while it slides closed.
  const [lastPostId, setLastPostId] = useState<string>()
  if (panel?.type === 'post' && panel.postId !== lastPostId) setLastPostId(panel.postId)
  const [lastCustomerId, setLastCustomerId] = useState<string>()
  if (panel?.type === 'contact' && panel.customerId !== lastCustomerId) {
    setLastCustomerId(panel.customerId)
  }
  const [lastWidget, setLastWidget] = useState<{ reportId: string; widgetId: string }>()
  if (
    panel?.type === 'widget' &&
    (panel.reportId !== lastWidget?.reportId || panel.widgetId !== lastWidget?.widgetId)
  ) {
    setLastWidget({ reportId: panel.reportId, widgetId: panel.widgetId })
  }

  // A post, contact or widget panel belongs to the screen that opened it: leave the
  // screen and it closes. Yak follows you everywhere, so it stays.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    if (panel && panel.type !== 'yak') setPanel(null)
  }
  const [theme, setTheme] = useDocumentTheme()
  const toast = Toast.useToast()

  const notBuilt = useCallback(
    (what: string) =>
      toast.add({ title: `${what} isn't built yet`, description: 'This is a mock app.' }),
    [toast],
  )

  const toggleYak = useCallback(() => {
    setPanel((current) => (current?.type === 'yak' ? null : { type: 'yak' }))
  }, [])

  // `/` opens Yak and ⌘K opens search, as the rail's keys say. Never while the
  // person is typing — a slash in the composer is a slash.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        toggleYak()
      } else if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        notBuilt('Search')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleYak, notBuilt])

  const shell = useMemo<ShellState>(() => ({ panel, setPanel, notBuilt }), [panel, notBuilt])
  // My inbox's count is live: assign a ticket to yourself anywhere and it goes up.
  const myInboxCount = useInbox().tickets.filter((t) => t.assigneeId === me.id).length
  const badgeFor = (route: AppRoute) => {
    const count = route.path === '/engage/my-inbox' ? myInboxCount : route.badge
    return count ? <Badge>{count}</Badge> : undefined
  }
  const yakOpen = panel?.type === 'yak'

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
        <SideNav.Group
          key={group.label}
          label={group.label}
          startIcon={group.icon}
        >
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

  const account = (
    <NavItem
      href="#/home"
      start={<Avatar name={me.name} src={me.avatar} size="x-small" status="online" surface="nav" />}
    >
      Hi, Nathan!
    </NavItem>
  )

  return (
    <ShellContext.Provider value={shell}>
      <AppShell mode="contained">
        <SideNav
          aria-label="Main"
          logo={<Logo />}
          top={
            <>
              <NavItem
                startIcon={Search}
                end={<Kbd keys="mod+k" />}
                onClick={() => notBuilt('Search')}
              >
                Search
              </NavItem>
              <NavItem
                startIcon={Bot}
                end={<Kbd keys="/" />}
                aria-pressed={yakOpen}
                onClick={toggleYak}
              >
                Yak
              </NavItem>
            </>
          }
          utilities={
            <>
              {themeItem(false)}
              <NavItem startIcon={Bell} newIndicator onClick={() => notBuilt('Notifications')}>
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
        <AppShell.Page className="@container/page">
          <Outlet />
        </AppShell.Page>

        {/* Both always rendered and driven by `open`, so each slides out with
            its content instead of vanishing — a closed Panel renders nothing. */}
        <YakPanel
          open={yakOpen}
          history={panel?.type === 'yak' && (panel.history ?? false)}
          onHistoryChange={(history) => setPanel({ type: 'yak', history })}
          onClose={() => setPanel(null)}
        />
        <PostDetailPanel
          open={panel?.type === 'post'}
          postId={lastPostId}
          onClose={() => setPanel(null)}
        />
        <ContactDetailPanel
          open={panel?.type === 'contact'}
          customerId={lastCustomerId}
          onClose={() => setPanel(null)}
        />
        <WidgetEditPanel
          open={panel?.type === 'widget'}
          target={lastWidget}
          onClose={() => setPanel(null)}
        />

        <MobileNav
          aria-label="Main"
          logo={<Logo />}
          utilities={
            <>
              <NavItem
                startIcon={Bot}
                aria-label="Yak"
                aria-pressed={yakOpen}
                onClick={toggleYak}
              />
              {themeItem(true)}
            </>
          }
        >
          {sections}
          <SideNav.Section header="Account">
            <NavItem startIcon={Bell} newIndicator onClick={() => notBuilt('Notifications')}>
              Notifications
            </NavItem>
            {account}
          </SideNav.Section>
        </MobileNav>
      </AppShell>
      <Toast.Viewport />
    </ShellContext.Provider>
  )
}
