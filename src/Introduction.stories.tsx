import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Link } from './components/Link'
import { Mono, Page, Panel, Section, Table, Td, Th } from './foundations/Showcase'
import {
  chromaticRamps,
  navThemes,
  navTokens,
  neutralRamps,
  semanticTokenCount,
  typeScale,
} from './foundations/tokens'
import hero from './yads-hero.png'

/**
 * The front door. Everything else in this Storybook assumes what is on this page.
 *
 * It sits above Foundations in the sidebar (`storySort` in
 * `.storybook/preview.tsx`) because it is the one page that explains what the
 * library is before explaining how any part of it works.
 *
 * The counts are read out of `theme.css` at load time, the same way every
 * Foundations page is, and the component count is a glob over
 * `src/components/*` — so nothing here is a second list to keep up to date.
 */
const meta = {
  title: 'Introduction',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Every folder under `src/components` — a live count rather than a written-down one. */
const componentCount = Object.keys(import.meta.glob('./components/*/index.ts')).length

const FIGMA = 'https://www.figma.com/design/8bRBn0lf6TfPyFWR2XttDP/Yet-Another-Design-System'
const GITHUB = 'https://github.com/nathan-sanders/yet-another-design-system'
const STORYBOOK = 'https://nathan-sanders.github.io/yet-another-design-system/'

/**
 * A code sample.
 *
 * `tabIndex` and the label are the same rule `Showcase.tsx`'s `Table` follows: a
 * block that scrolls sideways is unreachable from a keyboard without them, and
 * axe fails the story on `scrollable-region-focusable`.
 */
function Code({ label, children }: { label: string; children: string }) {
  return (
    <pre
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label={label}
      className="overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary p-4 font-mono text-sm text-content-primary"
    >
      <code>{children}</code>
    </pre>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-bold text-content-emphasized">{value}</span>
      <span className="text-sm text-content-subtle">{label}</span>
    </div>
  )
}

/**
 * A titled block inside a Section — h3, so the heading order never skips a level.
 *
 * The body is a `p` rather than a flex column. `Mono` is an inline `<code>`, and
 * a flex container makes an anonymous item of every text run beside it — so each
 * token name in the copy broke onto a line of its own instead of flowing with
 * the sentence it belongs to.
 */
function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="flex flex-1 flex-col gap-2">
      <h3 className="text-base font-semibold text-content-emphasized">{title}</h3>
      <p className="text-base text-content-subtle">{children}</p>
    </Panel>
  )
}

/**
 * What the library is, where it comes from, and how to use it.
 */
