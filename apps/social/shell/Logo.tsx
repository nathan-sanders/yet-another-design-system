import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { home } from './routes'

/**
 * The YET wordmark — the same mark the nav stories draw (`Nav/story-logo.tsx`),
 * copied rather than imported because that file is a story fixture, not part of
 * the library. `currentColor`, so it follows `Nav Content/Primary`.
 */
export function Logo() {
  return (
    <svg width="36" height="16" viewBox="0 0 36 16" fill="none" aria-hidden>
      <path
        d="M5.27579 8.52005H7.03438V0H12.3102V12.4444C12.3102 14.4081 10.7355 16 8.79298 16H0V12.7653H7.03438V10.9875H3.51719C1.5747 10.9875 2.83256e-08 9.39567 0 7.43199V0H5.27579V8.52005Z"
        fill="currentColor"
      />
      <path
        d="M36 3.55556H33.3621V16H28.0863V3.55556H13.9356V8.10425e-06H36V3.55556Z"
        fill="currentColor"
      />
      <path
        d="M20.97 8.52005H19.2114V5.3112H13.9356V12.4444C13.9356 14.4081 15.5103 16 17.4528 16H26.2458V12.7653H19.2114V10.9875H22.7286C24.6711 10.9875 26.2458 9.39567 26.2458 7.43199V5.3112H20.97V8.52005Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * The wordmark as the way home, for the rail and the phone bar: both put the
 * logo in a 40px box, and this fills it. The nav items' hover (their two
 * `Nav Item/… Hover` tokens and `rounded-lg`) and their ring, so it behaves
 * like the collapse toggle beside it. NavItem cannot take it, because its
 * icon slot takes a Lucide icon only.
 */
export function HomeLogo() {
  return (
    <a
      href={`#${home.path}`}
      aria-label="Yet Social home"
      className={cn(
        'flex size-10 items-center justify-center rounded-lg text-nav-content-primary',
        'transition-colors duration-fast-min ease-standard',
        'hover:bg-nav-item-background-hover hover:inset-ring-1 hover:inset-ring-nav-item-border-hover',
        focusRing,
      )}
    >
      <Logo />
    </a>
  )
}
