// Writes registry.json — the list `shadcn build` turns into the files under r/
// that `npx shadcn add @yads/<name>` downloads.
//
// Nothing in registry.json is written by hand. Every item is read off the
// source: which files a component needs, which other YADS components it pulls
// in, and which npm packages it imports. A hand-kept list would go stale the
// first time a component started importing another one, and nothing would
// notice until someone's install broke. `src/registry.test.ts` fails when the
// committed registry.json no longer matches what this script would write.
//
//   node scripts/build-registry.ts          write registry.json
//   npm run registry                        that, then `shadcn build` into dist-registry/r
//
// Run with Node 24's built-in TypeScript support: no build step, no extra
// dependency. That is why the syntax stays erasable (no enums, no namespaces).

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/** The namespace the docs tell people to register in their components.json. */
export const NAMESPACE = '@yads'

const HOMEPAGE = 'https://nathan-sanders.github.io/yet-another-design-system/'

/**
 * Packages a person's app already has. React is the host, not a dependency of
 * any one component, and adding it per component would let `shadcn add` try to
 * change the version they chose.
 */
const HOST_PACKAGES = new Set(['react', 'react-dom'])

/** Files in a component folder that are never part of what ships. */
const isDevOnly = (file: string) =>
  /\.stories\.tsx?$/.test(file) || /\.test\.tsx?$/.test(file) || file.endsWith('.d.ts')

type RegistryFile = { path: string; type: string; target: string }

type RegistryItem = {
  name: string
  type: string
  title: string
  description: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
  extends?: string
}

type Registry = {
  $schema: string
  name: string
  homepage: string
  items: RegistryItem[]
}

