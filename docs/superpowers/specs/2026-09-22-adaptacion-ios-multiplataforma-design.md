# Adaptación multiplataforma para iOS — Diseño

**Fecha:** 2026-09-22
**Estado:** Corregido tras revisión; pendiente de aprobación final
**Prioridad:** Publicar una versión iOS estable con la menor reestructuración posible

## Objetivo

Preparar Lestinaty para compilarse, probarse y publicarse en iPhone sin duplicar la aplicación ni alterar la UI, Senderos, hábitos o el sistema visual Skia. Android conserva todas sus funciones actuales; iOS recibe autenticación solo con email, compras y notificaciones nativas, pero no widgets ni login social en esta primera entrega. Web continúa degradando explícitamente las capacidades nativas que no tenga.

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
- El acceso por email ya cubre registro con OTP (`crearCuentaConEmail` + `verificarRegistroConOtp`), login con contraseña y recuperación con OTP (`recuperarAcceso` + `verificarRecuperacionConOtp`).
- `acceso.servicio.ts` importa `@react-native-google-signin/google-signin` en el nivel superior y `googleSignIn.ts` configura solo `webClientId`; no existe `iosClientId` ni `iosUrlScheme`.
- Solo existe `app.json`; `app.config.ts` debe crearse.
- Expo Doctor pasó 17 de 21 comprobaciones. Antes del primer IPA deben resolverse la dependencia directa faltante de `expo-constants`, las versiones no alineadas con SDK 57, la instalación directa de `expo-modules-core` y la propiedad de configuración ya no aceptada.

## Alcance

### Incluido

- Capa pequeña de adaptadores para capacidades variables.
- Acceso solo con email (registro OTP, contraseña, recuperación OTP) en iOS.
- Google Sign-In conservado sin cambios en Android y aislado para que su SDK no se cargue en iOS ni web.
- RevenueCat en iOS y Android con resultados explícitos y productos por plataforma.
- OneSignal en iOS y Android, sin solicitar permiso durante el arranque.
- Migraciones mínimas para productos IAP por plataforma y despacho de recordatorios a iOS.
- Configuración diferenciada de desarrollo/producción para APNs y EAS.
- Alineación de dependencias con Expo SDK 57.
- Pruebas unitarias, smoke remoto, build de simulador y build TestFlight.
- Regresión de Android, incluidos sus widgets.

### Excluido

- WidgetKit, Live Activities o widgets de cualquier tipo en iOS.
- Sign in with Apple y Google Sign-In en iOS. Se agregarán juntos en una entrega posterior (ver «Acceso en iOS»).
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
│   ├── google.android.ts
│   └── google.ts          # no-op para iOS y web
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
  googleSignIn: boolean;
  comprasNativas: boolean;
  notificacionesPush: boolean;
  widgets: boolean;
};
```

Valores iniciales:

| Capacidad | iOS | Android | Web |
|---|---:|---:|---:|
| Acceso por email | Sí | Sí | Sí |
| Google Sign-In | No | Sí | No |
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

Google Sign-In se configura solo en Android; en iOS y web no se importa su SDK.

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

type ResultadoAccesoGoogle =
  | { estado: 'autenticado'; usuario: UsuarioSesion }
  | { estado: 'cancelado' }
  | { estado: 'no_disponible'; motivo: 'plataforma' };
```

Los errores de inicialización se registran sin bloquear la app. Los errores iniciados por el usuario —comprar, restaurar o solicitar permiso— sí producen feedback visible y traducible.

## Acceso en iOS

En iOS la primera entrega ofrece únicamente acceso por email, con los flujos que ya existen:

- registro con contraseña y confirmación por OTP;
- inicio de sesión con contraseña;
- recuperación de acceso por OTP y nueva contraseña;
- eliminación de cuenta desde Perfil.

La guía 4.8 de App Review solo exige Sign in with Apple cuando la app ofrece un login de terceros. Sin Google en iOS, no se requiere Apple, ni su entitlement, nonce, clave `.p8` o revocación de tokens al eliminar la cuenta.

### Aislamiento de Google Sign-In

- `iniciarSesionConGoogle` y `GoogleSignin.configure` se mueven a `src/plataforma/autenticacion/google.android.ts`.
- `google.android.ts` y `google.ts` exponen `iniciarSesionConGoogle(codigoReferido?): Promise<ResultadoAccesoGoogle>`. Android transforma el éxito/cancelación actuales en la unión discriminada; iOS y web devuelven `{ estado: 'no_disponible', motivo: 'plataforma' }` sin importar el SDK.
- `acceso.servicio.ts` deja de importar `@react-native-google-signin/google-signin` en el nivel superior y reexporta desde el adaptador.
- El build iOS no enlaza el módulo nativo. Se usa exclusivamente `expo.autolinking.ios.exclude` en `package.json`; no se crea `react-native.config.js`:

