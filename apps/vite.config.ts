import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// The mock apps: real, routed screens built from the library to show its range
// and to stress-test it. A second Vite project beside the playground, because the
// root config carries the Storybook test setup and these are plain sites.
//
// Multi-page: `index.html` is the showcase that lists every app, and each app is
// a folder with its own `index.html`. Adding an app is a folder plus one entry in
// `input` below and one card in `showcase/apps.ts`.
//
// Apps import the library straight from `../src`, so an edit to a component shows
// up in every app on the next reload — there is no package to publish in between.
//
// `APPS_BASE` is set by the Pages workflow, which serves the build under
// /yet-another-design-system/apps/. Locally it is the root.
const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  base: process.env.APPS_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  build: {
    outDir: fileURLToPath(new URL('../dist-apps', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        showcase: fileURLToPath(new URL('./index.html', import.meta.url)),
        social: fileURLToPath(new URL('./social/index.html', import.meta.url)),
      },
    },
  },
})
