import { defineConfig } from 'vitest/config';

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

export default defineConfig(async () => {
  // Only load the Vite React plugin when not running under Vitest. Loading
  // the plugin during Vitest's config resolution can trigger a CJS -> ESM
  // require() of Vite internals which fails in some environments.
  const plugins: any[] = [];
  if (!process.env.VITEST) {
    try {
      const mod = await import('@vitejs/plugin-react-swc');
      const react = (mod && (mod as any).default) || mod;
      plugins.push(react());
    } catch (e) {
      // If dynamic import fails, continue without the plugin. This keeps
      // tests runnable in CI where ESM/CJS interop can be problematic.
      // eslint-disable-next-line no-console
      console.warn('Could not load @vitejs/plugin-react-swc, continuing without it:', e && (e as any).message);
    }
  }

  return {
    plugins,
    resolve: {
      alias: [versionStripAlias() as any]
    },
    // Provide default env values for Vite import.meta.env during tests so modules
    // that create external clients (e.g. Supabase) don't throw at import time.
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'http://localhost'),
      'import.meta.env.VITE_ANON_KEY': JSON.stringify(process.env.VITE_ANON_KEY || 'anon')
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
  };
});


