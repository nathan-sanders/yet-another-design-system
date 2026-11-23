# CodeBlock

Read-only code that stands on its own: a source file, a terminal command, a config example, a
diff.

**Sources.** The Figma page `↪ Code Block` (`40006563:157818`): the `Code Block` set
(`40006580:1235`, twenty-four variants: `Container` Card | Section × `Header` × `Size` Default |
Small × `Line Numbers` × `Split`, plus `Title`, `Language`, `Language Label`, `Copy Button` and
`Collapsible` properties and a `Code` slot), the `_Code Line` set (`40006579:438`, twelve variants:
`Type` Default | Highlighted | Added | Removed | Context | Hunk × `Size`) and the `_Code Split Row`
set (`40006635:1269`, `Size`). Docs frame `40006582:914`. Meta's
Astryx `CodeBlock` owns the API — one `code` string, a `language`, booleans for the chrome — and
its anatomy, which the Figma set already follows (the headerless copy column is Astryx's rule,
written into the set's description).

**The colour is the `Syntax/*` group**, nineteen tokens Nathan added to `Semantic Theme` for these
two components. They came into `tokens/semantic.json` by the diff method, not a re-export: all
eight existing groups fingerprinted identical to Figma, so the new group was provably the whole
delta. Thirteen colour code text (`text-syntax-keyword` … `text-syntax-punctuation`); the other six
are surfaces — `Background` (the card), `Added` / `Removed` (row fills, 25% of Green/Red 300 light,
900 dark), `Diff Header` (transparent in both themes, as drawn), and the two marker colours.

**Encoding note for the next diff.** The three composed `Syntax` values arrive as a *fourth* value
shape: `{ color: VARIABLE_ALIAS, opacity: VARIABLE_ALIAS }` on `valuesByMode`, with no `type` field
— not the `VARIABLE_EXPRESSION` / `COMPOSE_COLOR` the older twelve use. An encoder that only knows
the old shape returns null for them (loudly, if it was written to), so expect both.

## The highlighter

**`prism-react-renderer` (MIT, 2.4.1), chosen with Nathan over Shiki and an in-house tokenizer.**
Synchronous — no flash of uncoloured code — and its Prism build already carries tsx, ts, js, jsx,
json, css, html, yaml, markdown, python, go, rust, sql, swift, kotlin, c and cpp. Shiki was the
accurate option and is asynchronous and several times heavier; its themes are palettes, so it would
have needed a CSS-variable theme to reach `Syntax/*` anyway.

**None of its themes are used.** A theme is a palette of hex — a second source of truth Figma cannot
reach. `syntax.ts` calls `Prism.tokenize` and `normalizeTokens` directly and maps each token's names
to a role through one table, `ROLE_OF`; a role is a `text-syntax-*` class written out in full
(`SYNTAX_CLASS`), because a class assembled at runtime is never generated. Dark mode and a swapped
neutral follow the tokens with nothing injected — shadcn's `ChartStyle` again, refused for the same
reason.

**The mapping's corrections, each from Figma's preview or a test:**

- A **class name inside a JSX tag is the tag** — `<Button>` paints `Button` in `Syntax/Tag` and its
  brackets in `Syntax/Punctuation`, as the preview does (zoomed and checked) — unless it is inside an
  embedded script (`onClick={…}`), where it is a type again.
- A **CSS `--custom-property` is a property**, not Prism's `variable`; a `unit` is a number, so
  `0.75rem` is one colour.
- A **backtick is a string**, not punctuation — it is the template literal's quote mark.
- **`maybe-class-name` is unmapped.** Prism's JSX grammar puts it on capitalised words in JSX *text*,
  so "Clicked {count} times" would paint "Clicked" as a type.

**Bash is added** (`sh`, `shell`, `zsh` alias it), because Prism's bundle has none and the file's
own example is `npm install`. It is small on purpose: comments, strings, `$variables`, shell
keywords, and **the first word of each command is the command** — after a line start, a `$ `
prompt, `;`, `&&` or `|`. That rule has one trap, now pinned in `syntax.test.ts`: Prism matches a
non-greedy pattern against each leftover fragment, so `^` also matched right after `npm` and
`install` came out as a second command. It is `greedy`, which matches against real line starts, and
the prompt token comes *after* it so its lookbehind can still see the `$`.

An unknown language, or `plaintext`, is plain text — not an error.

## The API against Figma's axes

- **`container`** is Figma's `Container`. Card is Container Inner, `Surface/Border`,
  `Syntax/Background`; Section has no fill, rule or radius, so it takes the card or panel it is set
  into, keeping only the header's rule.
- **`size`** is `default | small` — Button's words, because it is Figma's `Size` axis and not a type
  step. Only the code lines change (`text-base/mono` 24px rows, `text-sm/mono` 20px); the header is
  `text-sm` in both, as drawn.
- **`Header` is derived, not a prop**: a block has one when it has a `title` or shows its language.
  Astryx's rule, and the derive-don't-declare one — a header prop could be on with nothing to put in
  it. So the headerless one-line command is `languageLabel={false}` with no title.
- **`lineNumbers`** is `Line Numbers`. **`_Code Line`'s `Type` is not a prop at all** — `highlighted`
  comes from `highlightLines`, the four diff types from `diff`. It is a drawing mechanism, the Data
  Viz rule about underscored components.
- **`copyButton`**, **`languageLabel`** and **`collapsible`** are the BOOLEANs.
- **A diff's label is its language**, `tsx` or `ts`, as the Review frame in Yet Project draws it
  (`40006589:62699`); only a diff with no language reads `diff`. It used to read `diff` always,
  which said how the block was drawing the code rather than what the code was (Yet Project's
  FINDINGS 137).

**`split` went code-first, and the file caught up the same day.** Yet Project's review page asked
for a Unified / Split switch (the frame draws the switch and only the unified side). A split diff is
one grid of rows, before | after, so a row's two sides always share its height, wrapped or not:
context on both sides, a run of removed lines beside the run of added lines that replaced it with
the shorter side left empty and unfilled, a hunk header spanning both. With `lineNumbers` each side
counts from its hunk header (`@@ -24,5 +24,9 @@` starts both at 24), because a split view's whole
point is old and new numbering side by side; the unified block keeps its plain count. The pairing
is `splitRows` in `diff.ts`, node-tested. Each side is as wide as its longest line and the two share
what is left; the before side carries the 1px rule between them, and each side draws its gutter
per row, since the block's one absolute gutter can only stand in one place. It needs `diff`; on
anything else it does nothing.

**How the file draws it.** `Split` is a variant axis on `Code Block`, but only eight of its sixteen
combinations exist — `Split=true` with `Header=true` (Card and Section, both sizes, with and without
numbers), each 800 wide so a side holds a real line. A headerless diff is a case nobody draws, and
the empty cells in the variant grid say so. The split variants' `Code` slot holds `_Code Split Row`
instances — two exposed `_Code Line`s, Before and After, with a 1px rule between bound to
`Surface/Border` and `border-width/border` — and a plain `_Code Line` `Type=Hunk` across both sides
for a hunk header, with no number, as the code draws it. An empty side is `Type=Context` with no line
and no code. Each side's own `_Code Line` draws its gutter, so the split variants drop the block's
absolute `Gutter` — the code's per-row gutter, mirrored. The tokens are colored by range with the
`Syntax/*` variables, the same tokenizing as the unified variants. The Docs Preview shows a split
block under the two examples in both themes, and its theme.css diff now reads `css`.

**Building it hit the clone trap again**: each cloned variant came back with five property
references dropped (Title, Language, the Copy and Chevron toggles, and the slot), and they had to be
copied back node by node after appending to the set. A clone that renders complete is not a clone
that is wired; read `componentPropertyReferences` back.

Astryx props kept because they are behaviour the canvas cannot show: `startLineNumber`, `wrap`,
`maxHeight`, `diff`, `onCopy` / `onCopyError`, and `endContent` — renamed **`actions`**, the word
ContentBlock already uses for the same slot. Dropped: `width` (the block fills its parent, the way
Figma draws it — size the parent), `collapsibleThreshold` (the guidance already says not to fold a
short block), `highlightMode`, `tokenizer`, `syntaxTheme` (no per-instance palettes: the tokens are
the theme).

## Geometry, read from the nodes

| | Figma | Code |
|---|---|---|
| header | `pl` spacing/4, `pr` / `py` spacing/2, gap spacing/2, bottom stroke `Surface/Border` | `py-2 pr-2 pl-4 gap-2`; the 1px rule is the body's `border-t` |
| title | `text-sm/mono`, `Syntax/Comment`, fills | `font-mono text-sm text-syntax-comment flex-1 truncate` |
| language | `text-sm/normal`, `Content/Subtle` | `text-sm text-content-subtle` |
| copy | Button Ghost Small, `copy` icon | `Button appearance="ghost" size="small" startIcon={Copy}` |
| body | `py` spacing/3 | `py-3` |
| row | `px` spacing/4, gap spacing/4 | `px-4 gap-4` |
| number | 20px (16 small) fixed, right-aligned, `Syntax/Punctuation`, then spacing/3 and a 1px `Surface/Border` gutter | `w-(--code-block-number) text-right` + `gap-3` + 1px |
| marker | gap spacing/2, `Syntax/Punctuation` / the two marker tokens | `w-[1ch] gap-2` |
| headerless controls | `pt` spacing/3 (10px small), `pr` spacing/2 | `pt-3` / `pt-2.5`, `pr-2` |

Two translations worth knowing:

- **The header's rule lives on the body's top edge.** The same 1px in the same place — but when a
  collapsible block folds, the body unmounts and takes its rule with it, so a closed block is a
  header inside the card's border, not a header with a second line under it.
- **The gutter is drawn once, not per row.** Figma has both: a 1px `Gutter` in every `_Code Line`
  and an absolute one on the block running through the padding, so the rule does not break above the
  first line. Code reserves the 1px in each row and draws the rule once, positioned at
  `16px + number + 12px`. The number column is `max(20px, digits × 1ch)` (16px small) through
  `--code-block-number`, so a file past line 99 widens the column by a character and every row
  stays aligned — Figma's fixed 20 only holds two digits. Both the rows and the rule resolve `ch` on
  the same mono font, which is the one thing that keeps them in step.

`Preview` asserts the result: 41 + 24 + 24 × lines + 2 for the card, 50 for the headerless snippet,
Copy level with the first line and right of all code.

## Behaviour and accessibility

- **The scroll region takes a tab stop and a name** (`role="group"`, `aria-label` = the title, else
  the language, else "Code") — axe's `scrollable-region-focusable`, and Astryx does the same. Always
  on rather than measured: a `ResizeObserver` check would lie in a hidden tab, and a block can
  overflow sideways at any width.
- **Line numbers are `aria-hidden` and `select-none`**, so a screen reader does not read "1 import"
  and a selection copies code, not numbers. The diff marker is left in — it is the source.
- **Copy copies `code` exactly**, never the rendered rows, so a diff keeps its markers and a trailing
  newline survives. The icon turns to a check (a cross on failure) for two seconds, the button's name
  follows, and a polite `role="status"` says "Copied", because a name change on a focused button is
  not reliably spoken. The Tooltip label follows too.
- **Collapsible is Base UI's `Collapsible`** — already used by SideNav, ThoughtProcess and ToolCall,
  so not a new primitive for the count. The trigger is the title group (chevron, title, language),
  **not the header**: Copy sits in the header, and a button inside a button is invalid. The chevron is
  Figma's `chevron-right`, turned 90° when open; the panel is the disclosure height transition the
  Chat parts use, copied rather than imported across component folders. `collapsible` without a
  header does nothing, as in Astryx.
- **A highlighted or added row runs the full scroll width**, not just the visible part: the lines are
  `w-max min-w-full`, so the rows are as wide as the longest line.
- One trailing newline is dropped from the display (files end with one); it stays in what Copy puts
  on the clipboard.

## Best practices

From the Guidance block on the `↪ Code Block` Docs frame (`40006582:927`).

**Do**

- Give the block a title when the code is a file. The name tells readers where it lives, and it sits
  in the header next to Copy.
- Turn Header off for a one-line command. The copy button moves into its own column beside the line,
  so the block reads as one row. (In code: no `title` and `languageLabel={false}`.)
- Colour tokens with the Syntax variables, never raw hex, so dark mode and any re-themed palette
  follow along.

**Don't**

- Do not number the lines of a short snippet. Under five lines, numbers add noise without helping
  anyone find their place.
- Do not lay a button or badge over the code. Extra actions go in the header beside Copy, where they
  never cover a line. (In code: `actions`.)
- Do not use it for a name or flag inside a sentence. That is what Code is for.
