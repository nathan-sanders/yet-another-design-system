import { useContext, useMemo } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { AppShellContext, type AppShellContextValue } from './context'
import {
  appShell,
  appShellContent,
  appShellPage,
  type AppShellMode,
  type AppShellNavigation,
} from './styles'

/**
 * AppShell — the frame an application sits in: a nav, and the page beside or
 * below it.
 *
 * Mirrors the frames on the Figma page `↪ App Shell` (`40004484:26623`). There is
 * no component set there yet — four frames and two worked examples — so this is
 * the code going first, with the file owing a component. Composed, like
 * `SideNav`:
 *
 *     <AppShell mode="contained">
 *       <SideNav aria-label="Main">…</SideNav>
 *       <AppShell.Page>
 *         <TopBar search={…} actions={…} />
 *         <AppShell.Content>…</AppShell.Content>
 *       </AppShell.Page>
 *     </AppShell>
 *
 * **Two modes, and they are about the page, not the nav.** `floating` is
 * Example 1 (`40005257:45475`): the page paints nothing, the blocks sit straight
 * on the canvas, and the nav floats above it on its shadow. `contained` is
 * Example 2 (`40005257:47448`): the page is a `Surface/Background Primary` panel
 * inside a `Surface/Border`, the content sits in it with 16px of room, and the
 * nav is flush with the canvas. The first works on any nav theme; the second
 * reads best with `<html data-nav-theme="canvas">`, which paints the rail in the
 * page's own background so the panel is the only surface on screen. The shell
 * cannot set that attribute — the navigation tier is switched on `<html>`, on
 * purpose — so it is the application's line to write.
 *
 * **The nav's `floating` default comes from here.** A shadow under a rail that is
 * meant to sit flush is the mistake `contained` invites, and a caller who has
 * already written `mode="contained"` should not have to say it a second time on
 * the `SideNav`. So the shell publishes its mode through context and both bars
 * read it for their default: floating in `floating`, flush in `contained`, flush
 * whenever the frame is off. An explicit `floating` on the bar still wins, and a
 * bar outside a shell is exactly as it was.
 *
 * **`frame` is the 8px.** Figma draws each layout twice — once inside
 * `spacing/2` of padding and gap, once docked to the window edge with neither.
 * The docked pair is `frame={false}`.
 *
 * **`navigation` is declared, not derived.** The shell could look at its first
 * child's type, but that breaks the moment an application wraps its nav in a
 * component of its own, and a layout that flips because of a refactor is worse
 * than a prop. `side` is a rail beside the page; `top` is a bar above it.
 *
 * **`Content` is a `<main>`.** With the rail's `<nav>` and the TopBar's
 * `<header>` that gives a screen reader three named regions and a skip target.
 * It is also the shell's one scrolling region — the frame is the viewport, so
 * the rail stays put and the page moves under the bar, which is what an app
 * shell is for.
 *
 * **The rail can be resized from the seam, and that is the rail's to offer.**
 * `resizable` on the `SideNav` draws a `ResizeHandle` that is exactly this
 * shell's 8px gap; the shell's only part is to say, through context, whether
 * the gap exists. See `SideNav`.
 *
 * **Not a Base UI component.** A layout frame has no headless primitive; this is
 * three `div`s and a `main`, like `BentoGrid`.
 */

export interface AppShellProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'className'
> {
  /** The nav and the page: a `SideNav` or `TopNav`, then an `AppShell.Page`. */
  children: ReactNode
  /**
   * How the page is drawn. `floating` puts the blocks on the canvas with the nav
   * lifted above it; `contained` puts them inside a bordered surface with the
   * nav flush. Figma's Example 1 and Example 2.
   */
  mode?: AppShellMode
  /** Where the nav is. `side` lays the frame as a row, `top` as a column. */
  navigation?: AppShellNavigation
  /**
   * The `spacing/2` padding around everything and gap between the nav and the
   * page. `false` is Figma's docked frame: nav at the window edge, page hard
   * against it, no shadow.
   */
  frame?: boolean
  className?: string
}

export function AppShell({
  children,
  mode = 'floating',
  navigation = 'side',
  frame = true,
  className,
  ...props
}: AppShellProps) {
  const ctx = useMemo<AppShellContextValue>(() => ({ mode, frame }), [mode, frame])

  return (
    <div className={cn(appShell({ mode, navigation, frame }), className)} {...props}>
      <AppShellContext.Provider value={ctx}>{children}</AppShellContext.Provider>
    </div>
  )
}

export interface AppShellPageProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'className'
> {
  /** A `TopBar`, then an `AppShell.Content`. Or just the content, under a `TopNav`. */
  children: ReactNode
  className?: string
}

function AppShellPage({ children, className, ...props }: AppShellPageProps) {
  const shell = useContext(AppShellContext)

  return (
    <div
      className={cn(appShellPage({ mode: shell?.mode, frame: shell?.frame }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

AppShellPage.displayName = 'AppShell.Page'

export interface AppShellContentProps extends Omit<
  ComponentPropsWithRef<'main'>,
  'children' | 'className'
> {
  /** The page. Stacked, 16px apart, and scrolling when it runs long. */
  children: ReactNode
  className?: string
}

function AppShellContent({ children, className, ...props }: AppShellContentProps) {
  const shell = useContext(AppShellContext)

  return (
    <main
      className={cn(appShellContent({ mode: shell?.mode, frame: shell?.frame }), className)}
      {...props}
    >
      {children}
    </main>
  )
}

AppShellContent.displayName = 'AppShell.Content'

AppShell.Page = AppShellPage
AppShell.Content = AppShellContent
AppShell.displayName = 'AppShell'
