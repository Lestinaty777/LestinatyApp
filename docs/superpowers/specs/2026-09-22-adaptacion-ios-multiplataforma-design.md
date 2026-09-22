# Adaptación multiplataforma para iOS — Diseño

**Fecha:** 2026-09-22
**Estado:** Aprobado en conversación; pendiente de revisión del documento
**Prioridad:** Publicar una versión iOS estable con la menor reestructuración posible

## Objetivo

Preparar Lestinaty para compilarse, probarse y publicarse en iPhone sin duplicar la aplicación ni alterar la UI, Senderos, hábitos o el sistema visual Skia. Android conserva todas sus funciones actuales; iOS recibe autenticación con Apple, compras y notificaciones nativas, pero no widgets en esta primera entrega. Web continúa degradando explícitamente las capacidades nativas que no tenga.

## Contexto verificado

- Expo ya declara `ios.bundleIdentifier = com.lestinaty.app` y EAS tiene perfiles de desarrollo, preview y producción.
- El bundle JavaScript completo para iOS se exportó correctamente con 7,690 módulos.
- React Native Skia soporta iOS; la UI compartida y sus efectos no necesitan una implementación paralela.
- `modules/habito-widget/expo-module.config.json` declara únicamente Android y el módulo Kotlin ya devuelve no-op fuera de Android.
- RevenueCat ya elige entre clave Apple y Google, pero oculta estados no configurados como listas vacías y el catálogo todavía acopla cada paquete a un único `product_id`.
- OneSignal está deshabilitado por código fuera de Android y registra siempre `p_plataforma = 'android'`.
- Supabase ya acepta dispositivos `ios`, `android` y `web`, pero `reclamar_recordatorios_habitos` filtra únicamente dispositivos Android.
- El despachador Edge de OneSignal usa subscription IDs y es neutral respecto de la plataforma.
- La app ya contiene restauración de compras y solicitud de eliminación de cuenta dentro de Perfil.
- Expo Doctor pasó 17 de 21 comprobaciones. Antes del primer IPA deben resolverse la dependencia directa faltante de `expo-constants`, las versiones no alineadas con SDK 57, la instalación directa de `expo-modules-core` y la propiedad de configuración ya no aceptada.

## Alcance

### Incluido

- Capa pequeña de adaptadores para capacidades variables.
- Apple Sign-In nativo en iOS conectado con Supabase Auth.
- Google Sign-In conservado donde esté configurado.
- RevenueCat en iOS y Android con resultados explícitos y productos por plataforma.
- OneSignal en iOS y Android, sin solicitar permiso durante el arranque.
- Migraciones mínimas para productos IAP por plataforma y despacho de recordatorios a iOS.
- Configuración diferenciada de desarrollo/producción para APNs y EAS.
- Alineación de dependencias con Expo SDK 57.
- Pruebas unitarias, smoke remoto, build de simulador y build TestFlight.
- Regresión de Android, incluidos sus widgets.

### Excluido

- WidgetKit, Live Activities o widgets de cualquier tipo en iOS.
- Duplicar `app/`, `src/` o la lógica de negocio por plataforma.
- Crear tres aplicaciones o convertir el repositorio en monorepo.
- Rediseñar pantallas, MasterGlass, Skia, hábitos o Senderos.
- Compras o web push en navegador durante esta entrega.
- Mover archivos compartidos solo por razones estéticas.

## Principio arquitectónico

Las pantallas y módulos de negocio consumen contratos comunes. Los SDK nativos solo se importan desde archivos resueltos por Metro mediante `.ios.ts`, `.android.ts`, `.native.ts` y `.web.ts`.

```text
Pantalla o proveedor de sesión
             │
             ▼
      contrato estable
             │
     ┌───────┼───────┐
     ▼       ▼       ▼
    iOS   Android    Web
     │       │       │
     ▼       ▼       ▼
 SDK nativo SDK nativo estado no disponible
```

No se hará una reorganización general. Se añade únicamente:

```text
src/plataforma/
├── capacidades.ts
├── inicializarPlataforma.ts
├── autenticacion/
│   ├── apple.ios.ts
│   ├── apple.android.ts
│   └── apple.web.ts
├── compras/
│   ├── contrato.ts
│   ├── cliente.native.ts
│   └── cliente.web.ts
└── notificaciones/
    ├── contrato.ts
    ├── cliente.native.ts
    └── cliente.web.ts
```

Los servicios históricos pueden reexportar temporalmente estos contratos para evitar un cambio masivo de imports.

## Capacidades

`capacidades.ts` es una descripción pura y síncrona de lo que la build puede ofrecer. No consulta permisos ni red.

```ts
type CapacidadesPlataforma = {
  appleSignIn: boolean;
  comprasNativas: boolean;
  notificacionesPush: boolean;
  widgets: boolean;
};
```

Valores iniciales:

| Capacidad | iOS | Android | Web |
|---|---:|---:|---:|
| Apple Sign-In | Sí | No | No |
| RevenueCat | Sí | Sí | No |
| OneSignal push | Sí | Sí | No |
| Widgets | No | Sí | No |