```json
{
  "expo": {
    "autolinking": {
      "ios": {
        "exclude": ["@react-native-google-signin/google-signin"]
      }
    }
  }
}
```

- La exclusión de autolinking es la responsable de retirar el pod de iOS. El config plugin actual no se usa como sustituto de esa exclusión; cualquier cambio al plugin debe conservar la configuración Android y pasar su regresión.
- Los botones de Google en onboarding y acceso se muestran solo si `capacidades.googleSignIn` es verdadero.

Android conserva Google Sign-In sin cambios de comportamiento.

### Cuentas creadas con Google en Android

Un usuario registrado con Google no tiene contraseña. Para entrar en iPhone usa «Recuperar acceso» con el mismo correo: el OTP de recuperación debe permitir definir una contraseña sobre la misma cuenta de Supabase. En iOS, la pantalla de acceso muestra un texto traducible del tipo «¿Te registraste con Google? Usa Recuperar acceso con tu correo».

Este flujo es un gate previo a ocultar Google o excluir su módulo de iOS. Antes de cambiar la UI o autolinking se crea una cuenta Google real desechable, se cierra sesión, se completa recuperación OTP, se define contraseña, se inicia sesión por email y se compara el `auth.uid()` antes/después. También se comprueba que progreso, gemas y Horizon continúan asociados.

Si la prueba no conserva el mismo `auth.uid()`, la adaptación se detiene en este punto: no se oculta Google en iOS y se redefine el alcance para implementar Google junto con Apple Sign-In o una migración de identidad segura. No se permite publicar dejando cuentas existentes sin acceso.

### Entrega posterior

Sign in with Apple y Google Sign-In en iOS se agregarán juntos, ya que ofrecer Google obliga a ofrecer Apple. Esa entrega incluirá `expo-apple-authentication`, nonce (SHA-256 hacia Apple, valor original hacia Supabase), `iosClientId`/`iosUrlScheme` de Google y la revocación del token de Apple al eliminar la cuenta.

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
| Usuario de Google intenta entrar en iOS | Texto guía hacia «Recuperar acceso» |
| OTP inválido o expirado | Error traducible y reenvío disponible |
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
- Tests del adaptador de Google: `no_disponible` en iOS/web sin importar el SDK; comportamiento actual en Android.
- Test de capacidades: Google Sign-In oculto en iOS y web.
- Smoke SQL para registrar un dispositivo iOS y reclamar un recordatorio con ese dispositivo.
- Test del webhook con productos Android/iOS y reintento del mismo evento sin duplicar gemas.
- Regresión de restauración y cierre de sesión.

### Builds y dispositivo

1. `npx expo export --platform ios` y `--platform web`.
2. Expo Doctor sin fallos relevantes.
3. Build EAS de simulador para navegación, layout, Skia y ausencia de botones de Google.
4. Build TestFlight en iPhone físico para APNs, OneSignal y acceso por email: registro OTP, login, recuperación y cuenta creada con Google en Android.
5. RevenueCat Sandbox: compra, cancelación, pendiente, restauración y webhook.
6. Build Android de regresión: Google Sign-In, compras, push, widgets y cronómetro.

## Orden de entrega

1. Ejecutar el gate de recuperación de una cuenta Google y confirmar conservación de `auth.uid()`.
2. Normalizar dependencias y configuración Expo.
3. Crear contratos, capacidades y orquestador manteniendo reexports compatibles.
4. Aislar widgets sin alterar Android.
5. Aislar Google Sign-In en Android y ajustar la pantalla de acceso de iOS.
6. Habilitar OneSignal iOS y aplicar su migración remota.
7. Separar productos RevenueCat y adaptar webhook/cliente.
8. Ejecutar builds, sandbox, TestFlight y regresión Android/web.

## Criterios de aceptación

- La app genera bundle y build nativo iOS sin imports Android inválidos.
- La UI y los efectos Skia se ven equivalentes en iPhone.
- iOS no muestra widgets ni intenta registrar su handler.
- En iOS, registro, login y recuperación por email crean y recuperan una sesión Supabase válida.
- Una cuenta creada con Google en Android puede entrar en iOS mediante recuperación y conserva su `auth.uid()`.
- El build iOS no incluye el SDK de Google Sign-In.
- Google y email continúan funcionando en Android.
- RevenueCat usa la clave/producto correcto por plataforma y ninguna compra duplica gemas.
- Restaurar compras funciona en iOS.
- OneSignal registra `ios` y recibe un recordatorio en dispositivo físico.
- Denegar push o cancelar login/compra no bloquea la aplicación.
- Android conserva pagos, push, widgets y cronómetro.
- Web exporta sin SDK nativo en el bundle.
- Ningún secreto APNs, RevenueCat o Supabase se agrega a Git.
