# Code

A short technical reference inside running text: a function, a prop, a path, a flag.

**Two sources, split cleanly.** The Figma page `↪ Code` (`40006563:157817`), set `Code`
(`40006576:366`), owns the look: six variants, `Color` (Primary | Secondary) × `Size` (Small |
Base | Large), a `Code Text` property. Meta's Astryx `Code` owns the API: children, `color`,
`size`. Nathan asked for both. Built alongside `CodeBlock`, which owns the multi-line case.

**What each variant binds**, read from the nodes rather than the screenshot:

| | Figma | Code |
|---|---|---|
| fill | `Surface/Overlay Subtle` | `bg-surface-overlay-subtle` |
| radius | `border-radius/rounded-xs` (a step, not a role) | `rounded-xs` |
| padding | `spacing/1` left and right, `spacing/0` top and bottom | `px-1 py-0` |
| text | `text-sm/mono regular`, `text-base/mono regular`, `text-lg/mono regular` | `font-mono font-normal` + `text-sm` / `text-base` / `text-lg` |
| color | Primary `Content/Primary`, Secondary `Content/Subtle` | `text-content-primary` / `text-content-subtle` |

So the box is 20 / 24 / 28px tall — the line height of each step and nothing else.

**`size` is the type step, spelled `sm | base | lg`, defaulting to `sm`** like the file. The
words are the Text component's and Link's, because the value *is* a type step: a prop that says
the token rather than a second set of size words. And it runs **one step below the prose** —
Figma's own description pairs Small with `text-sm` and `text-base` copy, Base with `text-lg`, Large
with `text-xl`, because Geist Mono reads larger than Inter at the same size. That is also why there
is no `inherit` the way Link has: a code run at the paragraph's own size looks a size too big.
Astryx has `size="inherit"`; it was left out for that reason.

**`color` is `primary | secondary`.** Figma's two. Astryx's third, `inherit`, has no variant in the
file and is left out with it.

**It is `inline-block`, not `inline`, and that was measured.** Astryx's `Code` is `inline` with
`padding: 0 4px`, so its fill paints over the font's content area: 17px on a 20px line. Figma draws
the full line. `inline-block` is what gives the file's 20 / 24 / 28 box, and the story asserts all
six. The cost is that it cannot flow across a line break the way Link's `inline` can — acceptable
because the file's guidance is that Code never runs past one line; that is what CodeBlock is for.
`max-w-full break-words` is the floor for the case that ignores the guidance: a path too long for
its column breaks inside its own box (the `InContext` story holds it to a 240px column).

**The fill is translucent for Kbd's reason.** `Surface/Overlay Subtle` is 10% of the neutral over
whatever is behind, so it reads on the canvas, on a card and on a highlighted row.

**`font-mono` is on the element though Preflight already sets it.** Preflight styles `code` with
`--font-mono`, so nothing visible changes. It is there so the binding is the component's — the
trap the Kbd record warned about, flipped: here mono is wanted, so nothing would *look* wrong if it
were missing. The story reads the class as well as the computed family.

**The recipe is exported, from `styles.ts`, as `code`.** Menu's `popup` arrangement: a run that
cannot be the component still wears its classes. The case is Yet Project's doc editor, which writes
inline code into a `contenteditable` line by hand, where React never renders the children; it had
been copying the class string (that app's FINDINGS 135), which would have silently stopped
following any change made here. `code()` is the default, Primary at `sm`.

**Not interactive.** No hover, no focus, no Base UI primitive — a styled `<code>`, Kbd's case. The
file's guidance sends a copy or a link to a Button or Link beside it.

## Best practices

From the Guidance block on the `↪ Code` Docs frame (`40006577:390`).

**Do**

- Use it for short technical terms that sit inside a sentence: a function, a prop, a file path or
  a flag.
- Match Size to the text around it, so the code shares the line height of the sentence it sits
  in.
- Switch to Secondary when the sentence around it is set in subtle text, such as helper or caption
  copy.

**Don't**

- Do not use it for a snippet that stands on its own or runs past one line. That is what Code
  Block is for.
- Do not make it the click target for a copy or a link. Put a Button or Link next to it instead.
- Do not use it for keyboard shortcuts. A shortcut is not code; use Kbd.
