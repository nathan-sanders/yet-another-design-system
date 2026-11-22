import { Prism, normalizeTokens } from 'prism-react-renderer'

/**
 * The tokenizer and the one table that turns Prism's token names into the
 * library's `Syntax/*` tokens.
 *
 * `prism-react-renderer` is the engine — MIT, synchronous, and it ships its own
 * Prism build with tsx, ts, js, jsx, json, css, html, yaml, markdown, python,
 * go, rust, sql, swift, kotlin, c and cpp already registered. It also ships
 * colour themes, and **none of them are used**: a theme is a palette of hex
 * values, a second source of truth Figma cannot reach. The colour comes from
 * `text-syntax-*` classes instead, so dark mode and a swapped neutral follow
 * the tokens with nothing injected. Same reasoning as shadcn's `ChartStyle`
 * having no counterpart in the Chart record.
 */

/**
 * The thirteen roles Figma's `Syntax/*` group defines for code text. Each is a
 * utility — `text-syntax-keyword` and so on — written out in full below,
 * because Tailwind finds classes by reading source and a class assembled at
 * runtime (`text-syntax-${role}`) is never generated.
 */
export type SyntaxRole =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'type'
  | 'variable'
  | 'operator'
  | 'constant'
  | 'tag'
  | 'attribute'
  | 'property'
  | 'punctuation'

export const SYNTAX_CLASS: Record<SyntaxRole, string> = {
  keyword: 'text-syntax-keyword',
  string: 'text-syntax-string',
  comment: 'text-syntax-comment',
  number: 'text-syntax-number',
  function: 'text-syntax-function',
  type: 'text-syntax-type',
  variable: 'text-syntax-variable',
  operator: 'text-syntax-operator',
  constant: 'text-syntax-constant',
  tag: 'text-syntax-tag',
  attribute: 'text-syntax-attribute',
  property: 'text-syntax-property',
  punctuation: 'text-syntax-punctuation',
}

/**
 * Prism's token names, by the role they wear. Anything not listed paints in
 * the block's own colour, `Syntax/Variable` — the same token an identifier
 * gets, which is what plain code text is.
 *
 * Three choices in here are deliberate rather than Prism's defaults:
 *
 * - `template-punctuation` (a backtick) is a **string**, not punctuation — it
 *   is the quote mark of a template literal, and painting it grey splits the
 *   string from its own delimiters.
 * - `unit` is a **number**: `0.75rem` reads as one value, and Figma's preview
 *   colours the whole of it.
 * - `maybe-class-name` is left out. Prism's JSX grammar tags capitalised words
 *   in JSX *text* with it — "Clicked {count} times" would paint "Clicked" as a
 *   type — and the cost of a missed `React.` colour is lower than that.
 */
const ROLE_OF: Record<string, SyntaxRole> = {
  keyword: 'keyword',
  atrule: 'keyword',
  rule: 'keyword',
  important: 'keyword',
  string: 'string',
  char: 'string',
  'attr-value': 'string',
  'template-punctuation': 'string',
  regex: 'string',
  url: 'string',
  comment: 'comment',
  prolog: 'comment',
  doctype: 'comment',
  cdata: 'comment',
  shebang: 'comment',
  number: 'number',
  unit: 'number',
  hexcode: 'number',
  function: 'function',
  'function-variable': 'function',
  method: 'function',
  'class-name': 'type',
  builtin: 'type',
  namespace: 'type',
  variable: 'variable',
  parameter: 'variable',
  operator: 'operator',
  arrow: 'operator',
  constant: 'constant',
  boolean: 'constant',
  null: 'constant',
  nil: 'constant',
  symbol: 'constant',
  color: 'constant',
  entity: 'constant',
  tag: 'tag',
  selector: 'tag',
  'attr-name': 'attribute',
  property: 'property',
  punctuation: 'punctuation',
  'interpolation-punctuation': 'punctuation',
}

