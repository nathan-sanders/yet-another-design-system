# TopBar

The page header that sits above the content, beside a `SideNav`.

## Figma

| Thing | Node |
|---|---|
| Top Bar (`Type` = Default \| Breadcrumbs) | `40004511:34845` |

## Decisions

**It belongs with `SideNav`, not with `TopNav`.** Nathan's rule, and the layout agrees: this and
`TopNav` are both full-width strips at the top of the page, and stacking them buys a second row of
chrome and no information. `TopNav` already has a `utilities` slot for the things that would
otherwise come here. Nothing in the code enforces it — a `<header>` above a `<nav>` is legal, and
occasionally what you want — but the doc block says so at the top, because the pairing is the kind
of thing that is obvious while drawing it and invisible six months later.

**Different tier from the navigation components.** `SideNav` and `TopNav` paint from `--nav-*`,
which does not follow `.dark` on six of its seven modes. This one is ordinary semantic tokens: it is
part of the page rather than part of the navigation surface, so it follows the theme like everything
else and the Storybook **Nav** toolbar does nothing to it. The `WithSideNav` story exists mostly to
show those two tiers side by side and independent.

**`Type` is not a prop, because `breadcrumbs` already says it.** Figma models the two arrangements
as a variant *and* carries a redundant `Breadcrumbs` boolean beside it. Here the presence of the slot
is the switch — the library's rule about deriving a variant from a value that already says it — and
it collapses two Figma properties into one.

**The right-hand actions container renders even when empty.** It is one of the two `flex-1` ends
whose equality centres the search when breadcrumbs are present, which is Figma's FILL / FIXED / FILL.
Dropping it when there are no actions would quietly slide the search left and change the layout.
Same arrangement `TopNav` uses.

**The bottom rule is `border-b`, not a `Divider`.** Figma draws it as a Divider instance spanning
the full width, and the root *additionally* carries a `strokeBottomWeight` binding with no stroke
paint behind it — a dead binding, and evidence a border is what was meant. A real `Divider` renders
`role="separator"`, which under a toolbar announces chrome as structure; `Tabs` and `Accordion` both
made this call already.

**Unlike `NavItem`, this border is a real CSS border.** That looks inconsistent next to the
`inset-ring` two components over, and it is not: `NavItem`'s stroke is `align: INSIDE`, which adds
nothing to the Figma frame, so a border there measured 2px too tall. Here the Divider is a *separate
child at y=56*, outside the 56px frame — so the rule genuinely is a 57th row and `border-b` adding
1px is the faithful translation. Measured 57 with the rule, 56 without. Read `strokeAlign` before
assuming which case you are in.

**A `<header>`, so it is the page's banner landmark.** With `SideNav`'s `<nav>` beside it a screen
reader gets two named regions and a sensible skip target.

**That has a real constraint, and axe found it.** A document gets exactly one banner, so the `Slots`
story — four bars on one page — failed `landmark-no-duplicate-banner` the first time it ran. Nesting
each one in a labelled `<section>` takes the banner role away and leaves an ordinary header, which is
both the fix for the story and the escape hatch for a page that genuinely needs two of these. The
same story also had to give its two trails distinct names: two `<nav>`s both called "Breadcrumb" are
one landmark twice over as far as `landmark-unique` is concerned.

**The search is `appearance="ghost"`, in the stories at least.** Figma instantiates
`Input Group / Appearance=Ghost`, which draws no border until focus — the bar reads as a magnifier
and a placeholder rather than a boxed field, and the default appearance puts a second rectangle
inside the one the bar already has. The slot takes whatever you give it; the stories give it what the
file draws.

**16rem for the search, where Figma says 259px.** That is 3px off `width/w-64` and reads as
hand-sizing rather than a decision, so it went to the token.

## Measured

At the default theme, against the Figma frames:

| | Figma | Measured |
|---|---|---|
| Height / padding / gap | 56 / 12 / 8 | 56 min (57 with the rule) / 12 / 8 |
| Bottom rule | 1px `Surface/Border` | 1px solid, `Surface/Border` |
| Background | none | transparent |
| Search width | 259 (→ `w-64`) | 256 |
| `Type=Default` search position | left edge | 12px from the left, i.e. the padding |
| `Type=Breadcrumbs` search | centred by equal FILL ends | 468 either side |

## Figma defects

**Fixed at source on 2026-09-01:** the redundant `Breadcrumbs` BOOLEAN is gone — the properties are
now just `Action Items` and `Type` — and the old `Breadcumbs` spelling went with it. Deriving the
arrangement from the `breadcrumbs` slot rather than from a prop was right before that and is simply
uncontested now.

**Still open:** the root of *both* variants binds `strokeBottomWeight` to `border-width/border` while
its `strokes` array is empty. It paints nothing — the visible rule is the Divider child — so it costs
only confusion, and it is the kind of thing a future reader takes as evidence the border belongs on
the root. Checked again after the other two were fixed rather than assumed to have gone with them.