export const Introduction: Story = {
  render: () => (
    <Page
      title="Yet Another Design System"
      lede={
        <>
          A themeable React component library whose entire look is driven by design tokens
          exported from Figma — so the code and the design file stay in sync, and dark mode
          costs nothing to support.
        </>
      }
    >
      <img
        src={hero}
        alt="A collage of the library's components around the YET wordmark: a context menu, success and info banners, a text-formatting toolbar, a card with a slider and a token input, a profile card, and a pair of radio options."
        width={2048}
        height={1152}
        className="w-full rounded-lg border border-surface-border"
      />

      <Section
        title="What it is"
        hint={
          <>
            Roughly {componentCount} components built on{' '}
            <Link href="https://base-ui.com" size="base" external>
              Base UI
            </Link>{' '}
            — headless, accessible primitives — and painted entirely with semantic tokens. React
            19, TypeScript, Vite and Tailwind CSS v4, with the theme living in CSS rather than a{' '}
            <Mono>tailwind.config.js</Mono>.
          </>
        }
      >
        <Panel className="flex flex-wrap gap-x-12 gap-y-6">
          <Stat value={componentCount} label="Components" />
          <Stat value={semanticTokenCount} label="Semantic tokens" />
          <Stat value={neutralRamps.length} label="Neutral ramps" />
          <Stat value={chromaticRamps.length} label="Color ramps" />
          <Stat value={typeScale.length} label="Type steps" />
          <Stat value={navThemes.length} label="Nav themes" />
          <Stat value={2} label="Themes" />
        </Panel>
        <p className="max-w-2xl text-base text-content-subtle">
          It is built by a product designer, in the open, as one long conversation with Claude
          Code. Every session lands on <Mono>main</Mono> through a pull request, so the whole
          history of the system — including the decisions that were reversed — is readable on
          GitHub.
        </p>
      </Section>

      <Section
        title="How it works"
        hint="Four tiers, each written in terms of the one before it. Nothing in the chain is said twice."
      >
        <Code label="The token pipeline">
          {`Figma variables  →  tokens/*.json  →  generate.py  →  src/styles/theme.css  →  components`}
        </Code>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Note title="Primitives">
            The raw palette — <Mono>--color-blue-500</Mono> — plus the static dimensions. Tailwind
            is the source of truth for color here, so every value ships as <Mono>oklch()</Mono>.
          </Note>
          <Note title="The neutral tier">
            Eleven steps, <Mono>--neutral-50</Mono> through <Mono>--neutral-950</Mono>, re-pointed
            by <Mono>[data-neutral]</Mono>. It is the seam that makes the neutral swappable.
          </Note>
          <Note title="Semantics">
            Role-based and theme-aware — <Mono>--surface-canvas</Mono>,{' '}
            <Mono>--content-primary</Mono>. This is the only tier a component is allowed to touch.
          </Note>
          <Note title="The navigation theme">
            The navigation components paint with {navTokens.length} roles of their own —{' '}
            <Mono>--nav-background</Mono> and friends — rather than the semantic tier, so a nav can
            be dark while the page it frames is light.
          </Note>
        </div>
        <p className="max-w-2xl text-base text-content-subtle">
          Foundations → Overview follows one token all the way down the chain, and the pages after
          it document each tier. They are all parsed out of <Mono>theme.css</Mono> at load time, so
          they cannot drift from the system they describe.
        </p>
      </Section>

      <Section
        title="The one rule"
        hint="Style with semantic tokens. Never primitives, never raw color."
      >
        <Code label="Semantic tokens versus primitives">
          {`// yes
<div className="bg-surface-background-primary text-content-primary border-surface-border" />

// no — primitives are for defining semantics, not for using in components
<div className="bg-stone-100 text-stone-800" />`}
        </Code>
        <p className="max-w-2xl text-base text-content-subtle">
          The rule is what makes the switches below total. Because no component reads a primitive,
          the semantic layer is a complete choke point: change what a role points at and everything
          follows, with no per-component work. A single component reaching for{' '}
          <Mono>bg-stone-200</Mono> would be the one thing on the page that does not move.
        </p>
        <p className="max-w-2xl text-base text-content-subtle">
          The navigation tier is the one sanctioned exception, and it is the same rule one tier
          over: the nav components name <Mono>bg-nav-background</Mono> rather than a color, and{' '}
          <Mono>data-nav-theme</Mono> decides what that is worth. They are the only components
          allowed to reach for a <Mono>--nav-*</Mono> role, and they never reach past it either.
        </p>
      </Section>

      <Section
        title="Three switches"
        hint="All three are attributes on the html element, and they are orthogonal — try them from the Theme, Neutral and Nav controls in the toolbar above."
      >
        <Code label="The theme, neutral and nav switches">
          {`<html class="dark">                    <!-- dark mode -->
<html data-neutral="taupe">           <!-- one of ${neutralRamps.length} neutral ramps -->
<html data-nav-theme="blue-inverse">  <!-- one of ${navThemes.length} nav themes -->`}
        </Code>
        <div className="grid gap-4 md:grid-cols-3">
          <Note title="Dark mode is free">
            Color lives in the semantic layer, so a component never needs a <Mono>dark:</Mono>{' '}
            variant. The token swaps itself, and a theme toggle only adds or removes a class.
          </Note>
          <Note title="The neutral is swappable">
            Stone is the default, and there are {neutralRamps.length} to pick from. Picking one
            moves every surface, border, text color, action, input, focus ring, shadow and neutral
            badge at once, in both themes.
          </Note>
          <Note title="The nav has its own theme">
            Its {navThemes.length} modes run from Neutral Inverse to Rose. All but Canvas are
            absolute, so a nav stays put while the page around it switches to dark — a navigation
            surface is a brand decision rather than a reading surface.
          </Note>
        </div>
        <p className="max-w-2xl text-base text-content-subtle">
          Contrast is not automatic, though. The ramps differ slightly in lightness at the same
          step, so a pair that clears 4.5:1 on Stone is not guaranteed to on Olive. Check before
          shipping a non-default ramp. The nav tier is the exception, because it has too many modes
          to check by eye: <Mono>nav-contrast.test.ts</Mono> measures every pair the navigation
          components actually paint, in all {navThemes.length} modes, and a ramp that fails cannot
          ship.
        </p>
      </Section>

      <Section
        title="Using a component"
        hint={
          <>
            Import from the barrel. Icons come from{' '}
            <Link href="https://lucide.dev" size="base" external>
              Lucide
            </Link>{' '}
            directly, and are passed as the component itself — <Mono>startIcon={'{Plus}'}</Mono>,
            not <Mono>{'<Plus />'}</Mono> — so the library controls size and stroke weight rather
            than the call site.
          </>
        }
      >
        <Code label="A button, a field and a banner">
          {`import { Banner, Button, Field, Input } from './src'
import { Plus } from 'lucide-react'

<Button appearance="primary" size="large" startIcon={Plus}>Create</Button>

<Field label="Email" description="We'll only use it to sign you in">
  <Input type="email" placeholder="ada@example.com" />
</Field>

<Banner type="warning" title="Your trial expires in 3 days" onDismiss={dismiss}>
  Upgrade now to keep access to all features.
</Banner>`}
        </Code>
        <p className="max-w-2xl text-base text-content-subtle">
          Two habits worth picking up early. The text around a control belongs to{' '}
          <Mono>Field</Mono>, not to the control — it wires up the label, the description and the
          validation message so they are read out rather than just seen. And the default size is
          the first thing to reach for everywhere; a smaller one wants a measured reason, not an
          assumed tight fit.
        </p>
      </Section>

      <Section title="How this Storybook is organized" hint="Three groups, in the order to read them.">
        <Table label="Sidebar groups">
          <thead>
            <tr>
              <Th className="w-40">Group</Th>
              <Th>What is in it</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>
                <strong className="font-semibold text-content-emphasized">Foundations</strong>
              </Td>
              <Td className="text-content-subtle">
                The token layer itself — color, semantics, type, space, shape, elevation and
                motion. Start at Overview; the rest of the library stops looking like a pile of
                colors once you have read it.
              </Td>
            </tr>
            <tr>
              <Td>
                <strong className="font-semibold text-content-emphasized">Components</strong>
              </Td>
              <Td className="text-content-subtle">
                All {componentCount} of them, every variant, in light and dark — controls, overlays
                and the navigation set that carries its own theme. Each page shows the full state
                matrix rather than a happy path, because each story is also a test.
              </Td>
            </tr>
            <tr>
              <Td>
                <strong className="font-semibold text-content-emphasized">Data Viz</strong>
              </Td>
              <Td className="text-content-subtle">
                Charts, on Recharts, sharing one container, legend, tooltip and categorical
                palette.
              </Td>
            </tr>
          </tbody>
        </Table>
        <p className="max-w-2xl text-base text-content-subtle">
          Every story runs in real Chromium and is checked with axe on every pull request, at the
          <Mono> error</Mono> level — an accessibility violation breaks the build the same way a
          type error does. Alongside it a node-side suite reads the generated stylesheet, so the
          two failures a rendered story cannot show — a utility naming a token that does not exist,
          and a nav mode that does not clear its contrast threshold — fail loudly rather than
          quietly painting nothing.
        </p>
      </Section>

      <Section title="Running it yourself" hint="Clone the repo and install, then pick a surface.">
        <Table label="npm scripts">
          <thead>
            <tr>
              <Th className="w-64">Command</Th>
              <Th>What it does</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>
                <Mono>npm run storybook</Mono>
              </Td>
              <Td className="text-content-subtle">This site — every component, light and dark</Td>
            </tr>
            <tr>
              <Td>
                <Mono>npm run dev</Mono>
              </Td>
              <Td className="text-content-subtle">
                The token playground, showing every token with a dark-mode toggle
              </Td>
            </tr>
            <tr>
              <Td>
                <Mono>npm run build</Mono>
              </Td>
              <Td className="text-content-subtle">
                Type-check and build — the only step that type-checks, so it is the load-bearing
                one
              </Td>
            </tr>
            <tr>
              <Td>
                <Mono>npm test</Mono>
              </Td>
              <Td className="text-content-subtle">
                Every story, in real Chromium, checked with axe — plus the token and nav-contrast
                checks, which need no browser
              </Td>
            </tr>
            <tr>
              <Td>
                <Mono>python3 generate.py</Mono>
              </Td>
              <Td className="text-content-subtle">
                Rebuild <Mono>theme.css</Mono> from <Mono>tokens/*.json</Mono> after a Figma export
              </Td>
            </tr>
          </tbody>
        </Table>
        <p className="max-w-2xl text-base text-content-subtle">
          <Mono>src/styles/theme.css</Mono> is generated — never hand-edit it. When Figma changes,
          re-export the JSON into <Mono>tokens/</Mono> and run the generator.
        </p>
      </Section>

      <Section title="Where it lives" hint="The design file, the code, and this Storybook.">
        <Panel className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Link href={FIGMA} size="base" external>
              The Figma file
            </Link>
            <span className="text-base text-content-subtle">
              The source of truth. Variables here become <Mono>tokens/*.json</Mono>, and every
              component page names the node it was built from.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Link href={GITHUB} size="base" external>
              The GitHub repository
            </Link>
            <span className="text-base text-content-subtle">
              The code, the generator, and a pull request for every session. MIT licensed.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Link href={STORYBOOK} size="base" external>
              This Storybook, published
            </Link>
            <span className="text-base text-content-subtle">
              Deployed to GitHub Pages on every push to <Mono>main</Mono>.
            </span>
          </div>
        </Panel>
      </Section>
    </Page>
  ),
}