Las pantallas esconden acciones no disponibles usando estas capacidades. No deben intentar una llamada nativa para descubrir disponibilidad.

## Inicialización e identidad

`app/_layout.tsx` tendrá una sola llamada no bloqueante a `inicializarPlataforma()`. Ese orquestador inicializa cada integración de forma aislada: un fallo de OneSignal no impide configurar RevenueCat, cargar fuentes ni resolver la sesión.

Cuando Supabase cambia de sesión, el proveedor de acceso sincroniza la misma identidad estable (`auth.uid()`) con RevenueCat y OneSignal:

```text
sesión iniciada
├── compras.identificar(usuarioId)
└── notificaciones.identificar(usuarioId)

sesión cerrada
├── compras.olvidarIdentidad()
└── notificaciones.olvidarIdentidad()
```

Apple no requiere inicialización al arrancar; solo se invoca al tocar su botón.

## Contratos y estados explícitos

Ningún adaptador debe convertir falta de configuración o fallo remoto en `[]` o `false` ambiguos.

```ts
type EstadoIntegracion =
  | { estado: 'lista' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };

type ResultadoCompra =
  | { estado: 'completada' }
  | { estado: 'cancelada' }
  | { estado: 'pendiente' }
  | { estado: 'error'; mensajeSeguro: string };
```

Los errores de inicialización se registran sin bloquear la app. Los errores iniciados por el usuario —comprar, restaurar o solicitar permiso— sí producen feedback visible y traducible.

## Apple Sign-In

La implementación usa `expo-apple-authentication` únicamente en `apple.ios.ts`:

1. Comprobar disponibilidad nativa.
2. Solicitar nombre y correo con el botón oficial de Apple.
3. Generar y conservar el nonce correspondiente.
4. Obtener `identityToken`.
5. Ejecutar `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })`.
6. Guardar el nombre en metadata solo si Apple lo entrega; normalmente ocurre únicamente en la primera autorización.
7. Devolver la misma forma de `UsuarioSesion` que email y Google.

Una cancelación del diálogo de Apple no es un error visible. Token ausente, rechazo de Supabase o configuración inválida sí lo son.

`app.config.ts` habilita `ios.usesAppleSignIn`, el plugin y entitlement correspondiente. La capacidad se habilita también para `com.lestinaty.app` en Apple Developer. El botón no existe en Android ni web.

No se implementa vinculación manual de identidades en esta primera entrega. Se probarán los casos de correo compartido, correo privado relay y una cuenta existente para evitar duplicación silenciosa o pérdida de acceso.

## Compras con RevenueCat

### Cliente

`cliente.native.ts` encapsula completamente `react-native-purchases`:

- iOS usa `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`.
- Android usa `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`.
- Ausencia de clave produce `no_configurada`.
- `getOfferings`, `purchasePackage` y `restorePurchases` se exponen mediante tipos propios, no `PurchasesPackage` dentro de pantallas.
- Cancelación del comprador no muestra error.
- Una compra diferida o pendiente no acredita ni desbloquea contenido prematuramente.

`cliente.web.ts` devuelve `no_disponible` y nunca importa el SDK nativo.

### Catálogo remoto

El paquete lógico y su recompensa permanecen en `paquetes_gemas_iap`. Una tabla hija guarda identificadores de tienda:

```text
paquetes_gemas_iap_productos
├── paquete_id
├── plataforma: ios | android
├── product_id_revenuecat
└── activo
```

La combinación `(plataforma, product_id_revenuecat)` es única. La migración conserva los productos actuales como Android y permite cargar sus equivalentes de App Store sin alterar cantidades de gemas.

El webhook de RevenueCat continúa siendo la única autoridad que acredita gemas. Resuelve el `product_id` contra la tabla de productos y conserva la idempotencia por `event.id`. La app nunca incrementa saldo localmente.

La restauración ya visible en Perfil consume el contrato nuevo y distingue: restauración efectiva, sin compras asociadas, integración no configurada y error remoto.

## Notificaciones con OneSignal

`cliente.native.ts` sustituye la condición exclusiva de Android:

- Inicializa OneSignal en iOS y Android.
- Envía `Platform.OS` a `registrar_dispositivo_notificacion`.
- Vincula `auth.uid()` mediante `OneSignal.login`.
- Mantiene apertura de rutas por datos adicionales.
- No solicita permiso durante el arranque.
- Solicita permiso solo desde una acción contextual de la UI.
- Rechazo del permiso es un estado válido, no un error.

Supabase ya acepta `ios`. Una migración reemplaza el filtro `dispositivo.plataforma = 'android'` por `dispositivo.plataforma in ('ios', 'android')` al reclamar recordatorios. El Edge Function de despacho no necesita bifurcar payloads porque OneSignal recibe subscription IDs de ambas plataformas.

La configuración externa incluye APNs, la app de OneSignal y el App Group ya declarado. Builds de desarrollo usan entorno APNs de desarrollo; TestFlight/producción usan producción mediante configuración dinámica.

