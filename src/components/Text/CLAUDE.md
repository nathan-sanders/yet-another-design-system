# Text and Heading

Two components over one recipe, `styles.ts`'s `typography`: `size` × `weight` × `color`, plus
`mono`, `italic` and `truncate`. **Text** is body copy, a `<p>` unless `render` says otherwise.
**Heading** is `<h1>`–`<h6>`, its element chosen by `level`.

## Why they exist

Asked for directly, off the roadmap, after a review of the library turned up the evidence the
roadmap bar asks for: the type was being reinvented everywhere it appeared. **151 hand-styled `<p>`
and `<h*>` elements** across components and stories, with the same pairs over and over —
`text-content-subtle` 23 times, `font-semibold` 18, `text-sm text-content-subtle` 14,
`text-2xl font-semibold` 11, `text-lg font-semibold text-content-emphasized` 9. Those call sites
were **not migrated** in the same change; that is a sweep of its own, and doing it alongside the
build would have hidden the component inside a diff of 151 edits.

The second reason is the one nothing else catches. **`font-medium` is not a weight here** — the
theme defines `normal`, `semibold` and `bold` only — so the class compiles to a variable that does
not exist and renders at 400, which looks like a choice. A component that offers three weights
cannot say a fourth.

## The Figma side is the text styles, not a component

There is no `Text` component in the file and none is owed. A canvas already has text: a TEXT node
with a text style applied is the whole of what this component is, and the file has the styles —
`text-xs` to `text-6xl`, each as `normal`, `semibold`, `bold`, three italics, `underlined`, and
`mono regular` / `mono bold`, read with `getLocalTextStylesAsync` on 2026-10-15. A component wrapping
one TEXT node would be a second way to apply a style the panel already applies.

So the API is spelled to match the style names rather than the other way round: **`size` and
`weight` are the two halves of the name.** `text-sm/semibold` is `size="sm" weight="semibold"`.
That is Card's rule — when the shared vocabulary already exists, let the prop say it — applied to
type. The px and line heights in `Text.stories.tsx`'s `FIGMA` table are copied from that read, and
the `Scale` story asserts every one.

What does not map, on purpose:

- **`underlined`** has no prop. Underlined text in this system is a link, and `Link` owns that
  underline — its offset and thickness are Inter's own metrics, see its record.
- **Mono has two Figma weights** (regular, bold) and Text allows `semibold` with `mono` anyway.
  Geist Mono is a variable font with the weight, so it renders; it just has no named style in the
  file. Not enforced in the type; if the file ever gains a `mono semibold`, nothing here changes.
- **Heading's level** has no counterpart in a text style. A canvas has no outline, so the file
  cannot say a heading is an `<h2>`, and the size is the only half it can draw.

## No Best practices block in Figma

Like ThemeControl and BentoGrid, the rules below were written here, not mirrored — there is no
`↪ Text` page to carry them. Owed if one is ever drawn.

## Decisions

- **`color` defaults differ by component.** Text is `primary`, Figma's body color; Heading is
  `emphasized`, which is what the hand-written headings had already converged on. Both take
  `inherit`, which adds no color class at all, for text on a surface that has picked its own —
  a Banner, a Badge, an inverse fill.
- **`color` is `Omit`ted from the DOM props.** `<p color>` is a dead HTML attribute, but it is in
  React's types and would collide — the fourth prop on the DOM-attribute list after `style`,
  `title` and `slot`.
- **Text takes `render`; Heading does not.** Base UI's `render` (through `useRender`) is the
  library's spelling for "same component, different element", and Text needs it constantly — a
  `<span>` in a sentence, a `<dt>`, a `<label>`. A Heading's element *is* its level, so
  `render={<div />}` would be a heading that is not one. `createElement` with `h${level}` instead.
- **`level` is required.** No rank is a safe default; only the caller knows what is above it.
- **`size` defaults by level, tuned for a 14px body**: 1 → `2xl` (24), 2 → `xl` (18), 3 → `lg`
  (16), 4 and 5 → `base` (14), 6 → `sm` (12). Tailwind's document scale would put a page title at
  36; at this body size that reads as a landing page. By level 4 a heading is body-size semibold,
  which is how Dialog, Popover and Panel already title themselves.
- **`truncate`**: `true` is Tailwind's `truncate` (one line); a number above 1 is
  `line-clamp-(--lines)` with the count in a `--lines` custom property, so one class covers every
  count and a caller's class can still replace it (the var-utility rule, not an inline
  `-webkit-line-clamp`). The full text stays in the DOM. Heading takes only the boolean.
- **The line height comes with the size.** `text-base` sets `--text-base--line-height` too, so no
  call site picks the pair. That is the main thing the hand-written versions got right by accident.

## Best practices

**Do**

- Reach for `Text` and `Heading` instead of a `<p>` or `<h2>` with type classes on it.
- Choose a heading's `level` from the page outline, then its `size` from the design. They are
  separate on purpose.
- Use `color="subtle"` for supporting text — captions, metadata, a line under a title.
- Use `color="inherit"` on anything that already set its own color.
- Use `mono` for what a person could type or copy: an id, a key, a path.

**Don't**

- Do not skip heading levels to get a size. Use `size`.
- Do not reach for `font-medium` in a `className`. There is no medium weight; it renders at 400.
- Do not truncate text a reader needs and give them no way to see the rest.
- Do not underline text that is not a link. Use `Link`.
