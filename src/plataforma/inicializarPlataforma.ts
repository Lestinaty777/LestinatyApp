import { inicializarGoogle } from './autenticacion/google';
import { inicializarCompras } from '../nucleo/compras/revenueCat';
import { inicializarOneSignal } from '../nucleo/notificaciones/oneSignal';

// Única llamada de arranque nativo: el fallo de una integración (falta de
// clave, SDK no disponible, etc.) nunca debe impedir que las otras dos
// arranquen — de ahí Promise.allSettled en vez de Promise.all.
//
// Nota: a diferencia de google.ts/google.android.ts (que sí tienen un
// archivo base sin sufijo y por eso Metro/TypeScript resuelven el import
// desnudo sin configuración extra), compras y notificaciones solo tienen
// variantes .native.ts/.web.ts — resolverlas por import desnudo exigiría
// `moduleSuffixes` en tsconfig, que rompe la resolución de tipos de terceros
// en todo el proyecto (probado). Por eso este orquestador consume las
// fachadas de compatibilidad ya existentes en vez del import desnudo.
export async function inicializarPlataforma(): Promise<void> {
  await Promise.allSettled([
    Promise.resolve().then(inicializarGoogle),
    Promise.resolve().then(inicializarCompras),
    Promise.resolve().then(inicializarOneSignal),
  ]);
}