/**
 * The role for one token, from Prism's stack of names (outermost first).
 *
 * The innermost name that the table knows wins, with two corrections for how
 * Prism nests markup:
 *
 * - A **class name inside a JSX tag** is the tag — `<Button>` paints `Button`
 *   in `Syntax/Tag`, as Figma's preview does — unless it sits inside an
 *   embedded script (`onClick={…}`), where it is a type again.
 * - In **CSS a `--custom-property` is a property**, not a variable: it is the
 *   left-hand side of a declaration. Prism calls it `variable`.
 */
export function roleOf(types: string[], language: string): SyntaxRole | undefined {
  const inScript = types.includes('script')
  for (let i = types.length - 1; i >= 0; i--) {
    const type = types[i]
    if (type === 'class-name' && types.includes('tag') && !inScript) return 'tag'
    if (type === 'variable' && language === 'css') return 'property'
    const role = ROLE_OF[type]
    if (role) return role
  }
  return undefined
}

/**
 * Bash, which Prism's bundle does not carry. Small on purpose — a command line
 * is the common case (`npm install …`, a `$` prompt, a pipe), not a script — so
 * it knows comments, strings, `$variables`, the keywords of a shell script, and
 * that the **first word of each command is the command**. That last rule is
 * what colours `npm` in `npm install`, which is the whole of what a reader
 * wants from highlighting a one-line snippet.
 *
 * Order matters: Prism tokenizes key by key, so comments and strings are
 * claimed before anything can match inside them, and keywords before a
 * keyword at the start of a line can be read as a command.
 */
const bash = {
  comment: { pattern: /(^|[^"{\\$])#.*/, lookbehind: true },
  string: {
    pattern: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    greedy: true,
    inside: { variable: /\$(?:\w+|\{[^}]+\})/ },
  },
  keyword:
    /\b(?:if|then|else|elif|fi|for|while|until|in|do|done|case|esac|function|return|export|local|sudo)\b/,
  // Greedy, so `^` means the start of a real line: Prism matches a non-greedy
  // pattern against each leftover fragment, where `^` would also match right
  // after `npm` and colour `install` as a second command.
  function: {
    pattern: /(^[ \t]*(?:\$[ \t]+)?|[;&|][ \t]*)[A-Za-z_./][\w./-]*/m,
    lookbehind: true,
    greedy: true,
  },
  // A `$ ` prompt at the start of a line. After `function`, whose lookbehind
  // has to see it, and before `variable`, which would take the `$`.
  prompt: { pattern: /^(\s*)\$(?=\s)/m, lookbehind: true, alias: 'punctuation' },
  variable: /\$(?:\w+|[!@#?*$-]|\{[^}]+\})/,
  operator: /&&|\|\|?|>>?|<|=/,
  punctuation: /[{}()[\];]/,
}

const languages = Prism.languages as Record<string, unknown>
if (!languages.bash) {
  languages.bash = bash
  languages.sh = bash
  languages.shell = bash
  languages.zsh = bash
}

/** Languages that turn highlighting off. */
const PLAIN = new Set(['plaintext', 'plain', 'text', 'txt'])

export interface SyntaxToken {
  content: string
  /** Undefined for plain text, which wears the block's own colour. */
  role?: SyntaxRole
}

/**
 * Splits `code` into lines of coloured tokens. An unknown language, or
 * `plaintext`, comes back as one plain token per line — a language Prism does
 * not know is not an error, it is a block with no colour.
 */
export function tokenizeLines(code: string, language: string): SyntaxToken[][] {
  const grammar = PLAIN.has(language) ? undefined : Prism.languages[language]
  if (!grammar) return code.split('\n').map((line) => [{ content: line }])
  return normalizeTokens(Prism.tokenize(code, grammar)).map((line) =>
    line
      .filter((token) => token.content !== '' || line.length === 1)
      .map((token) => ({ content: token.content, role: roleOf(token.types, language) })),
  )
}

/** Whether a language shows a label — `plaintext` has nothing to name. */
export function isPlain(language: string) {
  return PLAIN.has(language)
}
