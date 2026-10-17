import { Badge } from '../../src/components/Badge'
import { Card } from '../../src/components/Card'
import { Link } from '../../src/components/Link'
import { ThemeControl } from '../../src/components/ThemeControl'
import { Heading, Text } from '../../src/components/Text'
import { useDocumentTheme } from '../shared/theme'
import { apps } from './apps'

const STORYBOOK = 'https://nathan-sanders.github.io/yet-another-design-system/'

/**
 * The front door: what the apps are for, and a card per app. Plain links rather
 * than a router — each app is its own page with its own router inside it.
 */
export function Showcase() {
  const [theme, setTheme] = useDocumentTheme()

  return (
    <div className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 md:px-8 md:py-20">
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

        <section aria-labelledby="apps-heading" className="flex flex-col gap-4">
          <Heading level={2} size="xl" weight="semibold" id="apps-heading">
            Apps
          </Heading>
          <ul className="grid gap-5">
            {apps.map((app) => (
              <li key={app.slug}>
                <Card padding={4} className="grid gap-5 md:grid-cols-[3fr_2fr]">
                  {app.image ? (
                    <a
                      href={`./${app.slug}/`}
                      className="block overflow-hidden rounded-md border border-surface-border"
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
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Heading level={3} size="2xl" weight="bold">
                        {app.name}
                      </Heading>
                      <Text color="subtle">{app.pitch}</Text>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Text size="sm" weight="semibold">
                        Built so far
                      </Text>
                      <ul className="list-disc pl-5">
                        {app.built.map((item) => (
                          <li key={item}>
                            <Text render={<span />}>{item}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Text size="sm" weight="semibold">
                        Leans on
                      </Text>
                      <ul className="flex flex-wrap gap-1">
                        {app.components.map((name) => (
                          <li key={name}>
                            <Badge>{name}</Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-4">
                      <Link href={`./${app.slug}/`}>Open {app.name}</Link>
                      <Link href={app.figma} external>
                        Designs in Figma
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
