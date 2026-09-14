# Lestinaty Horizon: acceso Pro para widgets de hábitos

## Objetivo

Presentar **Lestinaty Horizon** como el plan Pro de la aplicación y proteger
la galería de widgets de hábitos con el entitlement de RevenueCat `horizon`.
La fase entrega el descubrimiento, la compra/restauración y las rutas de UI;
no implementa todavía App Widgets nativos de Android ni WidgetKit de iOS.

## Alcance de la primera fase

- Un servicio de compras de Horizon, construido sobre la inicialización actual
  de RevenueCat.
- Una consulta compartida de estado Pro que distingue: disponible, no
  configurado, activo y error recuperable.
- Un paywall de Horizon que carga paquetes desde la offering actual de
  RevenueCat, permite comprar y restaurar compras.
- Una galería de widgets con tres previews: registro rápido, progreso de hoy
  y hábito destacado.
- Un acceso de Widgets dentro de Hábitos y una tarjeta de descubrimiento al
  final de Recordatorios.
- La interfaz muestra la galería a usuarios Horizon; usuarios sin entitlement
  se dirigen al paywall.

## RevenueCat

El nombre comercial es **Lestinaty Horizon**. El entitlement de RevenueCat es
`horizon`.

El servicio no guarda precios ni estado de suscripción en Supabase. Consulta
`Purchases.getCustomerInfo()` para revisar `entitlements.active.horizon` y
`Purchases.getOfferings()` para obtener los paquetes disponibles. El producto,
la offering actual y los precios se configuran en el dashboard de RevenueCat.

Cuando no haya API key o offering configurada, el estado será `noDisponible`.
El paywall conserva la explicación del beneficio y desactiva la compra con un
mensaje claro; no concede Horizon localmente. Restaurar compras usa
`Purchases.restorePurchases()` y refresca el estado.

## Rutas y flujo

```
Hábitos ── Widgets ──┬── usuario Horizon ──> /habitos/widgets
                    └── usuario gratuito ─> /horizon

Recordatorios ── tarjeta "Lleva tus hábitos a tu inicio" ── mismo flujo

/horizon ── comprar/restaurar ──> refresca entitlement ──> /habitos/widgets
```

La galería contendrá previews no interactivos de los tres widgets y explicará
que la instalación en la pantalla de inicio llegará al implementar el módulo
nativo. Esto evita prometer que un preview ya es un widget instalado.

## Componentes

- `src/nucleo/compras/horizon.ts`: funciones puras de integración RevenueCat
  (estado, paquetes, compra y restauración).
- `src/nucleo/compras/useHorizon.ts`: hook React Query que mantiene el estado
  fresco después de compra/restauración.
- `src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx`: oferta, precios,
  compra, restauración y estados no disponibles.
- `src/modulos/habitos/pantallas/WidgetsHabitosPantalla.tsx`: galería de
  previews protegida por Horizon.
- Rutas Expo equivalentes en `app/horizon.tsx` y `app/habitos/widgets.tsx`.
- Pequeños componentes de acceso/promo reutilizados desde Hábitos y
  Recordatorios.

## Estados y errores

- Cargando entitlement: el CTA muestra un indicador y no navega hasta conocer
  el estado.
- Sin configuración de RevenueCat: se muestra Horizon, sin precio falso ni
  compra habilitada.
- Compra cancelada: vuelve al paywall sin error alarmista.
- Compra o restauración fallida: mensaje recuperable y botón para reintentar.
- Entitlement activo después de comprar/restaurar: invalidar la consulta y
  navegar a la galería.

## Pruebas

- Funciones que identifican el entitlement `horizon` a partir de fixtures de
  CustomerInfo.
- Selección de paquetes y estados sin offering.
- Verificación de que un usuario no Horizon es dirigido al paywall y un usuario
  Horizon llega a la galería.

## Fuera de alcance

- Código nativo Android/iOS de widgets y su actualización desde la app.
- Programar recordatorios mediante widgets.
- Un segundo nivel de suscripción o acceso de por vida.
