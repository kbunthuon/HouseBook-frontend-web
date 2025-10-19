import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// This alias rewrites imports that include an embedded version suffix (e.g.
// "@radix-ui/react-slot@1.1.2") back to the bare package name so Vite can
// resolve them. It handles both scoped and unscoped packages.
function versionStripAlias() {
  return {
    find: /^(.+?)@\d+.*$/,
    replacement: (id: string) => {
      const m = id.match(/^(.+?)@\d+.*$/);
      return m ? m[1] : id;
    }
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [versionStripAlias() as any]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./frontend_web/src/setupTests.vitest.ts'],
    include: ['frontend_web/src/**/*.vitest.test.[jt]s?(x)'],
    deps: {
      inline: [/(@radix-ui)/, /@testing-library\/user-event/]
    }
  }
});


