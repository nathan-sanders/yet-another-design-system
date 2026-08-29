import type { ComponentPropsWithRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Link } from './Link'
import { Tooltip } from '../Tooltip'

const sizes = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
] as const

const meta = {
  title: 'Components/Link',
  component: Link,
  argTypes: {
    size: { control: 'select', options: sizes },
    external: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Documentation',
    href: '#',
    size: 'base',
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A single link with controls — use the Theme switch in the toolbar for dark
 * mode. `size` is set to `base` here because a link on its own has no sentence
 * to inherit from; clear it and this one falls back to the browser default,
 * which is the behaviour the InlineLink story is built on.
 */
export const Playground: Story = {}

/**
 * All thirteen steps of the type scale. A link can be any of them, which is what
 * makes this a typography component rather than a control — Figma draws one size
 * (`base`, 14/24) because a canvas component has to pick one.
 *
 * The line-height comes with the step: each `text-*` utility sets
 * `--text-*--line-height` too, so a `base` link occupies a 24px line box without
 * anything here saying 24.
 */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Size</span>
          </th>
          <th className="text-left text-sm font-normal text-content-subtle">Link</th>
        </tr>
      </thead>
      <tbody>
        {sizes.map((size) => (
          <tr key={size}>
            <td className="align-middle text-sm text-content-subtle">{size}</td>
            <td>
              <Link href="#" size={size}>
                {size}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * The Figma state table. Hover and focus are real CSS states rather than props,
 * so the middle rows are live: hover to see the color move from blue-700 to
 * blue-800, and tab to see the focus ring — a 2px gap in the canvas color then
 * a 2px ring, both drawn outside the link with `box-shadow`, so the line of text
 * does not shift when it appears.
 *
 * Note the underline is present in every state, hover included. Figma's hover
 * changes color and nothing else.
 *
 * Disabled renders a `<span>`: `<a>` has no disabled attribute, and an anchor
 * left in the tab order that goes nowhere is worse than not being a link at all.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">State</span>
          </th>
          <th className="text-left text-sm font-normal text-content-subtle">Link</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-sm text-content-subtle">Default</td>
          <td>
            <Link href="#" size="base">
              Documentation
            </Link>
          </td>
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Hover</td>
          <td>
            <Link href="#" size="base">
              Hover over me
            </Link>
          </td>
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Focus</td>
          <td>
            <Link href="#" size="base">
              Tab to me
            </Link>
          </td>
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Disabled</td>
          <td>
            <Link href="#" size="base" disabled>
              Unavailable page
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  ),
}

/**
 * `external` is one prop doing four things: the arrow glyph from Figma's
 * External Link property, `target="_blank"`, `noopener noreferrer` merged into
 * any `rel` you pass, and hidden text so a screen reader announces the new tab
 * before following the link. Override that text with `newTabLabel` to localise.
 *
 * The arrow is 12px against `text-base`, as Figma draws it, and steps up with
 * the type scale — the last row is `size="2xl"` with a 20px arrow.
 */
export const ExternalLink: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Link href="https://github.com" size="base" external>
        Github repo
      </Link>
      <Link href="https://developer.mozilla.org" size="base" external>
        MDN Web Docs
      </Link>
      <Link href="https://react.dev" size="base" external>
        React Documentation
      </Link>
      <Link href="https://github.com" size="2xl" external>
        Github repo
      </Link>
    </div>
  ),
}

/**
 * A row of standalone links, each with a tooltip. There is no `tooltip` prop —
 * Avatar settled that for the library, and this is the composition it points at.
 * `Tooltip` hands its child to Base UI's `render`, and Link spreads its props and
 * takes a ref, so the anchor itself becomes the trigger rather than being wrapped
 * in a Base UI button.
 *
 * `Tooltip.Provider` shares the hover delay across the row: once one has opened,
 * its neighbours open immediately, which is what makes the nav read as one
 * surface rather than three separate waits.
 *
 * A tooltip *describes*; it never names. These links are already named by their
 * own text, which is the right way round — see the doc block on why `aria-label`
 * does not belong on a text link.
 */
export const NavRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Tooltip.Provider>
      <nav aria-label="Account" className="flex items-center gap-6">
        <Tooltip label="Configure your account settings">
          <Link href="#" size="base">
            Settings
          </Link>
        </Tooltip>
        <Tooltip label="View and edit your profile">
          <Link href="#" size="base">
            Profile
          </Link>
        </Tooltip>
        <Tooltip label="Get help and support">
          <Link href="#" size="base">
            Help
          </Link>
        </Tooltip>
      </nav>
    </Tooltip.Provider>
  ),
}

