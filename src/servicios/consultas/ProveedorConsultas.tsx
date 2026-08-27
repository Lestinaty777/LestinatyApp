import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

import { clienteConsultas } from './clienteConsultas';

export function ProveedorConsultas({ children }: PropsWithChildren) {
  return <QueryClientProvider client={clienteConsultas}>{children}</QueryClientProvider>;
}