## Widgets Android

No se modifica la implementación Kotlin ni la UI del widget. La única adaptación es que la entrada o pantalla para agregar widgets se oculta cuando `capacidades.widgets` es falso. En iOS y web las funciones públicas son no-op explícitos y no importan `react-native-android-widget`.

Android debe conservar:

- registro del handler headless;
- widget de hábito y calendario;
- cronómetro nativo;
- procesamiento de incrementos pendientes.

## Configuración y builds

Se mantiene un único proyecto Expo. No existen carpetas de fuentes separadas para cada build.

```bash
eas build --platform ios --profile development
eas build --platform ios --profile production
eas build --platform android --profile production
npx expo export --platform web
```

`app.config.ts` extiende la configuración actual para seleccionar modo de OneSignal y capacidades según el perfil, sin copiar todo `app.json`. `eas.json` añade un perfil de simulador iOS si es necesario y mantiene producción con `autoIncrement`.

Los directorios nativos generados no son la fuente de verdad. Los cambios necesarios deben vivir en config plugins, módulos Expo locales o configuración EAS para que una regeneración no los pierda.

## Compatibilidad de dependencias

Antes de evaluar fallos nativos se lleva Expo Doctor a estado limpio:

- instalar `expo-constants` directamente;
- alinear Expo, Router, React Native y módulos Expo con SDK 57;
- resolver la divergencia de AsyncStorage;
- validar Skia contra la versión recomendada por Expo sin degradar funciones visuales usadas;
- retirar la dependencia raíz directa de `expo-modules-core` si el módulo local puede declararla correctamente como peer;
- retirar o corregir `newArchEnabled` según el esquema efectivo de SDK 57.

No se actualiza a otro SDK durante esta entrega. Cada cambio de versión debe probar bundle iOS, Android y tests antes de continuar.

## Manejo de errores

| Caso | Resultado esperado |
|---|---|
| Apple Sign-In cancelado | Cerrar el diálogo sin alerta |
| Apple sin token | Error traducible y reintento disponible |
| RevenueCat sin clave | Ocultar/deshabilitar compra y mostrar configuración no disponible |
| Compra cancelada | Mantener pantalla sin error |
| Compra pendiente | Informar que espera aprobación; no acreditar |
| Webhook retrasado | Mostrar compra procesándose y refrescar saldo acotadamente |
| Restauración vacía | Informar que no hay compras asociadas |
| Notificaciones denegadas | Guardar estado; no volver a insistir automáticamente |
| OneSignal falla al arrancar | App operativa; estado de integración registra el fallo |
| Plataforma web | Capacidades nativas ocultas; cero imports binarios |

## Pruebas

### Automatizadas

- Tests puros de `capacidades.ts` para iOS, Android y web.
- Tests de contratos de compras: lista, no configurada, cancelada, pendiente y error.
- Tests de notificaciones: plataforma enviada, denegación y sincronización de identidad.
- Tests de Apple: cancelación, token ausente, éxito y nombre disponible solo la primera vez.
- Smoke SQL para registrar un dispositivo iOS y reclamar un recordatorio con ese dispositivo.
- Test del webhook con productos Android/iOS y reintento del mismo evento sin duplicar gemas.
- Regresión de restauración y cierre de sesión.

### Builds y dispositivo

1. `npx expo export --platform ios` y `--platform web`.
2. Expo Doctor sin fallos relevantes.
3. Build EAS de simulador para navegación, layout, Skia y Apple Sign-In disponible.
4. Build TestFlight en iPhone físico para APNs, OneSignal y Apple Sign-In real.
5. RevenueCat Sandbox: compra, cancelación, pendiente, restauración y webhook.
6. Build Android de regresión: Google Sign-In, compras, push, widgets y cronómetro.

## Orden de entrega

1. Normalizar dependencias y configuración Expo.
2. Crear contratos, capacidades y orquestador manteniendo reexports compatibles.
3. Aislar widgets sin alterar Android.
4. Implementar Apple Sign-In.
5. Habilitar OneSignal iOS y aplicar su migración remota.
6. Separar productos RevenueCat y adaptar webhook/cliente.
7. Ejecutar builds, sandbox, TestFlight y regresión Android/web.

## Criterios de aceptación

- La app genera bundle y build nativo iOS sin imports Android inválidos.
- La UI y los efectos Skia se ven equivalentes en iPhone.
- iOS no muestra widgets ni intenta registrar su handler.
- Apple Sign-In crea y recupera una sesión Supabase válida.
- Google/email continúan funcionando en sus plataformas actuales.
- RevenueCat usa la clave/producto correcto por plataforma y ninguna compra duplica gemas.
- Restaurar compras funciona en iOS.
- OneSignal registra `ios` y recibe un recordatorio en dispositivo físico.
- Denegar push o cancelar login/compra no bloquea la aplicación.
- Android conserva pagos, push, widgets y cronómetro.
- Web exporta sin SDK nativo en el bundle.
- Ningún secreto Apple, APNs, RevenueCat o Supabase se agrega a Git.
