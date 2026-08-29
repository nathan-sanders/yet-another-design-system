# Breadcrumbs

A trail of links to the current page. Mirrors Figma nodes `40004041:11934`
(Breadcrumbs), `40004041:11838` (Breadcrumb Item) and `40004041:11868` (Separator).
Composed API: `<Breadcrumbs>` + `<Breadcrumbs.Item>`, modelled on Meta's Astryx.
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
