import { QueryClient } from '@tanstack/react-query';

export const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});
