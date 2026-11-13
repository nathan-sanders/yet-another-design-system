import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Moon, Plus, Sun } from 'lucide-react'

import { AppShell } from '../../../src/components/AppShell'
import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { Button } from '../../../src/components/Button'
import { Kbd } from '../../../src/components/Kbd'
import { MobileNav, NavItem, SideNav } from '../../../src/components/Nav'
import { Toast } from '../../../src/components/Toast'
import { useDocumentTheme } from '../../shared/theme'
import { FloatingYak } from '../components/FloatingYak'
import { floatingYakPlaceholder } from '../yak/floating'
import { me } from '../data/people'
import { useInbox } from '../screens/inbox/inboxState'
import { countFor } from '../screens/inbox/model'
import { useTasks } from '../screens/project/tasksState'
import { YakChatContext, useYakChatState } from '../yak/chat'
import { useMarkActive } from '../yak/useMarkActive'
import { YakMark } from '../yak/YakMark'
import { YakPanel } from '../yak/YakPanel'
import { HomeLogo } from './Logo'
import { NewMenu } from './NewMenu'
import { bottom, planGroup, projectsGroup, top, type AppRoute, type RouteGroup } from './routes'
import { ShellContext, type ShellState } from './ShellContext'

/**
 * The frame every screen sits in (`Yet Project / Shell`, `40006259:45550`):
 * Yet Social's contained shell — the rail flush on the canvas, the page a
 * bordered panel beside it — with Yet Project's navigation in the rail.
 *
 * Yak is in the rail and the floating bar exactly as in Yet Social, and
 * opens in its panel after the page (`yak/YakPanel.tsx`). The chat is held
 * here, so the rail, the bar, Home and a project's Overview share it.
 */
export function ProjectShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useDocumentTheme()
  // Held here only so the New button can drop its label on the 56px rail.
  const [railCollapsed, setRailCollapsed] = useState(false)
  const toast = Toast.useToast()

  const notBuilt = useCallback(
    (what: string) =>
      toast.add({ title: `${what} isn't built yet`, description: 'This is a mock app.' }),
    [toast],
  )
  const [screenPanelHost, setScreenPanelHost] = useState<HTMLElement | null>(null)

  const { tasks } = useTasks()
  const yakChat = useYakChatState({ tasks })
  const [yakOpen, setYakOpen] = useState(false)
  // One panel at a time: Yak takes the place of an open task's panel, whose
  // state is the `?task=` in the URL.
  const openYak = useCallback(() => {
    if (location.search) navigate(location.pathname, { replace: true })
    setYakOpen(true)
  }, [location.pathname, location.search, navigate])
  const closeYak = useCallback(() => setYakOpen(false), [])
  const toggleYak = useCallback(() => {
    if (yakOpen) closeYak()
    else openYak()
  }, [yakOpen, openYak, closeYak])

  const shell = useMemo<ShellState>(
    () => ({ notBuilt, screenPanelHost, yakOpen, openYak, closeYak }),
    [notBuilt, screenPanelHost, yakOpen, openYak, closeYak],
  )

  const placeholder = floatingYakPlaceholder(location.pathname)
  const floatingYakInput = useRef<HTMLInputElement>(null)

  // `/` is Yak, as the rail's key says: the floating bar where there is one.
  // Never while the person is typing — a slash in a field is a slash.
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

  const railYak = useMarkActive()
  const mobileYak = useMarkActive()

  // Inbox's badge is Primary's new messages, read live, so it drops as you clear.
  const { messages } = useInbox()
  const inboxCount = countFor(messages, 'primary')
  const badgeFor = (route: AppRoute) => (route.path === '/inbox' ? inboxCount : route.badge)

  const item = (route: AppRoute, exact = false) => (
    <NavItem
      key={route.path}
      href={`#${route.path}`}
      startIcon={route.icon}
      selected={
        exact
          ? location.pathname === route.path
          : location.pathname === route.path || location.pathname.startsWith(`${route.path}/`)
      }
      end={badgeFor(route) ? <Badge>{badgeFor(route)}</Badge> : undefined}
    >
      {route.label}
    </NavItem>
  )
  // All projects is selected only on the list itself: a project's own page
  // selects that project's row, or nothing when it is not one Nathan follows.
  const group = (g: RouteGroup) => (
    <SideNav.Group key={g.label} label={g.label} startIcon={g.icon}>
      {g.routes.map((route) => item(route, route.path === '/projects'))}
    </SideNav.Group>
  )

  /** The navigation, written once for the rail and the phone sheet. */
  const sections = (
    <SideNav.Section>
      {top.map((route) => item(route))}
      {group(projectsGroup)}
      {group(planGroup)}
      {bottom.map((route) => item(route))}
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
      start={
        <Avatar
          name={me.name}
          src={me.avatar}
          size="x-small"
          status="online"
          statusLabel="Available"
          surface="nav"
        />
      }
      onClick={() => notBuilt('The account menu')}
    >
      Hi, Nathan!
    </NavItem>
  )

  const yakItem = (
    <NavItem
      {...railYak.handlers}
      start={<YakMark className="size-4" animate={railYak.active || yakChat.thinking} />}
      end={<Kbd keys="/" />}
      aria-pressed={yakOpen}
      onClick={toggleYak}
    >
      Yak
    </NavItem>
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
                {yakItem}
              </>
            }
            utilities={
              <>
                {themeItem(false)}
                {account}
              </>
            }
          >
            {sections}
          </SideNav>

          {/* A size container, so a screen can lay out by the room the page has. */}
          <AppShell.Page className="relative @container/page">
            <Outlet />
            {/* The bar is Yak's way in, so it goes while Yak is open. */}
            {placeholder && !yakOpen ? (
              <FloatingYak
                key={location.pathname}
                inputRef={floatingYakInput}
                placeholder={placeholder}
              />
            ) : null}
          </AppShell.Page>

          {/* A screen's own panel portals in here (`ShellState.screenPanelHost`).
            `contents`, so the panel is still a child of the shell's row. */}
          <div ref={setScreenPanelHost} className="contents" />
          <YakPanel open={yakOpen} onClose={closeYak} />

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
                  aria-pressed={yakOpen}
                  onClick={toggleYak}
                />
                <NewMenu trigger={<Button startIcon={Plus} aria-label="New" />} />
                {themeItem(true)}
              </>
            }
          >
            {sections}
            <SideNav.Section header="Account">{account}</SideNav.Section>
          </MobileNav>
        </AppShell>
      </YakChatContext.Provider>
      <Toast.Viewport />
    </ShellContext.Provider>
  )
}
