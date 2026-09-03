# Breadcrumbs

A trail of links to the current page. Mirrors Figma nodes `40004041:11934`
(Breadcrumbs), `40004041:11838` (Breadcrumb Item) and `40004041:11868` (Separator).
Composed API: `<Breadcrumbs>` + `<Breadcrumbs.Item>`, modeled on Meta's Astryx.
`separator`: slash | chevron | arrow | dot — slash is the character, the rest are Lucide glyphs
at 16px. One size only, as in Figma.
**The last child is the current page automatically** (a private context, not a prop), rendering as
plain text with `aria-current="page"`; `isCurrent` overrides it. Renders `<nav aria-label>` → `<ol>`
→ one `<li>` per crumb, with the separator inside the preceding `<li>` so the list count matches
the crumb count.
**Color trap:** breadcrumb links are `content-subtle` + underline-on-hover, *not* the blue
`action-link-foreground`. A trail is navigation chrome.
**Focus:** the shared ring, like everything else. A crumb has no border and no fixed height, so it
was the first component to prove the old `border-2` idiom wrong: anything that changes the box
shoves the whole trail sideways.

## Best practices

Mirrored from the **Best practices** block on `↪ Breadcrumb` (`40004242:14740`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Show the real path to where somebody is, with the page they are on as the last crumb.
- Label each crumb with the same words as the page it leads to.
- Pick one separator and keep it across the product. The four are a choice made once, not per screen.

**Don't**

- Do not use breadcrumbs as the only navigation. They say where you are, not where you can go.
- Do not link the last crumb. It is the page you are already on, and it is marked as the current page.
- Do not color a trail like a link. Breadcrumbs are chrome: subtle text that underlines on hover, never the blue.