/**
 * The reason `size` defaults to nothing. None of these links pass it, so each
 * takes the font-size *and* line-height of the paragraph around it — the same
 * sentence at `text-sm`, `text-base` and `text-lg`, with the link matching its
 * line every time. Pass `size` and it would match exactly one of the three.
 *
 * The last block is the check that matters: an inline link is `inline`, not
 * `inline-flex`, so it breaks across lines like any other run of text. An
 * `inline-flex` link — which is what a Button styled as one would have been —
 * cannot, and would push the line past its container instead.
 */
export const InlineLink: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-xl flex-col gap-6 text-content-primary">
      <p className="text-sm">
        Read the <Link href="#">documentation</Link> for more information about Yet Another Design
        System components.
      </p>
      <p className="text-base">
        Read the <Link href="#">documentation</Link> for more information about Yet Another Design
        System components.
      </p>
      <p className="text-lg">
        Read the <Link href="#">documentation</Link> for more information about Yet Another Design
        System components.
      </p>
      <p className="max-w-[16rem] text-base">
        A link long enough to need two lines wraps like{' '}
        <Link href="#">any other run of text in the paragraph</Link>, and the underline follows it
        around the break.
      </p>
    </div>
  ),
}

/**
 * Router integration. `render` replaces the `<a>` with your own element rather
 * than wrapping it, so there is still exactly one anchor in the DOM and the
 * router keeps its own click handling. It is Base UI's `render` contract — the
 * same prop `Tooltip.Trigger` and `Menu.Trigger` already take — so the library
 * has one polymorphism idiom rather than an `as` prop as well.
 *
 * `RouterLink` below stands in for a Next.js or TanStack Router link: it takes
 * its own `to` prop and renders the anchor.
 */
export const WithRender: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    function RouterLink({ to, ...props }: { to: string } & ComponentPropsWithRef<'a'>) {
      return <a href={to} {...props} />
    }

    return (
      <div className="flex flex-col items-start gap-3">
        <Link size="base" render={<RouterLink to="/about" />}>
          About
        </Link>
        <Link size="base" external render={<RouterLink to="/changelog" />}>
          Changelog
        </Link>
      </div>
    )
  },
}

/**
 * Both jobs on one page: links inside body copy, which inherit the paragraph's
 * type, and a row of standalone links in the footer, which pin theirs. The
 * external one is the only link here that leaves the site, and it says so
 * without the reader having to hover the status bar.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold text-content-primary">Getting started</h1>
      <p className="text-base text-content-primary">
        Install the package and import the components you need. Every value comes from a design
        token, so read the <Link href="#">theming guide</Link> before overriding anything, and check
        the <Link href="#">component reference</Link> for the props each one takes.
      </p>
      <p className="text-base text-content-primary">
        The source, including the token pipeline, lives in the{' '}
        <Link href="https://github.com" external>
          Github repo
        </Link>
        .
      </p>
      <hr className="border-surface-border" />
      <nav aria-label="Footer" className="flex items-center gap-6">
        <Link href="#" size="sm">
          Settings
        </Link>
        <Link href="#" size="sm">
          Profile
        </Link>
        <Link href="#" size="sm">
          Help
        </Link>
      </nav>
    </div>
  ),
}
