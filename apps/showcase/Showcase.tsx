import { ArrowRight } from 'lucide-react'

import { Icon } from '../../src/components/Icon'
import { Link } from '../../src/components/Link'
import { ThemeControl } from '../../src/components/ThemeControl'
import { Heading, Text } from '../../src/components/Text'
import { cn } from '../../src/lib/cn'
import { focusRing } from '../../src/lib/focus'
import { useDocumentTheme } from '../shared/theme'
import { apps } from './apps'

const STORYBOOK = 'https://nathan-sanders.github.io/yet-another-design-system/'

/**
 * The front door: what the apps are for, and a row per app — the screenshot on
 * the left, and on the right the app's name, a line about it and a way in.
 * Plain links rather than a router — each app is its own page with its own
 * router inside it.
 */
export function Showcase() {
  const [theme, setTheme] = useDocumentTheme()

  return (
    <div className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 md:px-8 md:py-20">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Text size="sm" weight="semibold" color="subtle">
              Yet Another Design System
            </Text>
            <ThemeControl theme={theme} onThemeChange={setTheme} />
          </div>
          <Heading level={1} size="4xl" weight="bold">
            Apps built on YADS
          </Heading>
          <Text size="lg" color="subtle" className="max-w-2xl">
            Real, clickable products composed only from the library's components and tokens. Each
            one shows what the system can do, and building it is how the system gets tested.
          </Text>
          <div className="flex flex-wrap gap-4">
            <Link href={STORYBOOK}>Browse the component library</Link>
          </div>
        </header>

        <section aria-labelledby="apps-heading" className="flex flex-col gap-8">
          <Heading level={2} size="xl" weight="semibold" id="apps-heading">
            Apps
          </Heading>
          <ul className="flex flex-col gap-16">
            {apps.map((app) => (
              <li
                key={app.slug}
                className="grid items-center gap-8 md:grid-cols-[3fr_2fr] md:gap-12"
              >
                {app.image ? (
                  <a
                    href={`./${app.slug}/`}
                    className="block overflow-hidden rounded-xl border border-surface-border"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <img
                      src={new URL(`./${app.image}`, import.meta.url).href}
                      alt=""
                      className="block w-full"
                    />
                  </a>
                ) : null}
                <div className="flex flex-col items-start gap-8">
                  <dl className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <Text render={<dt />} mono color="subtle">
                        App
                      </Text>
                      <dd>
                        <Heading level={3} size="2xl" weight="normal">
                          {app.name}
                        </Heading>
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Text render={<dt />} mono color="subtle">
                        Description
                      </Text>
                      <Text render={<dd />} size="xl">
                        {app.description}
                      </Text>
                    </div>
                  </dl>
                  {/* Button-shaped by hand: `Button` is always a <button> and
                      never navigates, so a call to action that opens a page has
                      no library look yet (Yet Social FINDINGS 7). These are the
                      secondary Button's tokens at its `large` size. */}
                  <a
                    href={`./${app.slug}/`}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-base font-semibold',
                      'border-action-secondary-border bg-action-secondary-background text-action-secondary-foreground',
                      'transition-colors hover:border-action-secondary-border-hover hover:bg-action-secondary-background-hover',
                      focusRing,
                    )}
                  >
                    View {app.name}
                    <Icon icon={ArrowRight} size="base" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
