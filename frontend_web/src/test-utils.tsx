import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Re-export all testing-library utilities first. We'll then export our
// custom `render` function so it overrides the re-exported one.
export * from '@testing-library/react';
export { fireEvent } from '@testing-library/react';

function render(ui: React.ReactElement, options?: Omit<RenderOptions, 'queries'>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests so failures surface immediately
        retry: false,
      },
    },
  });
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export { render };

