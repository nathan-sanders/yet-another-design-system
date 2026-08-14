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
      // Naming them here puts them back in the optimizer's list. It is the two
      // testing-library packages rather than the individual CJS leaves
      // (aria-query, lz-string, dom-accessibility-api, …) because including a
      // package bundles its dependencies along with it — chasing the leaves one
      // at a time just moves the error to the next one.
      optimizeDeps: {
        include: ['@testing-library/dom', '@testing-library/jest-dom']
      },
      test: {
        name: 'storybook',
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