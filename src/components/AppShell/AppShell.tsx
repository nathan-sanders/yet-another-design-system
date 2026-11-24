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
 *     <AppShell>
 *       <SideNav aria-label="Main">…</SideNav>
 *       <AppShell.Page>
 *         <TopBar start={…} end={…} />
 *         <AppShell.Content>…</AppShell.Content>
 *       </AppShell.Page>
 *     </AppShell>
 *
 * **Two modes, and they are about the page, not the nav.** `contained`, the
 * default, is Example 2 (`40005257:47448`) and how Yet Social is drawn: the page
 * is a `Surface/Background Primary` panel inside a `Surface/Border`, the content
 * sits in it with 16px of room, and the nav is flush with the canvas. `floating`
 * is Example 1 (`40005257:45475`): the page paints nothing, the blocks sit
 * straight on the canvas, and the nav floats above it on its shadow. The second
 * works on any nav theme and is drawn on `neutral-inverse`; the first is drawn on
 * `canvas`, which paints the rail in the page's own background so the panel is
 * the only surface on screen. `canvas` is the default, so there is nothing to
 * write for it. The shell cannot set any other — the navigation tier is switched
 * on `<html>`, on purpose — so a `floating` application writes
 * `data-nav-theme="neutral-inverse"` itself.
 *
 * **The nav's `floating` default comes from here.** A shadow under a rail that is
 * meant to sit flush is the mistake `contained` invites, and a caller who has
 * picked a mode should not have to say it a second time on the `SideNav`. So the
 * shell publishes its mode through context and both bars read it for their default: floating in `floating`, flush in `contained`, flush
 * whenever the frame is off. An explicit `floating` on the bar still wins. A rail
 * or a top bar outside a shell is flush too; only a `MobileNav`, which pins
 * itself over the page there, is lifted on its own.
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
   * How the page is drawn. `contained` puts the blocks inside a bordered surface
   * with the nav flush; `floating` puts them on the canvas with the nav lifted
   * above it. Figma's Example 2 and Example 1.
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
  mode = 'contained',
  navigation = 'side',
  frame = true,
  className,
  ...props
}: AppShellProps) {
  const ctx = useMemo<AppShellContextValue>(
    () => ({ mode, frame, navigation }),
    [mode, frame, navigation],
  )

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
