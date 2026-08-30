/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [{
      // A plain node project for checks that are about the source text rather
      // than a rendered component — no browser, so it costs nothing.
      extends: true,
      test: {
        name: 'tokens',
        environment: 'node',
        include: ['src/**/*.test.ts'],
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      // Stories are this repo's only test suite, and they run in a real browser,
      // so every dependency they pull in has to reach it as ESM.
      //
      // @testing-library/dom depends on aria-query 5.3.0, which is plain
      // CommonJS — no "module", no "exports" map, no "type": "module". Vite
      // normally converts a dependency like that to ESM while pre-bundling, but
      // it only pre-bundles what its scanner can find by following imports from
      // real entry files. This one arrives through the Storybook addon's setup
      // file via a *virtual* module:
      //
      //   virtual:/@storybook/builder-vite/project-annotations.js
      //     -> storybook/internal/preview-api
      //       -> @testing-library/dom
      //         -> aria-query
      //
      // The scanner cannot see through the virtual module, so aria-query was
      // never pre-bundled, was served to the browser as raw CJS, and every story
      // file died at import with "does not provide an export named
      // 'elementRoles'" — reporting "no tests" rather than a real failure, which
      // is the part that made it look like nothing was wrong.
      //
      // Naming it here puts it back in the optimizer's list. It is the parent
      // package rather than the individual CJS leaves (aria-query, lz-string,
      // dom-accessibility-api, …) because including a package bundles its
      // dependencies along with it — chasing the leaves one at a time just moves
      // the error to the next one.
      //
      // @testing-library/dom is a devDependency purely so this line can name it.
      // It arrives anyway as a transitive dependency of storybook, but
      // optimizeDeps.include hard-errors on a name it cannot resolve, so relying
      // on the hoisted copy would make this config depend on npm's layout.
      // Declared at the same ^10.4.1 storybook asks for, so it still dedupes to
      // one copy.
      //
      // @base-ui/react/toast is here for a different reason with the same shape.
      // Every other Base UI subpath is reached from a component that some story
      // imports at module scope, so the scanner finds them on the first pass.
      // Toast's stories are the first to pull in a subpath the optimizer had not
      // already seen, so it was discovered mid-run: Vite re-bundled, reloaded the
      // page under the test, and all eight Toast stories failed with "Failed to
      // fetch dynamically imported module" — a reload, not a real failure, but an
      // indistinguishable-looking one. Name any new Base UI subpath here.
      optimizeDeps: {
        include: [
          '@testing-library/dom',
      '@base-ui/react/accordion',
          '@base-ui/react/autocomplete',
          '@base-ui/react/toast',
          '@base-ui/react/checkbox',
          '@base-ui/react/radio',
          '@base-ui/react/menu',
          '@base-ui/react/context-menu',
          '@base-ui/react/switch',
          '@base-ui/react/slider',
          '@base-ui/react/use-render',
          '@base-ui/react/input',
          '@base-ui/react/field',
          '@base-ui/react/checkbox-group',
          '@base-ui/react/popover',
          '@base-ui/react/select'
        ]
      },
      test: {
        name: 'storybook',
        exclude: ['**/*.test.ts'],
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});