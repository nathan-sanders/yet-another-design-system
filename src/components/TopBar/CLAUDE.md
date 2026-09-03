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

**The search fills the centre and stops at 600px, and only wears a fill when there is a centre to
be in.** A ghost field on a bare bar has no edges, so "centred" is something you take on trust; the
`surface-overlay-subtle` wash — 10% of the neutral, the same token the ghost hover uses — gives it a
boundary you can actually see sitting between the trail and the actions. Without breadcrumbs there is
nothing to be centred between, and the fill would be a box around a search field for its own sake, so
it is left off.

`max-w-150`, not `max-w-[600px]`: Tailwind v4 reads a bare number as that many `--spacing` steps, so
150 × 0.25rem is exactly 600px, and it matches the `max-w-100` and `max-w-200` already in the
library. It also scales with the root font size, which an arbitrary pixel value would not.

**The cap rarely bites, and that is the point.** All three children are `flex-1`, so the two ends stay
equal and the search is centred by symmetry rather than by a rule; it takes its third of whatever is
left. On a 1552px bar that is 504px, and the 600 only applies past roughly 1840. Sizing the ends to
content instead would let the search grow further but would stop it being centred, because the trail
and the actions are not the same width.

**This changed the no-breadcrumbs arrangement too, which Figma does not — and that is deliberate.**
One sizing rule is easier to hold than two, so the search grows there as well: up to 600px at the
left edge, where Figma draws a fixed 259. It was raised as a deviation and **Nathan confirmed the
single rule on 2026-09-01**, so this is a decision rather than drift. Do not "restore" the fixed width
to match the file without asking; the file is the side that is behind.

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
| Search cap | 600px | `max-w-150` → `600px` |
| Search width, 1552px bar | fills its third | 504, and 270 on an 852px bar |
| Search fill, with / without a trail | wash / none | `surface-overlay-subtle` at 10% / transparent |
| Search radius | 8 (`rounded-md`) | 8 |
| `Type=Default` search position | left edge | 12px from the left, i.e. the padding |
| `Type=Breadcrumbs` search | centred | equal either side at both widths |

## Figma defects

**Fixed at source on 2026-09-01:** the redundant `Breadcrumbs` BOOLEAN is gone — the properties are
now just `Action Items` and `Type` — and the old `Breadcumbs` spelling went with it. Deriving the
arrangement from the `breadcrumbs` slot rather than from a prop was right before that and is simply
uncontested now.

**Fixed on 2026-09-01, from this side:** the root of both variants bound `strokeBottomWeight` to
`border-width/border` while its `strokes` array was empty. It painted nothing — the visible rule is
the Divider child — so it cost only confusion, and it was the kind of thing a future reader takes as
evidence the border belongs on the root.

**It was invisible in the Figma UI, which is why it needed a script to find and to remove.** A
stroke-weight binding has nowhere to show itself when there are no stroke paints: the panel renders
the stroke section empty, and the binding sits underneath it. `setBoundVariable('strokeBottomWeight',
null)` on the two variant roots. The unbind was guarded on `strokes.length === 0` so it could only
touch a binding that was genuinely dead — if a paint had appeared in the meantime the binding would
have been doing real work, and the script would have skipped it and said so.

The Divider child is untouched and still draws the rule, so nothing about the component's appearance
changed. The plain `strokeBottomWeight: 1` value remains, which is inert: it is the weight of a
stroke that does not exist.

## Best practices

Mirrored from the **Best practices** block on `↪ Top Bar` (`40004591:41539`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Pair it with a Side Navigation. It is the page header that sits above the content, beside the rail rather than under another bar.
- Pass breadcrumbs when the page sits somewhere in a hierarchy. The trail is also what gives the search a centre to sit in, so the arrangement follows from passing it.
- Keep it to one per page. It is the page's banner, and a page that genuinely needs a second wants each one inside its own labelled section.

**Don't**

- Do not put it under a Top Navigation. Top Navigation already has a utilities slot for the things that would otherwise come here.
- Do not treat it as the navigation. It is a header — the links in it are page chrome, and the rail beside it is what a screen reader should find as the nav.
- Do not put a bordered field in the search slot. Ghost is what the file draws: the default appearance puts a second rectangle inside the one the bar already has.
