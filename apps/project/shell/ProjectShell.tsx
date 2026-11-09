import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router'
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
import { useMarkActive } from '../yak/useMarkActive'
import { YakMark } from '../yak/YakMark'
import { HomeLogo } from './Logo'
import { NewMenu } from './NewMenu'
import { bottom, planGroup, projectsGroup, top, type AppRoute, type RouteGroup } from './routes'
import { ShellContext, type ShellState } from './ShellContext'

/**
 * The frame every screen sits in (`Yet Project / Shell`, `40006259:45550`):
 * Yet Social's contained shell — the rail flush on the canvas, the page a
 * bordered panel beside it — with Yet Project's navigation in the rail.
 *
 * Yak is in the rail and the floating bar exactly as in Yet Social, and is
 * not built here yet: both say so when used.
 */
export function ProjectShell() {
  const location = useLocation()
  const [theme, setTheme] = useDocumentTheme()
  // Held here only so the New button can drop its label on the 56px rail.
  const [railCollapsed, setRailCollapsed] = useState(false)
  const toast = Toast.useToast()

  const notBuilt = useCallback(
    (what: string) =>
      toast.add({ title: `${what} isn't built yet`, description: 'This is a mock app.' }),
    [toast],
  )
  const shell = useMemo<ShellState>(() => ({ notBuilt }), [notBuilt])

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
        else notBuilt('Yak')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [notBuilt])

  const railYak = useMarkActive()
  const mobileYak = useMarkActive()

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
      end={route.badge ? <Badge>{route.badge}</Badge> : undefined}
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
      start={<YakMark className="size-4" animate={railYak.active} />}
      end={<Kbd keys="/" />}
      onClick={() => notBuilt('Yak')}
    >
      Yak
    </NavItem>
  )

  return (
    <ShellContext.Provider value={shell}>
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
          {placeholder ? (
            <FloatingYak
              key={location.pathname}
              inputRef={floatingYakInput}
              placeholder={placeholder}
            />
          ) : null}
        </AppShell.Page>

        <MobileNav
          aria-label="Main"
          logo={<HomeLogo />}
          utilities={
            <>
              <NavItem
                {...mobileYak.handlers}
                start={<YakMark className="size-4" animate={mobileYak.active} />}
                aria-label="Yak"
                onClick={() => notBuilt('Yak')}
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
      <Toast.Viewport />
    </ShellContext.Provider>
  )
}
