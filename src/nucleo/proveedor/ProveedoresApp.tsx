import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProveedorConsultas } from '../../servicios/consultas/ProveedorConsultas';
import { ProveedorAcceso } from '../../modulos/acceso/proveedor/ProveedorAcceso';
import { ProveedorTemaMaster } from './ProveedorTemaMaster';

export function ProveedoresApp({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProveedorConsultas>
          <ProveedorAcceso><ProveedorTemaMaster>{children}</ProveedorTemaMaster></ProveedorAcceso>
        </ProveedorConsultas>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
