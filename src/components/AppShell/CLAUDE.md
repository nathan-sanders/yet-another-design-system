# AppShell

The frame an application sits in: a nav, and the page beside or below it. The canvas, the 8px, the
panel the page may or may not paint, and the `<main>` that scrolls. Nothing else — the nav is the
Nav family's, the bar is `TopBar`'s, and what goes in the content is the caller's.

Built on 2026-09-17 because it had been reinvented four times: `TopBar.stories.tsx` (`WithSideNav`),
`SideNav.stories.tsx` (`InContext`, `Docked`) and `TopNav.stories.tsx` (`InContext`) each hand-rolled
`flex h-… gap-2 p-2` around a nav and a bordered `div` holding a `TopBar` and a `<main>`. The Nav
record says the nav must not own that frame ("a nav does not know what is beside it"), so nothing
did. Card's bar for a build — the file draws it *and* something has been reinvented in its absence —
was met on both halves.

## Figma

Page `↪ App Shell` (`40004484:26623`). Code went first against four frames and two worked examples;
the file caught up the same day (2026-09-17) with a component set and a Docs frame, so the debt
BentoGrid still carries is closed here.

| Thing | Node | Became |
|---|---|---|
| App Shell (`Mode` × `Navigation` × `Frame`, 8 variants) | `40005265:10346` | `AppShell` — defaults Floating / Side / True, the code's |
| Docs frame (header, Light + Dark preview, 4 Do / 3 Don't) | `40005266:487` | this record's Best practices |

**The set was drawn *from* the code, the Sankey direction.** Each variant is one of the four frames
cloned, with the page surface, the content padding and the nav's `Floating` set per the recipes in
`styles.ts`; the Top variants gained a `Page` wrapper so all eight share one layer structure. Two
things the canvas cannot say and the code does: `Content Slot` is a plain FRAME, not a SLOT, because
the Plugin API cannot create one — convert it by hand in the UI if a slot is wanted; and the
contained Page's stroke is `INSIDE` with `strokesIncludedInLayout` on, which is CSS's border-box
(the content sits 1px in). The Docs preview's `Contained` instances carry an explicit `Navigation
Theme = Canvas` mode, which is the pairing the mode is drawn for.

The four source frames stayed on the page as they were.

| Frame | Node | Became |
|---|---|---|
| Side Navigation, framed | `40004484:26624` | `navigation="side"`, `frame` — canvas, `spacing/2` padding and gap, rail floating, Page = Top Bar + Content Slot |
| Side Navigation, docked | `40004484:26870` | `frame={false}` — rail at x=0, no padding, no gap, no shadow |
| Top Navigation, framed | `40004484:26784` | `navigation="top"` — a column, bar floating, Content Slot below |
| Top Navigation, docked | `40004484:26872` | `navigation="top" frame={false}` — bar at x=0 full width, content straight under it at y=56 |
| Example 1 | `40005257:45475` | `mode="floating"` — Page paints nothing; content `px-0 py-4` |
| Example 2 | `40005257:47448` | `mode="contained"` — Page is `Surface/Background Primary` in `Surface/Border` at `rounded-lg`; content `p-4`; rail on the `canvas` nav theme, no shadow |

## Decisions

**Two modes, and they are about the page.** `floating` is Example 1: the blocks sit straight on the
canvas, the TopBar's own `border-b` is the only chrome, and the nav floats above the page on its
shadow. `contained` is Example 2: the page is a `surface-background-primary` panel inside a
`surface-border` at `rounded-lg`, the content sits in it with 16px of room, and the nav is flush with
the canvas. Nathan's framing: the first "works good with the navigation floating and any theme", the
second "works best with the navigation using the canvas theme not floating". Floating is the default,
first as everywhere, and because it is the one that works with any nav theme.

**The shell cannot set the nav theme, and should not.** Every `Navigation Theme` mode is a
`:root[data-nav-theme=…]` block, switched on `<html>` on purpose (the tier is absolute; see the root
record). So `contained` *recommends* `canvas` rather than applying it, and the `Contained` story sets
the toolbar global for itself. An application writes the attribute once, where it writes `.dark`.

**The nav's `floating` default comes from the shell.** Confirmed with Nathan before building. A
shadow under a rail that is meant to sit flush is the mistake `contained` invites, and a caller who
has already written `mode="contained"` should not have to write `floating={false}` as well — that is
the same fact twice, and MobileNav's record already explains why a duplicated fact is a bug waiting
to happen. So `AppShell` publishes `{ mode, frame }` through `AppShellContext` (in `context.ts`, not
barrel-exported) and `SideNav` / `TopNav` read it:
`floating = floatingProp ?? (shell ? shell.mode === 'floating' && shell.frame : true)`. An explicit
prop wins — the `Contained, rail overridden` story asserts it — and a bar outside a shell is exactly
as it was. This is the exception the root record draws for Avatar's `surface`: derive what the
element itself knows, declare what only its **ancestors** know; here the ancestor is the shell, and
context is the ancestor declaring it so the caller does not have to.

**`frame` is the 8px.** Figma draws each layout twice, once inside `spacing/2` and once docked to
the window edge with neither. The docked pair is `frame={false}`, and the nav's shadow goes with it
because there is nothing for it to float above. In the file both docked frames are drawn floating-
mode only; `contained` with `frame={false}` keeps the panel's border and radius and simply has no gap
to the rail. Not drawn, not forbidden.

**Docked, the nav squares its corners and the content takes 16px at the sides.** Both Nathan's calls
on the first `Docked` story (2026-09-17). The corners: a `rounded-lg` bar hard against the viewport
shows a sliver of canvas behind each corner, which a bar inside an 8px frame never does — so this is
*not* the Nav record's `floating: false`, which keeps its radius on purpose, but a second axis,
`navSurface({ docked })`, set only through `AppShellContext` (`!frame`). A bar on its own is never
docked to anything. The padding: with no frame to hold the blocks off the window edge, `Content`
does it — `px-4`, the same `spacing/4` the contained page uses, with the `-mx-1 px-1` clip trick
dropped because 16px is room enough for a ring.

**The page title row is inset 16 in floating mode, and the grid under it is not.** Read off Example 1
by measurement: the title at x=16 of the Content Slot, the grid at x=0. The reason is alignment — a
`ContentBlock` header is `px-4`, so a title inset 16 lines up with the block titles inside the grid,
while the blocks themselves line up with the TopBar's edges. Measured in the `Floating` story: `h1`
at 256 against a grid at 240 and a block title at 257 (one border in); the actions' last button ends
16px inside the grid's right edge. Where the content already carries 16 (`contained`, or docked) the
row is flush with it. This lives in the story's `PageTitle` fixture, which reads the context, not in
the shell — a page title is the application's, and the file draws it as an example, not a component.

**`navigation` is declared, not derived.** The shell could look at its first child's `type`, but that
breaks the moment an application wraps its nav in a component of its own, and a layout that flips
because of a refactor is worse than a prop. Confirmed with Nathan. `side` is a row, `top` is a column.

**`Content` is a `<main>`, and it is the one scrolling region.** With the rail's `<nav>` and the
TopBar's `<header>` a screen reader gets three named regions and a skip target. The frame is `h-dvh`
— the shell *is* the viewport — the rail is `h-full`, and the page moves under the bar, which is
what an app shell is for. Measured in `TopNavigation`: `main.scrollTop` 148 of a 1020 `scrollHeight`
in an 872 `clientHeight`, `document.scrollTop` 0, nav at rest.

**Content padding differs by mode, and Figma's examples say so where its templates do not.** The
framed template frame's Content Slot is `p-4`; Example 1's is `px-0 py-4` (Page Title at x=0, full
width) and Example 2's is `p-4` (Page Title at x=16). The examples are the design — in `floating` the
blocks line up with the TopBar's edges; in `contained` they sit inside the surface — so the code
follows them. Worth knowing before "fixing" the floating padding to 16.

**The floating content carries `-mx-1 px-1`, which is SideNav's clip trick.** `overflow-y-auto`
establishes a clip box, the focus ring paints 4px outside a block, and a block flush with the edge
would lose the outer half of its ring. The padding pushes the clip box out by exactly that and the
margin takes it back. `contained` needs none of it: `p-4` is room enough. **Figma's `overflow-clip`
is not ported on the frame** — the thirteenth time — but the contained Page *is* `overflow-clip`, for
a different reason: the square-cornered `<main>` inside would otherwise paint through the panel's
rounded corners. No clip margin is needed there because the TopBar is `p-3` and Content `p-4`, so
every ring inside has at least 12px before it reaches that edge.

**Heading order is the caller's to keep.** The dashboard story's `ContentBlock`s are
`headingLevel={2}` under an `<h1>`; the default `3` fails axe's `heading-order` the moment there is
an `h1` on the page and nothing between. Not a shell concern, but the first thing the story hit.

**Not a Base UI component.** A layout frame has no headless primitive; three `div`s and a `main`,
like BentoGrid. The Base UI count stands.

## Measured

Against the Figma frames, in the story `play` functions (Chromium, `npm test`):

| | Figma | Measured |
|---|---|---|
| Frame padding / gap (`frame`) | 8 / 8 | 8px / 8px |
| Frame padding / gap (`frame={false}`) | 0 / 0 | 0px / `normal` |
| Docked: rail radius / content side padding | — | 0px / 16px, margin 0 |
| Floating: title row inset / grid | 16 / 0 | 16px / 0px — `h1` at grid + 16, on the block titles |
| Row / column by `navigation` | side / top | `row` / `column` |
| Floating: page border, fill | none | 0px, `rgba(0,0,0,0)` |
| Floating: content padding | 0 · 16 | left 4px with `margin-left: -4px` · top 16px |
| Floating: rail shadow | Low | `shadow-low` present |
| Contained: page border / radius / fill | 1 / 12 / Background Primary | 1px / 12px / non-transparent |
| Contained: content padding | 16 | 16px all round, margin 0 |
| Contained: rail shadow | none | `none` |
| Contained + `<SideNav floating>` | — | shadow present (prop wins) |
| Collapsed rail width | 56 | 56 |

An unset `gap` computes to `normal`, not `0px` — the `Docked` assertion accepts either.

## Left out

- **No `MobileNav` / `ResponsiveNav` handling.** `MobileNav` positions itself (`fixed`) and is the one
  nav that does not sit in a frame; `ResponsiveNav` works in `navigation="top"` above 768 and pins
  its bar below it, but the shell does not yet pad the content for a fixed bar. A follow-up, once a
  phone frame is drawn on the App Shell page.
- **No `TopBar` inside `navigation="top"`.** Nav's own rule: two full-width strips do not stack.
- The three hand-rolled frames in the Nav and TopBar stories were left as they are. They are
  evidence of the reinvention, and rewriting them would turn a component PR into a story PR.

## Best practices

Mirrored to the **Best practices** block on `↪ App Shell` (`40005266:487`) on 2026-09-17, written
here first and pushed to the canvas the same day — the Carousel direction. The two are one text in
two places.

**Do**

- Pick the mode for the page, not the nav. `floating` puts the blocks on the canvas and works with
  every nav theme; `contained` puts them in a panel and reads best with the `canvas` nav theme, so
  the panel is the only surface on screen.
- Let the shell decide whether the nav floats. Write `mode` once; the rail and the bar take their
  shadow from it. Reach for `floating` on the nav only to disagree on purpose.
- Put a `TopBar` beside a `SideNav` and the actions in a `TopNav`'s `utilities`. The shell does not
  stop you stacking a bar under a bar; Nav's rule does.
- Keep one `<h1>` in `AppShell.Content` and start blocks at `headingLevel={2}`.

**Don't**

- Do not give `AppShell.Content` a height or make something inside it scroll. It is the shell's one
  scrolling region, and a second one nests scrollbars.
- Do not put a `MobileNav` in the frame. It pins itself to the viewport and needs no shell around it.
- Do not paint a surface on `AppShell.Page` in `floating`. If the page wants a panel, that is
  `contained`.