/** `AlertDialog` → `alert-dialog`, `OTPInput` → `otp-input`. */
export function toItemName(folder: string): string {
  return folder
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/** `@base-ui/react/dialog` → `@base-ui/react`, `recharts/types/x` → `recharts`. */
function packageName(spec: string): string {
  const parts = spec.split('/')
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const posix = (p: string) => p.split(path.sep).join('/')

/** The import specifiers in a file — real ones only, never an example in a comment. */
function importsOf(absFile: string): string[] {
  if (!/\.(m?[jt]sx?)$/.test(absFile)) return []
  const text = fs.readFileSync(absFile, 'utf8')
  return ts.preProcessFile(text, true, true).importedFiles.map((f) => f.fileName)
}

/** What a relative specifier points at on disk, the way Vite and tsc resolve it. */
function resolveRelative(fromFile: string, spec: string): string {
  const base = path.resolve(path.dirname(fromFile), spec)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  throw new Error(`${posix(path.relative(process.cwd(), fromFile))}: cannot resolve '${spec}'`)
}

export function buildRegistry(root: string = process.cwd()): Registry {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  const versions: Record<string, string> = { ...pkg.dependencies }

  const componentsDir = path.join(root, 'src/components')
  const libDir = path.join(root, 'src/lib')

  // An "owner" is the registry item a source file ships in: one per component
  // folder, and one per file in src/lib.
  type Owner = { name: string; kind: 'component' | 'lib'; title: string }

  function ownerOf(absFile: string): Owner {
    const rel = posix(path.relative(root, absFile))
    let m = rel.match(/^src\/components\/([^/]+)\//)
    if (m) return { name: toItemName(m[1]), kind: 'component', title: m[1] }
    m = rel.match(/^src\/lib\/([^/]+)\.tsx?$/)
    if (m) return { name: `lib-${toItemName(m[1])}`, kind: 'lib', title: `${m[1]}.ts` }
    throw new Error(
      `${rel} is imported by library code but lives outside src/components and src/lib, ` +
        'so there is nowhere for `shadcn add` to put it.',
    )
  }

  const folders = fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  const entries: string[] = []
  for (const folder of folders) {
    const index = path.join(componentsDir, folder, 'index.ts')
    if (!fs.existsSync(index)) throw new Error(`src/components/${folder} has no index.ts`)
    entries.push(index)
  }
  for (const f of fs.readdirSync(libDir).sort()) {
    if (/\.tsx?$/.test(f) && !isDevOnly(f)) entries.push(path.join(libDir, f))
  }

  // Walk every import the shipped code makes, starting from each component's
  // barrel. Stories are never an entry point, so a file only a story uses —
  // sample data, a story surface, a placeholder photo — never ships.
  const reached = new Set<string>()
  const queue = [...entries]
  const fileImports = new Map<string, { local: string[]; npm: string[] }>()
  while (queue.length) {
    const file = queue.shift()!
    if (reached.has(file)) continue
    reached.add(file)
    const local: string[] = []
    const npm: string[] = []
    for (const spec of importsOf(file)) {
      if (spec.startsWith('.')) {
        const target = resolveRelative(file, spec)
        if (isDevOnly(path.basename(target))) {
          throw new Error(`${posix(path.relative(root, file))} imports dev-only ${spec}`)
        }
        local.push(target)
        queue.push(target)
      } else {
        npm.push(packageName(spec))
      }
    }
    fileImports.set(file, { local, npm })
  }

  const items = new Map<
    string,
    { owner: Owner; files: Set<string>; deps: Set<string>; registryDeps: Set<string> }
  >()
  for (const file of [...reached].sort()) {
    const owner = ownerOf(file)
    let item = items.get(owner.name)
    if (!item) {
      item = { owner, files: new Set(), deps: new Set(), registryDeps: new Set() }
      items.set(owner.name, item)
    }
    item.files.add(file)
    const { local, npm } = fileImports.get(file)!
    for (const target of local) {
      const other = ownerOf(target)
      if (other.name !== owner.name) item.registryDeps.add(`${NAMESPACE}/${other.name}`)
    }
    for (const name of npm) {
      if (HOST_PACKAGES.has(name)) continue
      const range = versions[name]
      if (!range) {
        throw new Error(
          `${posix(path.relative(root, file))} imports '${name}', which is not in package.json ` +
            'dependencies — a devDependency cannot ship in a component.',
        )
      }
      item.deps.add(`${name}@${range}`)
    }
  }

  const theme: RegistryItem = {
    name: 'theme',
    type: 'registry:style',
    // Not shadcn's own base style. YADS brings every token it uses, and
    // shadcn's base would add a second --radius and --font-sans on top of them.
    extends: 'none',
    title: 'Theme',
    description:
      'Every YADS token — primitives, semantic colors for light and dark, type, spacing, radius, ' +
      'shadows and motion — as one generated theme.css. Re-add with --overwrite to pick up token changes.',
    dependencies: [
      `@fontsource/inter@${versions['@fontsource/inter']}`,
      `@fontsource-variable/geist-mono@${versions['@fontsource-variable/geist-mono']}`,
    ],
    files: [
      {
        path: 'src/styles/theme.css',
        // A plain file, so the CLI writes it byte for byte rather than running
        // its CSS-variable transforms over a file that is generated anyway.
        type: 'registry:file',
        target: 'src/styles/theme.css',
      },
    ],
  }

  const rest: RegistryItem[] = [...items.values()]
    .sort((a, b) => {
      // Components first, then the shared lib files they lean on.
      if (a.owner.kind !== b.owner.kind) return a.owner.kind === 'component' ? -1 : 1
      return a.owner.name.localeCompare(b.owner.name)
    })
    .map(({ owner, files, deps, registryDeps }) => {
      const type = owner.kind === 'component' ? 'registry:component' : 'registry:lib'
      const item: RegistryItem = {
        name: owner.name,
        type,
        title: owner.title,
        description:
          owner.kind === 'component'
            ? `The YADS ${owner.title} component, in components/${owner.title}.`
            : `Shared YADS helper ${owner.title}, in lib/.`,
        files: [...files].sort().map((abs) => {
          const rel = posix(path.relative(root, abs))
          // `@components/…` and `@lib/…` resolve against the folders the
          // person's components.json aliases point at, so a component lands in
          // components/<Name>/ beside lib/ wherever those two live. The files
          // keep their relative imports (`../Icon`, `../../lib/cn`), which hold
          // as long as components/ and lib/ are siblings — true of every
          // layout `shadcn init` makes.
          const target = rel.replace(/^src\/components\//, '@components/').replace(/^src\/lib\//, '@lib/')
          // `registry:file` makes the CLI write the file byte for byte. As
          // `registry:component` it runs its code transforms first, and those
          // drop the doc comment at the top of any file that opens with one —
          // focus.ts and three of Chart's modules lost their whole rationale.
          // The transforms buy nothing here: they rewrite `@/` imports, and
          // these files only use relative ones.
          return { path: rel, type: 'registry:file', target }
        }),
      }
      if (deps.size) item.dependencies = [...deps].sort()
      if (registryDeps.size) item.registryDependencies = [...registryDeps].sort()
      return item
    })

  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'yads',
    homepage: HOMEPAGE,
    items: [theme, ...rest],
  }
}

export function serialize(registry: Registry): string {
  return `${JSON.stringify(registry, null, 2)}\n`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = path.join(process.cwd(), 'registry.json')
  const registry = buildRegistry()
  fs.writeFileSync(out, serialize(registry))
  const components = registry.items.filter((i) => i.type === 'registry:component').length
  console.log(`registry.json: theme, ${components} components, ${registry.items.length - components - 1} lib files`)
}
