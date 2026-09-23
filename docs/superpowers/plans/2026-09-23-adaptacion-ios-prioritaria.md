# Adaptación iOS prioritaria Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar una primera versión estable de Lestinaty para iPhone, sin widgets ni login social en iOS, conservando email/OTP, RevenueCat, OneSignal, Skia y toda la funcionalidad Android existente.

**Architecture:** Se mantiene una sola aplicación Expo y una sola UI. Las diferencias nativas se encapsulan detrás de contratos en `src/plataforma/` y archivos resueltos por Metro (`.android.ts`, `.native.ts`, `.web.ts`); las pantallas solo consumen capacidades y tipos propios. La entrega está dividida en gates: identidad Google, salud Expo, aislamiento nativo, servicios iOS, backend, build y dispositivo real.

**Tech Stack:** Expo SDK 57, React Native 0.86, Expo Router, TypeScript, Vitest, Supabase, RevenueCat, OneSignal, EAS Build/TestFlight y React Native Skia.

**Spec:** `docs/superpowers/specs/2026-09-22-adaptacion-ios-multiplataforma-design.md`

## Global Constraints

- iOS ofrece únicamente email/contraseña/OTP en esta entrega; no incluye Google Sign-In ni Sign in with Apple.
- iOS no incluye WidgetKit, Live Activities ni ningún widget; Android conserva widgets, handler headless y cronómetro nativo.
- Google Sign-In continúa funcionando en Android y su SDK no se importa ni se enlaza en iOS/web.
- No se duplica `app/`, `src/`, Senderos, hábitos, MasterGlass ni la UI Skia.
- RevenueCat funciona en iOS/Android; OneSignal funciona en iOS/Android; web declara ambas integraciones como no disponibles.
- El webhook de RevenueCat es la única autoridad que acredita gemas y conserva idempotencia por `event.id`.
- No se solicita permiso de notificaciones al arrancar; solo desde una acción contextual.
- Se mantiene Expo SDK 57; no se actualiza a otro SDK durante esta entrega.
- Los directorios nativos generados no son fuente de verdad; toda configuración vive en Expo config, módulos locales o EAS.
- Ningún secreto de Supabase, APNs, RevenueCat, OneSignal o Apple se guarda en Git.
- El worktree contiene trabajo del usuario: cada commit agrega únicamente los archivos listados en su tarea y nunca usa `git add .`.
- Si el gate de recuperación cambia `auth.uid()`, la implementación se detiene antes de ocultar Google en iOS.
- No se pulsa Submit for Review con un gate P0/P1 fallido, omitido o sin evidencia.
- Las credenciales demo, OTP, UUID y secretos se colocan solo en campos seguros de App Store Connect/EAS, nunca en documentación versionada.
- Ninguna capacidad se enciende, apaga o altera remotamente mientras el build está In Review; cualquier contingencia usa un build nuevo y metadata coherente.
- La primera entrega usa tema claro fijo: el modo oscuro del iPhone no puede alterar paleta, status bar, teclado, alerts, modales, splash ni controles nativos.

## Review Focus

1. Una cuenta creada con Google en Android debe recuperar acceso por email sin cambiar `auth.uid()` ni perder hábitos, gemas o Horizon; Task 1 fija este gate.
2. Una ruta profunda a `/habitos/widgets` en iOS/web no debe cargar paquetes Android ni mostrar una pantalla rota; Task 4 prueba el redirect y los no-op.
3. La ausencia de claves nativas o un fallo de una integración no debe bloquear el arranque ni aparentar un catálogo vacío válido; Tasks 6, 8 y 9 prueban estados explícitos y aislamiento.
4. Una compra cancelada o pendiente no debe acreditar gemas ni mostrar un error falso; Tasks 7 y 8 prueban ambos estados y la idempotencia del webhook.
5. Rechazar push debe conservar la app operativa y no provocar solicitudes repetidas; Task 6 prueba la denegación y la inicialización sin prompt.

---

## Checklist acumulativo solicitado

Estas casillas se van sumando durante la preparación y solo se marcan al adjuntar la evidencia indicada; que el código “parezca correcto” no equivale a `PASS`.

- [ ] **`userInterfaceStyle` fijado en `light` (o modo oscuro probado al 100%).**
  - Owner: Tasks 2 y 12.
  - Evidencia: `UIUserInterfaceStyle=Light` en config nativa, store visual sin `Appearance`, screenshots equivalentes con iPhone Light/Dark y teclado/status bar claros.
- [ ] **`SafeAreaView` configurado en Paywall y pantallas principales.**
  - Owner: Tasks 11 y 12.
  - Estado detectado: Horizon ya usa `edges={['top','bottom']}`; navegación principal protege bottom; Hoy, Senderos, Insights, Tienda y Perfil ya usan `SafeAreaView` o `useSafeAreaInsets`, pero falta validación física completa.
  - Evidencia: capturas sin contenido bajo Dynamic Island/notch/home indicator en iPhone SE y iPhone con Dynamic Island; CTA de compra/restauración y tab bar tocables.
- [ ] **Teclado no tapa botones de acción.**
  - Owner: Task 2A, Task 11 y Task 12.
  - Estado detectado: **FAIL confirmado en Android.** El wizard desactiva `KeyboardAvoidingView` en Android (`behavior={undefined}`), mantiene el CTA en un footer fijo fuera del `ScrollView` y trata de compensarlo con `paddingBottom` calculado desde el teclado. Aunque Android ya usa `adjustResize`, esta combinación no garantiza que el input enfocado ni el CTA queden visibles dentro de un `Modal`.
  - Evidencia: video en Android pequeño y iPhone SE con teclado abierto mostrando y pulsando Login, Crear cuenta, Verificar OTP, Recuperar, cada input de Meta/Horario, Continuar/Crear hábito y Enviar de Aby; sin cerrar el teclado manualmente.
- [ ] **App Store Connect: Cuestionario de Privacidad completado (`Tracking = No`).**
  - Owner: Task 11.
  - Evidencia: respuestas publicadas y comparadas con `docs/app-store/privacy-inventory.md`; Supabase, OneSignal y RevenueCat declarados; `NSUserTrackingUsageDescription` ausente.
- [ ] **App Store Connect: Clasificación de edad respondida.**
  - Owner: Tasks 11 y 12.
  - Evidencia: cuestionario completado honestamente, rating resultante guardado en el checklist y metadata sin lenguaje “For Kids” ni claims médicos.
- [ ] **Notas para el revisor escritas con usuario y contraseña demo.**
  - Owner: Tasks 11 y 12.
  - Evidencia: `review-notes-en.md` pegado; credenciales válidas solo en campos seguros de App Review; cuenta demo confirmada, sin OTP obligatorio y con datos sembrados.
- [ ] **Entorno `production` de EAS completo y verificado dentro del artefacto Release.**
  - Owner: Task 2B y Task 12.
  - Evidencia: `eas.json` selecciona explícitamente `environment: production`; el validador falla si falta una variable pública; smoke test desde el IPA/APK instalado confirma Supabase, RevenueCat y Aby remoto sin imprimir valores.
- [ ] **Secretos del backend fuera de EAS, Xcode, Git y bundles.**
  - Owner: Task 2B y Task 12.
  - Regla: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REVENUECAT_WEBHOOK_SECRET`, `ONESIGNAL_REST_API_KEY` y `SCHEDULER_SECRET` viven exclusivamente en Supabase Secrets/backend. EAS nunca recibe estas claves.
  - Evidencia: listado de nombres con `supabase secrets list`, escaneo de repo/IPA/APK sin valores ni patrones de secret/service-role y llamadas autenticadas a las Edge Functions.
- [ ] **Paywall listo para revisión.**
  - Owner: Tasks 8, 11 y 12.
  - Evidencia: precio/duración localizados, renovación automática, beneficios, Términos, Privacidad, Gestionar suscripción y Restaurar funcional; video de compra y restauración sandbox.
- [ ] **IAP y Horizon adjuntos a la primera submission.**
  - Owner: Task 12.
  - Evidencia: captura de la submission con app + productos, todos `Ready for Review`, sin `Missing Metadata`.
- [ ] **Cero placeholders, “Próximamente”, acciones muertas o enlaces rotos.**
  - Owner: Tasks 11 y 12.
  - Evidencia: búsqueda estática, recorrido manual completo y todas las URLs públicas con HTTP 200 desde una red externa.
- [ ] **`Info.plist` y prompts contienen motivos claros y localizados para cada permiso realmente usado.**
  - Owner: Tasks 2, 6, 11 y 12.
  - Evidencia: config iOS efectiva + prompts ES/EN capturados; capacidades no usadas eliminadas.
- [ ] **Eliminar cuenta borra realmente la identidad y datos asociados desde la app.**
  - Owner: Task 10 y Task 12.
  - Evidencia: cuenta desechable ausente de `auth.users` y tablas propias tras confirmar; no es logout ni correo a soporte.
- [ ] **Compatibilidad IPv6 DNS64/NAT64 y red celular estricta.**
  - Owner: Task 2B y Task 12.
  - Evidencia: cero endpoints IPv4/localhost en bundle; login, sincronización, Aby, compras y enlaces funcionan en una red IPv6-only real con datos celulares apagados.

---

## Matriz preventiva de rechazo de App Review

Ningún plan puede garantizar aprobación porque App Review incluye revisión humana y las reglas evolucionan. Esta matriz convierte las causas más probables para Lestinaty en gates verificables de **NO ENVIAR**. Una fila sin evidencia `PASS` bloquea la presentación.

| Prioridad | Causa probable de rechazo | Regla Apple | Blindaje previo al envío | Evidencia o respuesta preparada |
|---|---|---|---|---|
| P0 | Crash, pantalla congelada, backend apagado, enlaces rotos o función incompleta | 2.1 App Completeness | Cold start 20 veces; red normal/lenta/sin red; cuenta nueva y existente; todos los enlaces HTTPS responden 200; ninguna pantalla depende de mocks/placeholders | Video corto, modelo/versión de iPhone, build y pasos reproducibles |
| P0 | El build Release arranca sin variables o apunta accidentalmente a desarrollo | 2.1 App Completeness | `environment: production` explícito; validación build-time; sin fallbacks hardcodeados; smoke del binario contra backend productivo | Log sin valores sensibles + ID del build + prueba de login/sync/Aby/IAP |
| P0 | Gemini/service role/webhook secret queda incluido en el binario | 5.1.1 Data Collection and Storage | Secretos solo en Supabase Edge Functions; allowlist estricta de variables cliente; escaneo del IPA/APK y repositorio | Reporte de nombres permitidos y búsqueda negativa de patrones secretos |
| P0 | El teclado tapa inputs o botones del wizard/login en Android o iPhone pequeño | 2.1 App Completeness | Task 2A unifica resize, scroll, safe area y footer; matriz física con teclado abierto sin cerrar manualmente | Video de creación completa de hábito y autenticación en ambos dispositivos |
| P0 | El revisor no puede entrar por OTP o no encuentra contenido suficiente | 2.1 App Completeness | Cuenta demo confirmada con contraseña, hábitos/avance/gemas sembrados y sin OTP obligatorio; segunda cuenta desechable para probar eliminación | Credenciales solo en los campos seguros de App Review, instrucciones y video adjunto |
| P0 | “Eliminar cuenta” solo cierra sesión o crea una solicitud que nunca se procesa | 5.1.1(v) Account Sign-In | Task 10 demuestra borrado real de `auth.users` y datos asociados; el usuario ve plazo/resultado y advertencia de suscripción | Captura del flujo, prueba remota antes/después y nota de tratamiento de suscripciones |
| P0 | Gemas/Horizon desbloquean contenido digital por pago externo o producto IAP incompleto | 3.1.1 y 3.1.2 | Solo StoreKit/RevenueCat; sin CTA web; IDs, precio, localización, capturas y estado Ready for Review; primer IAP enviado con la app | Pasos exactos para abrir Tienda/Horizon y compra sandbox comprobada |
| P0 | Compra, restauración o webhook no funciona durante review | 2.1 y 3.1 | Sandbox completa/cancelada/pendiente; restauración Horizon; webhook idempotente; backend activo; ninguna gema se acredita localmente | Video de compra/restauración y descripción del retraso esperado del webhook |
| P0 | Privacy Nutrition Labels no coinciden con Supabase, OneSignal o RevenueCat | 5.1.1 | Inventario de datos por SDK, finalidad, vínculo con identidad y retención; política web e in-app idéntica a la declaración de App Store Connect | `docs/app-store/privacy-inventory.md` firmado contra el build final |
| P0 | Privacy Manifest o required-reason API ausente/inválida | Requisitos de SDKs de terceros y privacidad | Validar warnings del archive/upload, firmas de SDK y todos los `PrivacyInfo.xcprivacy`; cero warning pendiente antes de enviar | Log de validación de App Store Connect y lista de manifests incluidos |
| P0 | Google aparece o su SDK queda enlazado en iOS sin Sign in with Apple | 4.8 Login Services | Google oculto y no autolinked; iOS ofrece solo email; buscar botón, copy y módulo en binario/config final | Review Notes explican “email/password only on iOS”; evidencia de autolinking |
| P1 | Suscripción Horizon no explica precio, duración, auto-renovación, beneficios o cancelación | 3.1.2(c) | Paywall muestra nombre, duración mensual, precio localizado, renovación automática, restaurar, privacidad, términos y gestionar suscripción | Captura del paywall y rutas a privacidad/términos probadas |
| P1 | Notificaciones son obligatorias, se piden al inicio o revelan hábitos sensibles | 4.5.4 Push Notifications | La app funciona sin permiso; prompt contextual; título genérico por defecto; nombre del hábito solo con opt-in; control de desactivación accesible | Video aceptando/negando permiso y payload genérico inspeccionado |
| P1 | Metadata/screenshots prometen funciones ausentes o muestran Android/widgets/Google | 2.3 Accurate Metadata | Capturas tomadas del build iOS final; sin barra Android, widgets, Google Play, precios escritos ni claims médicos/no verificables | Checklist visual EN/ES y comparación pantalla↔captura |
| P1 | El iPhone está en Dark Mode y cambia fondos, textos, teclado o controles, causando contraste roto | 2.1 App Completeness y 2.4.2 | `userInterfaceStyle=light` global+iOS, `UIUserInterfaceStyle=Light` verificado, store visual sin `Appearance`, status bar/teclado claros y prueba física cambiando el sistema | Capturas light-vs-system-dark idénticas y diff visual aprobado |
| P1 | Política de privacidad ausente, inaccesible o sin retención/eliminación/terceros | 5.1.1(i) | URL pública y acceso dentro de Perfil; describe datos, usos, Supabase/OneSignal/RevenueCat, retención, revocación y borrado | `curl` 200 desde red externa y captura del enlace in-app |
| P1 | Login obligatorio sin razón suficiente | 5.1.1(v) | Review Notes explican que la cuenta mantiene hábitos, progreso, Senderos, saldo y compras entre dispositivos; no se exige información ajena al servicio | Cuenta demo y recorrido que demuestra las funciones persistentes |
| P1 | Backend inaccesible en la red IPv6-only del revisor | 2.1 App Completeness | Solo HTTPS con hostnames; sin IP numérica, localhost ni síntesis manual IPv6; prueba DNS64/NAT64 en iPhone físico | Video y checklist de login, Supabase, Aby, RevenueCat y links legales en IPv6-only |
| P1 | La moneda comprada expira o la restauración se presenta de forma engañosa | 3.1.1 | Gemas no expiran; el saldo de consumibles se conserva en la cuenta/backend; “Restaurar” se usa para Horizon/restaurables, no promete restaurar consumibles agotados | Test de saldo tras reinstalar/iniciar sesión y copy específico |
| P1 | Primera IAP no se envía junto con la primera versión | Flujo App Store Connect IAP | Agregar gemas y Horizon como items de la misma submission inicial y verificar todos los estados antes de Submit for Review | Captura de la submission con app + IAP + suscripción |
| P1 | Caja/cofre parece loot box comprable sin probabilidades | 3.1.1 | Demostrar que cofres aleatorios se ganan por hábitos y no se compran ni consumen gemas; si alguna recompensa aleatoria se paga, mostrar probabilidades antes de comprar o retirarla de iOS | Nota explícita de economía y captura del flujo gratuito |
| P2 | App parece web wrapper, plantilla o utilidad mínima | 4.2 Minimum Functionality | Review Notes y video muestran Senderos, progresión procedural, hábitos, insights, temas y experiencia Skia nativa | Recorrido de 60–90 s de valor nativo real |
| P2 | Rendimiento, batería, memoria o animación infinita | 2.4.2 Hardware Compatibility | Instruments/TestFlight: navegación repetida, libro/mapas, background/foreground y 30 min de uso; sin loop sostenido ni calentamiento anormal | Métricas y dispositivo/OS anotados en checklist |
| P2 | Permiso sin purpose string o permiso pedido sin contexto | 5.1 Privacy | Auditar cámara/fotos/notificaciones; purpose strings específicos; eliminar capacidad no usada; pedir cada permiso justo antes de la función | `app.config` final y capturas de prompts con contexto |
| P2 | Icono, screenshots, edad, descripción, contacto, URLs o derechos incompletos | 2.1, 2.3 y App Store Connect | Icono 1024 sin alpha; rating honesto; soporte/contacto activos; assets propios/licenciados; URLs públicas; export compliance respondido | Checklist de metadata firmado antes del submit |
| P2 | Claims de salud/meditación que parezcan diagnóstico o resultado garantizado | 1.4 y 2.3 | Copy de bienestar/hábitos, nunca tratamiento, diagnóstico, curación o resultado garantizado; revisar ES/EN y metadata | Búsqueda estática de términos y revisión humana de ficha |

### Regla de contingencia sin engañar a Review

- Si IAP no está Ready for Review, crear un nuevo build que oculte Tienda/Horizon y retirar toda promesa/captura asociada; nunca enviar botones rotos ni cambiar el comportamiento remotamente durante la revisión.
- Si APNs/OneSignal no está listo, crear un nuevo build que oculte recordatorios push en iOS; el núcleo de hábitos debe seguir funcionando sin notificaciones.
- Si Google→email no conserva identidad, mantener Google visible y detener iOS hasta resolver Google + Apple o una migración segura.
- Si el borrado real no está probado, no enviar la app aunque el botón exista.
- Si Apple rechaza un item IAP pero acepta el binario, solo retirarlo de la submission si el binario no expone esa compra; de lo contrario subir un build corregido.

### Fuentes oficiales de control

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Review: preparación y acceso para revisión](https://developer.apple.com/app-store/review/)
- [Eliminación de cuentas dentro de la app](https://developer.apple.com/support/offering-account-deletion-in-your-app)
- [Privacidad en App Store Connect](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Requisitos de SDKs de terceros y privacy manifests](https://developer.apple.com/support/third-party-SDK-requirements/)
- [Configuración y primera presentación de In-App Purchases](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)
- [Gestión de una submission con issues](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/manage-a-submission-with-unresolved-issues)
- [Expo: configuración de temas y `userInterfaceStyle`](https://docs.expo.dev/develop/user-interface/color-themes/)
- [Apple: compatibilidad con redes IPv6-only](https://developer.apple.com/support/ipv6/)
- [Expo: variables de entorno en EAS](https://docs.expo.dev/eas/environment-variables/usage/)
- [Supabase: claves públicas y secretas](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Edge Functions: secretos](https://supabase.com/docs/guides/functions/secrets)

---

## Mapa de archivos y responsabilidades

### Nuevos archivos compartidos

- `app.config.ts`: extiende `app.json` y selecciona el modo OneSignal según `EAS_BUILD_PROFILE`.
- `src/plataforma/capacidades.ts`: matriz pura de funciones disponibles por plataforma.
- `src/plataforma/inicializarPlataforma.ts`: arranque tolerante a fallos de Google, compras y notificaciones.
- `src/plataforma/autenticacion/google.android.ts`: único archivo que importa el SDK de Google.
- `src/plataforma/autenticacion/google.ts`: implementación no disponible para iOS/web.
- `src/plataforma/compras/contrato.ts`: tipos propios de catálogo, compra, restauración y estado de integración.
- `src/plataforma/compras/cliente.native.ts`: único cliente que importa `react-native-purchases`.
- `src/plataforma/compras/cliente.web.ts`: cliente explícitamente no disponible.
- `src/plataforma/notificaciones/contrato.ts`: estados de inicialización y permiso.
- `src/plataforma/notificaciones/cliente.native.ts`: único cliente que importa `react-native-onesignal`.
- `src/plataforma/notificaciones/cliente.web.ts`: cliente explícitamente no disponible.
- `src/plataforma/widgets/registrar.android.ts`: registro headless de widgets Android.
- `src/plataforma/widgets/registrar.ts`: no-op para iOS/web.

### Compatibilidad temporal

- `src/nucleo/compras/revenueCat.ts`, `src/nucleo/compras/horizon.ts` y `src/nucleo/notificaciones/oneSignal.ts` reexportan los contratos nuevos para evitar un cambio masivo de imports.
- Los servicios de widgets se separan en variantes `.android.tsx` y `.ts`; la variante base nunca importa `react-native-android-widget` ni el módulo Expo Android.
- `index.ts` y `app/_layout.tsx` solo llaman fachadas comunes.

### Persistencia y backend

- `supabase/migrations/20260923_48_notificaciones_ios.sql`: permite reclamar recordatorios para dispositivos iOS y Android.
- `supabase/migrations/20260923_49_productos_iap_plataforma.sql`: separa el paquete lógico de sus identificadores App Store/Play Store.
- `supabase/tests/07_notificaciones_ios.sql`: smoke SQL de dispositivo iOS y recordatorio reclamado.
- `supabase/tests/08_productos_iap_plataforma.sql`: catálogo por plataforma, unicidad e idempotencia.
- `supabase/functions/recibir-webhook-revenuecat/index.ts`: resuelve el producto desde la tabla hija.

## Task 1: Gate bloqueante de identidad Google → email

**Files:**
- Verify only: `src/modulos/acceso/acceso.servicio.ts`
- Verify only: `src/modulos/acceso/pantallas/RecuperarAccesoPantalla.tsx`
- Verify only: Supabase Auth y datos remotos de la cuenta desechable

**Interfaces:**
- Consumes: flujo actual `recuperarAcceso(email)`, `verificarRecuperacionConOtp(email, token)` y `actualizarContrasenaRecuperada(password)`.
- Produces: evidencia de que el mismo `auth.uid()` funciona con Google y contraseña; autorización técnica para continuar con Task 2.

- [ ] **Step 1: Crear el estado previo del gate**

En el build Android actual, iniciar sesión con una cuenta Google real desechable, crear un hábito llamado `Gate iOS`, registrar un avance, anotar el saldo de gemas y consultar el usuario en Supabase SQL Editor usando ese hábito como identificador no sensible:

```sql
select distinct usuario.id, usuario.email, usuario.raw_app_meta_data -> 'providers' as providers
from auth.users usuario
join public.habitos_items habito on habito.usuario_id = usuario.id
where habito.titulo = 'Gate iOS';
```

Expected: exactamente una fila y `providers` contiene `google`. Guardar fuera del repositorio el UUID, el saldo, el hábito y el estado Horizon.

- [ ] **Step 2: Ejecutar la recuperación existente**

Cerrar sesión. Desde `/(publico)/recuperar-acceso`, enviar el OTP al mismo correo Google, verificarlo, establecer una contraseña nueva y entrar con email/contraseña.

Expected: se obtiene una sesión válida y no se crea una segunda fila en Auth Users.

- [ ] **Step 3: Verificar la identidad y los datos**

Comparar en Supabase Auth el UUID posterior con el UUID previo y comprobar en la app que siguen presentes `Gate iOS`, su avance, el mismo saldo y el mismo estado Horizon.

Expected: UUID y cuatro conjuntos de datos idénticos. Si cambia el UUID o falta cualquier dato, detener el plan aquí; no ejecutar Task 2 ni excluir Google de iOS.

- [ ] **Step 4: Registrar evidencia del gate sin datos personales**

Agregar al registro de ejecución del plan una línea con fecha, build Android usado y resultado `PASS`, sin correo, UUID, OTP ni contraseña. Esta tarea no crea commit.

## Task 2: Llevar Expo SDK 57 a una base limpia y reproducible

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app.json`
- Create: `app.config.ts`
- Modify: `eas.json`
- Modify: `app/_layout.tsx`
- Modify: `src/diseno/tema/ui.ts`
- Create: `src/diseno/tema/ui.test.ts`
- Modify: `src/diseno/componentes/CampoTexto.tsx`
- Modify: `src/diseno/componentes/CampoContrasena.tsx`
- Modify: `src/modulos/acceso/componentes/CampoOtp.tsx`
- Modify: `src/modulos/aby/componentes/CreadorExamenAby.tsx`
- Modify: `src/modulos/aby/componentes/EntradaAby.tsx`
- Modify: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Modify: `src/modulos/senderos/motor/sdui/widgets/WidgetRegistro.tsx`

**Interfaces:**
- Consumes: gate PASS de Task 1 y variables `EAS_BUILD_PROFILE`, `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`, `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`.
- Produces: configuración Expo válida, dependencias alineadas y perfiles `development`, `ios-simulator`, `preview`, `production`.

- [ ] **Step 1: Capturar el baseline antes de modificar dependencias**

Run:

```bash
npx expo-doctor
npm test -- --run
npm run typecheck
npx expo export --platform ios --output-dir /tmp/lestinaty-ios-baseline
```

Expected: Expo Doctor reproduce los 4 grupos ya identificados (config inválida, `expo-constants`, `expo-modules-core`, versiones); el export iOS completa. Guardar cualquier fallo adicional como regresión preexistente, no corregir módulos ajenos.

- [ ] **Step 2: Alinear dependencias con el SDK instalado**

Run:

```bash
npx expo install --fix
npx expo install expo-constants expo-system-ui
npm uninstall expo-modules-core
```

Expected: `package.json` mantiene `expo` en SDK 57, añade `expo-constants`/`expo-system-ui`, elimina la dependencia raíz directa `expo-modules-core` y alinea React Native, Router, AsyncStorage, Skia y módulos Expo a la matriz que resuelva SDK 57.

- [ ] **Step 3: Añadir exclusión iOS exacta para Google**

Agregar a la raíz de `package.json` sin alterar scripts:

```json
"expo": {
  "autolinking": {
    "ios": {
      "exclude": ["@react-native-google-signin/google-signin"]
    }
  }
}
```

No crear `react-native.config.js`.

- [ ] **Step 4: Corregir app config y perfiles EAS**

Eliminar `newArchEnabled` de `app.json`. Como esta entrega se valida y publica solo para iPhone, fijar `ios.supportsTablet = false` para no declarar compatibilidad iPad sin una matriz de QA. Mantener `userInterfaceStyle = "light"`, duplicar la intención de forma explícita con `ios.userInterfaceStyle = "light"`, fijar `backgroundColor = "#FFFFFF"` y añadir `ios.infoPlist.ITSAppUsesNonExemptEncryption = false`. No escribir manualmente `UIUserInterfaceStyle`: Expo debe generarlo desde la propiedad tipada y la verificación posterior comprueba que resulte `Light`.

```json
{
  "expo": {
    "backgroundColor": "#FFFFFF",
    "userInterfaceStyle": "light",
    "ios": {
      "backgroundColor": "#FFFFFF",
      "supportsTablet": false,
      "userInterfaceStyle": "light",
      "infoPlist": { "ITSAppUsesNonExemptEncryption": false }
    }
  }
}
```

Crear `app.config.ts` con configuración dinámica y sin copiar el contenido estático:

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const perfil = process.env.EAS_BUILD_PROFILE ?? 'development';
  const produccion = perfil === 'production' || perfil === 'preview';
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'onesignal-expo-plugin') {
      return ['onesignal-expo-plugin', { disableLocation: true, mode: produccion ? 'production' : 'development' }];
    }
    return plugin;
  });

  return { ...config, plugins } as ExpoConfig;
};
```

Añadir a `eas.json`:

```json
"ios-simulator": {
  "extends": "development",
  "ios": { "simulator": true }
}
```

- [ ] **Step 5: Bloquear también el tema dentro de React Native**

Escribir primero `ui.test.ts` mockeando `Appearance.getColorScheme()` como `dark` y afirmando que el store sigue en `light`. Después eliminar la lectura de `Appearance` en `ui.ts` y construir siempre el estado inicial claro:

```ts
const MODO_UI_FIJO: ModoUI = 'light';

export const usarTemaUI = create<TemaUIState>((set) => ({
  modo: MODO_UI_FIJO,
  colores: crearColoresUI(MODO_UI_FIJO),
  establecerModo: () => set({ modo: MODO_UI_FIJO, colores: crearColoresUI(MODO_UI_FIJO) }),
}));
```

En el layout raíz renderizar `<StatusBar style="dark" />` de `expo-status-bar`. Añadir `keyboardAppearance="light"` a los siete `TextInput` reales listados en **Files**, para que el teclado no siga el modo oscuro del teléfono aunque la aplicación sea clara.

Run:

```bash
npx vitest run src/diseno/tema/ui.test.ts
rg -n "useColorScheme|Appearance\.getColorScheme|DynamicColorIOS|PlatformColor" app src
```

Expected: test PASS y la búsqueda no encuentra decisiones visuales dependientes del modo del sistema. Los usos de nombres de iconos o texto no cuentan como APIs de tema.

- [ ] **Step 6: Verificar la configuración nativa generada**

Run:

```bash
npx expo config --type introspect
npx expo config --type introspect | rg -A 2 "UIUserInterfaceStyle|userInterfaceStyle"
```

Expected: la configuración iOS efectiva contiene `UIUserInterfaceStyle` con valor `Light`; nunca `Automatic` ni `Dark`.

- [ ] **Step 7: Verificar la base completa**

Run:

```bash
npx expo config --type public
npx expo-doctor
npm test -- --run
npm run typecheck
npx expo export --platform ios --output-dir /tmp/lestinaty-ios-deps
npx expo export --platform android --output-dir /tmp/lestinaty-android-deps
```

Expected: config resuelta para `com.lestinaty.app`, tema claro efectivo, Expo Doctor sin los 4 fallos conocidos, tests/typecheck sin regresiones y ambos exports completos.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json app.json app.config.ts eas.json app/_layout.tsx src/diseno/tema/ui.ts src/diseno/tema/ui.test.ts src/diseno/componentes/CampoTexto.tsx src/diseno/componentes/CampoContrasena.tsx src/modulos/acceso/componentes/CampoOtp.tsx src/modulos/aby/componentes/CreadorExamenAby.tsx src/modulos/aby/componentes/EntradaAby.tsx src/modulos/habitos/componentes/CrearHabitoWizard.tsx src/modulos/senderos/motor/sdui/widgets/WidgetRegistro.tsx
git commit -m "chore: alinear base Expo para iOS"
```

## Task 2A: Corregir el teclado Android del wizard y blindar todos los formularios

**Files:**
- Modify: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Create: `src/modulos/habitos/componentes/layoutTecladoWizard.ts`
- Create: `src/modulos/habitos/componentes/layoutTecladoWizard.test.ts`
- Verify/modify: `src/modulos/acceso/componentes/PantallaAcceso.tsx`
- Verify/modify: `src/modulos/onboarding/pantallas/IntroduccionAppPantalla.tsx`
- Verify/modify: `src/modulos/onboarding/pantallas/AccesoOnboardingPantalla.tsx`
- Verify/modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`

**Root cause confirmado:** Android ya genera `windowSoftInputMode="adjustResize"`, pero el wizard usa `KeyboardAvoidingView` solamente en iOS. Dentro del `Modal`, su CTA vive en un footer fijo fuera del `ScrollView`; el listener añade al contenido hasta `altoTeclado + 40` de padding, pero no reposiciona ese footer ni asegura que el campo enfocado entre en el viewport. Mantener simultáneamente resize nativo y compensación total manual también puede crear doble espacio según el teclado/fabricante.

**Interfaces:**
- Consumes: eventos del teclado, safe-area bottom, viewport del `Modal` y refs de los campos.
- Produces: una única estrategia por plataforma que mantiene campo enfocado y CTA visibles, sin saltos ni padding duplicado.

- [ ] **Step 1: Capturar la regresión antes de cambiar código**

En un Android físico pequeño grabar los pasos 1, 2, 4 y cualquier campo inferior del wizard con Gboard abierto. Registrar versión Android, navegación gestual/botones, altura de pantalla y si el CTA/input queda tapado. Repetir con teclado flotante y orientación vertical; la app permanece bloqueada en portrait.

Expected: el video reproduce al menos un input o CTA cubierto y confirma que el problema ocurre con `adjustResize`, no por `adjustPan`.

- [ ] **Step 2: Escribir primero la prueba del contrato de layout**

Extraer una función pura que defina comportamiento, offset y padding mínimo sin sumar dos veces la altura completa del teclado. Probar Android/iOS, teclado oculto/visible y safe-area 0/>0. El test también exige que el footer forme parte del área evitada y que `keyboardShouldPersistTaps` permanezca en `handled`.

Run:

```bash
npx vitest run src/modulos/habitos/componentes/layoutTecladoWizard.test.ts
```

Expected: FAIL antes de implementar el contrato.

- [ ] **Step 3: Aplicar una sola estrategia de evitación dentro del Modal**

Envolver contenido desplazable **y footer** en el mismo contenedor afectado por el teclado. En Android usar la estrategia compatible con `adjustResize` y la versión actual de React Native; retirar `altoTeclado` como padding completo si duplica el resize. Mantener un padding inferior estable compuesto por footer + safe area, y desplazar el campo real enfocado con `measureLayout`/`scrollTo` en vez de enviar siempre el scroll al final. No ocultar el CTA para “resolver” el solapamiento.

Cada `TextInput` del wizard debe incluir `keyboardAppearance="light"`, `returnKeyType` apropiado y una acción de siguiente/cerrar donde aplique. Conservar animaciones visuales, semillas, nodos y lógica de creación sin cambios.

Expected: campo enfocado y CTA quedan visibles a la vez o alcanzables con un único scroll; no aparece un vacío del alto de dos teclados.

- [ ] **Step 4: Auditar los demás formularios con el mismo criterio**

Probar login, registro, recuperación, OTP y Aby. Corregir solo pantallas que fallen, conservando una estrategia única por pantalla: safe area + keyboard avoidance + scroll, sin offsets mágicos dependientes del modelo.

Run:

```bash
npx vitest run src/modulos/habitos/componentes/layoutTecladoWizard.test.ts
npm run typecheck
```

Expected: tests y typecheck PASS.

- [ ] **Step 5: Gate físico Android + iOS**

En Android pequeño y iPhone SE: enfocar el primer y último campo, abrir/cerrar teclado diez veces, navegar hacia adelante/atrás, activar hora personalizada, provocar errores y pulsar cada CTA con el teclado abierto. Repetir con navegación gestual y botones en Android.

Expected: cero inputs/CTA cubiertos, cero saltos acumulativos, cero zona gris, foco estable y ningún cambio funcional en el hábito creado.

- [ ] **Step 6: Commit acotado**

```bash
git add src/modulos/habitos/componentes/CrearHabitoWizard.tsx src/modulos/habitos/componentes/layoutTecladoWizard.ts src/modulos/habitos/componentes/layoutTecladoWizard.test.ts src/modulos/acceso/componentes/PantallaAcceso.tsx src/modulos/onboarding/pantallas/IntroduccionAppPantalla.tsx src/modulos/onboarding/pantallas/AccesoOnboardingPantalla.tsx src/modulos/aby/pantallas/AgenteAbyPantalla.tsx
git commit -m "fix: mantener formularios visibles sobre el teclado"
```

## Task 2B: Blindar variables de producción, secretos y redes IPv6-only

**Files:**
- Modify: `eas.json`
- Modify: `app.config.ts`
- Modify: `.env.example`
- Modify: `src/nucleo/configuracion/entorno.ts`
- Create: `scripts/validar-entorno-release.mjs`
- Create: `src/nucleo/configuracion/entorno.test.ts`
- Create: `docs/release/environment-inventory.md`
- Create: `docs/release/network-checklist.md`

**Estado detectado:** el cliente ya lee variables sin fallbacks de valor y `supabase.ts` falla explícitamente si faltan URL/clave. `GEMINI_API_KEY` y las credenciales privilegiadas se consumen en Edge Functions, no en `src/`. No se encontraron endpoints de aplicación con IP numérica, `localhost` ni HTTP plano. `eas.json` todavía no fija `environment: production` ni valida las variables requeridas.

**Límite de seguridad:** una app móvil no puede guardar secretos. Todo valor `EXPO_PUBLIC_*` queda embebido y es legible por el usuario. Supabase URL + publishable/anon son públicas y su seguridad depende de RLS. `GEMINI_API_KEY`, secret/service-role, webhook, scheduler y OneSignal REST key solo viven en Supabase/backend.

- [ ] **Step 1: Crear inventario por dueño y superficie**

Documentar solo nombres, nunca valores:

```text
EAS/client production:
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY (migrar a publishable cuando se programe)
  EXPO_PUBLIC_REVENUECAT_APPLE_KEY
  EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY (Android únicamente)
  EXPO_PUBLIC_ABY_REMOTO
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Android únicamente)

Supabase Edge Functions/backend only:
  GEMINI_API_KEY
  SUPABASE_SERVICE_ROLE_KEY / futura secret key
  REVENUECAT_WEBHOOK_SECRET
  ONESIGNAL_REST_API_KEY
  SCHEDULER_SECRET
```

Expected: ninguna clave backend aparece en EAS, Xcode, `.env.example`, React Native ni documentación versionada.

- [ ] **Step 2: Hacer determinista el entorno de EAS**

Añadir `"environment": "production"` al perfil `build.production`; asignar explícitamente `development` y `preview` a sus perfiles. Configurar los valores desde EAS Environment Variables, no dentro de `eas.json`. Mantener las variables públicas con visibilidad adecuada y recordar que `sensitive` no las vuelve secretas una vez incluidas en el bundle.

Run:

```bash
eas env:list --environment production
```

Expected: están todos los nombres públicos requeridos, sin nombres de secretos backend y sin imprimir valores en evidencias.

- [ ] **Step 3: Fallar temprano cuando Release está mal configurado**

`validar-entorno-release.mjs` y `app.config.ts` deben validar presencia y formato sin mostrar valores: URL HTTPS con hostname (no IP/localhost), clave pública Supabase, clave RevenueCat de la plataforma y `EXPO_PUBLIC_ABY_REMOTO=true` si Aby se ofrece. Usar `EAS_BUILD_PLATFORM` para no exigir la clave Google/Android en iOS. No utilizar `NODE_ENV` como selector.

Run:

```bash
node scripts/validar-entorno-release.mjs
npx vitest run src/nucleo/configuracion/entorno.test.ts
```

Expected: con una variable omitida el proceso falla antes de compilar y solo imprime su nombre; con el entorno completo pasa sin volcar valores.

- [ ] **Step 4: Configurar y comprobar secretos de Edge Functions**

Configurar Gemini y secretos propios con Supabase Secrets. Los secretos Supabase predeterminados se consumen únicamente dentro de Functions. Verificar nombres y desplegar las funciones necesarias; nunca copiar service-role/secret key a EAS.

Run (sin valores en logs):

```bash
supabase secrets list
supabase functions list
```

Después, desde dos usuarios de prueba, ejecutar un smoke autenticado de Aby, aceptación de propuesta y lectura/escritura normal para confirmar RLS. Probar que un usuario no puede leer/modificar datos del otro.

Expected: Edge Functions responden, Gemini funciona en producción y las políticas RLS aíslan usuarios.

- [ ] **Step 5: Escanear código y artefactos**

Buscar IPs numéricas, localhost, HTTP plano, prefijos de secret/service-role y archivos de credenciales en Git, bundle exportado, IPA y APK. Mantener allowlist solo para esquemas XML internos que no sean conexiones de red.

```bash
git ls-files | rg -i "(^|/)(\.env($|\.)|.*\.p8$|.*service.*account.*\.json$)"
rg -n "https?://([0-9]{1,3}\.){3}[0-9]{1,3}|localhost|127\.0\.0\.1|SUPABASE_SERVICE_ROLE_KEY|GEMINI_API_KEY" src app modules
```

Expected: ninguna credencial/endpoint inválido en el cliente. Las únicas menciones a nombres de secretos están en backend/documentación sin valores.

- [ ] **Step 6: Gate real DNS64/NAT64 y red celular**

Crear una red IPv6-only según Apple, desactivar datos celulares del iPhone e instalar el mismo build candidato. Probar cold start, login, refresh de sesión, crear/completar hábito, Senderos, Aby, catálogo/compra sandbox, restauración, push y URLs legales. Probar además red lenta, pérdida de red y recuperación sin reiniciar.

Expected: todos los hostnames resuelven mediante DNS64/NAT64, no hay spinner infinito/crash y cada fallo de red muestra reintento accionable.

- [ ] **Step 7: Verificar el binario, no el `.env` local**

Instalar IPA/APK Release generado por EAS con `production`, arrancar sin Metro y ejecutar smoke de backend. Registrar build ID y resultado sin capturas de claves. Cambiar una variable requiere un nuevo build/update del entorno correcto; nunca asumir que editar `.env` modifica un binario existente.

- [ ] **Step 8: Commit acotado**

```bash
git add eas.json app.config.ts .env.example src/nucleo/configuracion/entorno.ts src/nucleo/configuracion/entorno.test.ts scripts/validar-entorno-release.mjs docs/release/environment-inventory.md docs/release/network-checklist.md
git commit -m "chore: validar entorno y red de produccion"
```

## Task 3: Matriz de capacidades por plataforma

**Files:**
- Create: `src/plataforma/capacidades.ts`
- Create: `src/plataforma/capacidades.test.ts`

**Interfaces:**
- Consumes: `Platform.OS`.
- Produces: `resolverCapacidades(plataforma)` y la constante síncrona `capacidades`.

- [ ] **Step 1: Escribir tests fallidos de la matriz de capacidades**

```ts
import { describe, expect, it } from 'vitest';
import { resolverCapacidades } from './capacidades';

describe('capacidades por plataforma', () => {
  it('habilita integraciones nativas sin widgets en iOS', () => {
    expect(resolverCapacidades('ios')).toEqual({ googleSignIn: false, comprasNativas: true, notificacionesPush: true, widgets: false });
  });
  it('conserva todas las capacidades Android', () => {
    expect(resolverCapacidades('android')).toEqual({ googleSignIn: true, comprasNativas: true, notificacionesPush: true, widgets: true });
  });
  it('desactiva binarios nativos en web', () => {
    expect(resolverCapacidades('web')).toEqual({ googleSignIn: false, comprasNativas: false, notificacionesPush: false, widgets: false });
  });
});
```

Run: `npx vitest run src/plataforma/capacidades.test.ts`

Expected: FAIL porque el módulo todavía no existe.

- [ ] **Step 2: Implementar la matriz pura**

```ts
import { Platform } from 'react-native';

export type PlataformaSoportada = 'ios' | 'android' | 'web';
export type CapacidadesPlataforma = { googleSignIn: boolean; comprasNativas: boolean; notificacionesPush: boolean; widgets: boolean };

export function resolverCapacidades(plataforma: PlataformaSoportada): CapacidadesPlataforma {
  return {
    googleSignIn: plataforma === 'android',
    comprasNativas: plataforma === 'ios' || plataforma === 'android',
    notificacionesPush: plataforma === 'ios' || plataforma === 'android',
    widgets: plataforma === 'android',
  };
}

export const capacidades = resolverCapacidades(Platform.OS as PlataformaSoportada);
```

Run: `npx vitest run src/plataforma/capacidades.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/plataforma/capacidades.ts src/plataforma/capacidades.test.ts
git commit -m "feat: agregar capacidades multiplataforma"
```

## Task 4: Aislar widgets y cronómetro Android del bundle iOS

**Files:**
- Create: `src/plataforma/widgets/registrar.android.ts`
- Create: `src/plataforma/widgets/registrar.ts`
- Create: `src/plataforma/widgets/registrar.test.ts`
- Modify: `index.ts`
- Rename: `src/modulos/habitos/widgets/widgetFoco.servicio.tsx` → `src/modulos/habitos/widgets/widgetFoco.servicio.android.tsx`
- Create: `src/modulos/habitos/widgets/widgetFoco.servicio.ts`
- Rename: `src/modulos/habitos/widgets/widgetCalendario.servicio.tsx` → `src/modulos/habitos/widgets/widgetCalendario.servicio.android.tsx`
- Create: `src/modulos/habitos/widgets/widgetCalendario.servicio.ts`
- Rename: `src/modulos/habitos/cronometro.servicio.ts` → `src/modulos/habitos/cronometro.servicio.android.ts`
- Create: `src/modulos/habitos/cronometro.servicio.ts`
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`
- Modify: `app/habitos/widgets.tsx`
- Test: `src/plataforma/widgets/widgetsPlataforma.test.ts`

**Interfaces:**
- Consumes: `capacidades.widgets` de Task 3.
- Produces: `registrarWidgets(): void`; variantes no-op con las mismas firmas públicas de sincronización, suscripción y solicitud de anclado.

- [ ] **Step 1: Escribir tests fallidos de no-op y ruta profunda**

El test base importa `registrarWidgets`, los servicios base y `app/habitos/widgets.tsx`; comprueba que las solicitudes retornan `false`, las sincronizaciones resuelven sin error, la suscripción devuelve una función de cleanup y la ruta base redirige a `/(principal)/hoy` cuando `widgets=false`. Además lee los archivos base y afirma que no contienen `react-native-android-widget`, `HabitoFocoWidget` ni `modules/habito-widget`.

Run: `npx vitest run src/plataforma/widgets/widgetsPlataforma.test.ts`

Expected: FAIL por imports Android actuales.

- [ ] **Step 2: Mover implementaciones Android sin cambiar su comportamiento**

Crear con `apply_patch` las variantes `.android.tsx` copiando íntegramente la implementación actual. Antes de reemplazar los archivos base por sus no-op, verificar las copias:

```bash
cmp src/modulos/habitos/widgets/widgetFoco.servicio.tsx src/modulos/habitos/widgets/widgetFoco.servicio.android.tsx
cmp src/modulos/habitos/widgets/widgetCalendario.servicio.tsx src/modulos/habitos/widgets/widgetCalendario.servicio.android.tsx
cmp src/modulos/habitos/cronometro.servicio.ts src/modulos/habitos/cronometro.servicio.android.ts
```

Expected: los tres comandos no muestran diferencias de contenido. No editar la lógica Android durante esta tarea.

- [ ] **Step 3: Crear fachadas base explícitas**

Los archivos base deben exportar exactamente las firmas que ya consumen las pantallas. Ejemplo para calendario:

```ts
export async function sincronizarWidgetCalendario(): Promise<void> {}
export async function pedirAgregarWidgetCalendario(): Promise<boolean> { return false; }
```

Para foco, mantener los tipos de datos en un archivo neutro y devolver `false`/cleanup no-op; para cronómetro, `sincronizarSesionesCronometroPendientes()` devuelve `false`.

- [ ] **Step 4: Aislar el entry point headless**

`registrar.android.ts` contiene los dos únicos imports del handler:

```ts
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '../../modulos/habitos/widgets/widgetTaskHandler';

export function registrarWidgets(): void { registerWidgetTaskHandler(widgetTaskHandler); }
```

`registrar.ts` contiene:

```ts
export function registrarWidgets(): void {}
```

`index.ts` queda neutral:

```ts
import 'expo-router/entry';
import { registrarWidgets } from './src/plataforma/widgets/registrar';

registrarWidgets();
```

- [ ] **Step 5: Ocultar entrada y proteger deep links**

En `HabitosPantalla.tsx`, renderizar el acceso a widgets solo si `capacidades.widgets`. En `app/habitos/widgets.tsx`, devolver `<Redirect href="/(principal)/hoy" />` cuando la capacidad sea falsa y renderizar `WidgetsHabitosPantalla` solo en Android.

Run:

```bash
npx vitest run src/plataforma/widgets/widgetsPlataforma.test.ts
npx expo export --platform ios --output-dir /tmp/lestinaty-ios-widgets
rg "react-native-android-widget|HabitoFocoWidget" /tmp/lestinaty-ios-widgets
```

Expected: tests PASS, export PASS y `rg` no encuentra referencias ejecutables del paquete Android en el bundle iOS.

- [ ] **Step 6: Regresión Android y commit**

Run: `npx expo export --platform android --output-dir /tmp/lestinaty-android-widgets && npm run typecheck`

Expected: export/typecheck PASS.

```bash
git add index.ts app/habitos/widgets.tsx src/plataforma/widgets src/modulos/habitos/pantallas/HabitosPantalla.tsx src/modulos/habitos/widgets/widgetFoco.servicio.ts src/modulos/habitos/widgets/widgetFoco.servicio.android.tsx src/modulos/habitos/widgets/widgetCalendario.servicio.ts src/modulos/habitos/widgets/widgetCalendario.servicio.android.tsx src/modulos/habitos/cronometro.servicio.ts src/modulos/habitos/cronometro.servicio.android.ts src/plataforma/widgets/widgetsPlataforma.test.ts
git commit -m "refactor: aislar widgets Android de iOS"
```

## Task 5: Aislar Google Sign-In y completar el acceso email en iOS

**Files:**
- Create: `src/plataforma/autenticacion/google.android.ts`
- Create: `src/plataforma/autenticacion/google.ts`
- Create: `src/plataforma/autenticacion/google.test.ts`
- Modify: `src/modulos/acceso/acceso.servicio.ts`
- Delete after migration: `src/modulos/acceso/googleSignIn.ts`
- Modify: `app/_layout.tsx`
- Modify: `src/modulos/acceso/componentes/BotonGoogle.tsx`
- Modify: `src/modulos/acceso/pantallas/IniciarSesionPantalla.tsx`
- Modify: `src/modulos/acceso/pantallas/CrearCuentaPantalla.tsx`
- Modify: `src/modulos/onboarding/componentes/FormularioAccesoOnboarding.tsx`
- Modify: `src/servicios/i18n/recursos.ts`
- Modify: `src/servicios/i18n/recursos.test.ts`

**Interfaces:**
- Consumes: `UsuarioSesion`, `entorno.googleWebClientId`, Supabase y `capacidades.googleSignIn`.
- Produces: `ResultadoAccesoGoogle`; `inicializarGoogle(): void`; `iniciarSesionConGoogle(codigoReferido?): Promise<ResultadoAccesoGoogle>`.

- [ ] **Step 1: Escribir tests fallidos del adaptador base**

```ts
import { describe, expect, it } from 'vitest';
import { iniciarSesionConGoogle } from './google';

describe('Google fuera de Android', () => {
  it('declara plataforma no disponible sin cargar el SDK', async () => {
    await expect(iniciarSesionConGoogle()).resolves.toEqual({ estado: 'no_disponible', motivo: 'plataforma' });
  });
});
```

Añadir un test Android con mock del SDK que fija cancelación y éxito, y uno estático que afirma que solo `google.android.ts` contiene el nombre del paquete.

Run: `npx vitest run src/plataforma/autenticacion/google.test.ts`

Expected: FAIL porque los adaptadores no existen.

- [ ] **Step 2: Crear el contrato y no-op**

```ts
import type { UsuarioSesion } from '../../modulos/acceso/tipos';

export type ResultadoAccesoGoogle =
  | { estado: 'autenticado'; usuario: UsuarioSesion }
  | { estado: 'cancelado' }
  | { estado: 'no_disponible'; motivo: 'plataforma' };

export function inicializarGoogle(): void {}
export async function iniciarSesionConGoogle(): Promise<ResultadoAccesoGoogle> {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}
```

- [ ] **Step 3: Mover la implementación Android**

`google.android.ts` absorbe `GoogleSignin.configure` y la implementación actual de `acceso.servicio.ts`. Cancelación devuelve `{ estado: 'cancelado' }`; éxito devuelve `{ estado: 'autenticado', usuario }`; errores reales siguen lanzándose. El RPC de referido continúa siendo best-effort después de autenticar.

En `acceso.servicio.ts`, eliminar el import del SDK y reexportar:

```ts
export { iniciarSesionConGoogle } from '../../plataforma/autenticacion/google';
```

En `app/_layout.tsx`, reemplazar únicamente `inicializarGoogleSignIn` por `inicializarGoogle`; OneSignal y compras conservan temporalmente sus llamadas históricas hasta Task 9. Después, eliminar `src/modulos/acceso/googleSignIn.ts`.

- [ ] **Step 4: Adaptar UI y copy sin renderizar Google en iOS/web**

`BotonGoogle` devuelve `null` si `!capacidades.googleSignIn`. Los tres handlers cambian de `usuario | null` a la unión discriminada: navegan solo con `estado === 'autenticado'`, no muestran error en `cancelado` y no ejecutan el handler en `no_disponible`.

Agregar claves EN/ES para el texto visible en login:

```ts
googleAccountRecoveryHint: 'Did you sign up with Google? Use Recover access with the same email.',
googleAccountRecoveryHint: '¿Te registraste con Google? Usa Recuperar acceso con el mismo correo.',
```

Mostrar el texto únicamente cuando `Platform.OS === 'ios'`.

- [ ] **Step 5: Verificar aislamiento y regresión**

Run:

```bash
npx vitest run src/plataforma/autenticacion/google.test.ts src/servicios/i18n/recursos.test.ts
npx expo export --platform ios --output-dir /tmp/lestinaty-ios-auth
npx expo export --platform web --output-dir /tmp/lestinaty-web-auth
npx expo export --platform android --output-dir /tmp/lestinaty-android-auth
npx expo-modules-autolinking react-native-config --platform ios --json
npx expo-modules-autolinking react-native-config --platform android --json
```

Expected: tests y exports PASS; JSON iOS no contiene `@react-native-google-signin/google-signin`; JSON Android sí lo contiene. Prueba manual Android: éxito y cancelación de Google conservan su comportamiento.

- [ ] **Step 6: Commit**

```bash
git add package.json app/_layout.tsx src/plataforma/autenticacion src/modulos/acceso/acceso.servicio.ts src/modulos/acceso/componentes/BotonGoogle.tsx src/modulos/acceso/pantallas/IniciarSesionPantalla.tsx src/modulos/acceso/pantallas/CrearCuentaPantalla.tsx src/modulos/onboarding/componentes/FormularioAccesoOnboarding.tsx src/servicios/i18n/recursos.ts src/servicios/i18n/recursos.test.ts
git add -u src/modulos/acceso/googleSignIn.ts
git commit -m "feat: limitar Google Sign-In a Android"
```

## Task 6: Habilitar OneSignal iOS con permiso contextual

**Files:**
- Create: `src/plataforma/notificaciones/contrato.ts`
- Create: `src/plataforma/notificaciones/cliente.native.ts`
- Create: `src/plataforma/notificaciones/cliente.web.ts`
- Create: `src/plataforma/notificaciones/cliente.native.test.ts`
- Modify: `src/nucleo/notificaciones/oneSignal.ts`
- Modify: `src/nucleo/notificaciones/oneSignal.test.ts`
- Modify: `src/modulos/acceso/proveedor/ProveedorAcceso.tsx`
- Modify: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Create: `supabase/migrations/20260923_48_notificaciones_ios.sql`
- Create: `supabase/tests/07_notificaciones_ios.sql`
- Modify: `supabase/resumen.md`

**Interfaces:**
- Consumes: Supabase `auth.uid()`, `Platform.OS`, ruta de notificación y RPC `registrar_dispositivo_notificacion`.
- Produces: `EstadoIntegracion`; `ResultadoPermisoNotificaciones`; inicializar/identificar/olvidar/solicitar permiso.

- [ ] **Step 1: Escribir tests fallidos del cliente nativo**

Cubrir cinco casos: inicializar no llama `requestPermission`; iOS registra `p_plataforma: 'ios'`; Android registra `android`; una sesión inválida no llama RPC; denegación retorna `{ estado: 'denegado' }` sin lanzar.

Run: `npx vitest run src/plataforma/notificaciones/cliente.native.test.ts`

Expected: FAIL porque el cliente no existe y el servicio actual fuerza Android.

- [ ] **Step 2: Definir estados y cliente web**

```ts
export type EstadoIntegracion =
  | { estado: 'lista' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };

export type ResultadoPermisoNotificaciones =
  | { estado: 'concedido' }
  | { estado: 'denegado' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'error'; mensajeSeguro: string };
```

El cliente web devuelve `no_disponible` y no importa OneSignal.

- [ ] **Step 3: Implementar cliente nativo y reexport compatible**

Mover la lógica actual al cliente nativo, eliminar el guard `Platform.OS !== 'android'` y enviar `p_plataforma: Platform.OS`. Mantener navegación por `additionalData`, `login/logout`, refresh de sesión y subscription listener. `inicializarNotificaciones` nunca llama a `requestPermission`.

`oneSignal.ts` reexporta nombres históricos hacia el contrato nuevo para que el proveedor no cargue el SDK directamente.

- [ ] **Step 4: Consumir resultado explícito en el wizard**

En `CrearHabitoWizard`, aceptar el recordatorio solo con `resultado.estado === 'concedido'`; para `denegado`, `no_disponible` o `error`, apagar el toggle y mostrar el copy traducible correspondiente. No volver a pedir permiso automáticamente después de `denegado`.

Run: `npx vitest run src/plataforma/notificaciones/cliente.native.test.ts src/nucleo/notificaciones/oneSignal.test.ts`

Expected: todos PASS.

- [ ] **Step 5: Escribir primero el smoke SQL fallido**

`07_notificaciones_ios.sql` crea dentro de transacción un dispositivo iOS concedido, un hábito/plan vencido y ejecuta `privacidad.reclamar_recordatorios_habitos(100)`. Debe afirmar que el JSON contiene su subscription ID iOS y conservar una aserción Android.

Run:

```bash
node supabase/tests/ejecutar_sql_management.mjs supabase/tests/07_notificaciones_ios.sql
```

Expected: FAIL porque la función actual filtra `plataforma = 'android'`.

- [ ] **Step 6: Crear y aplicar la migración mínima**

Copiar la definición efectiva de `privacidad.reclamar_recordatorios_habitos(integer)` y cambiar solo el filtro a:

```sql
and dispositivo.plataforma in ('ios', 'android')
```

Aplicar mediante el runner de Management API usado por el proyecto, no con `supabase db push`, y ejecutar de nuevo el smoke dentro de transacción.

Expected: smoke PASS para iOS y Android.

- [ ] **Step 7: Configurar APNs fuera de Git**

En Apple Developer/App Store Connect crear el identificador `com.lestinaty.app` con Push Notifications. Cargar la llave APNs `.p8` en OneSignal, asociar Team ID/Key ID y configurar las credenciales EAS. Desarrollo usa modo APNs development; preview/TestFlight/production usa production mediante `app.config.ts`.

- [ ] **Step 8: Commit**

```bash
git add src/plataforma/notificaciones src/nucleo/notificaciones/oneSignal.ts src/nucleo/notificaciones/oneSignal.test.ts src/modulos/acceso/proveedor/ProveedorAcceso.tsx src/modulos/habitos/componentes/CrearHabitoWizard.tsx supabase/migrations/20260923_48_notificaciones_ios.sql supabase/tests/07_notificaciones_ios.sql supabase/resumen.md
git commit -m "feat: habilitar notificaciones OneSignal en iOS"
```

## Task 7: Separar productos IAP por plataforma y mantener el webhook idempotente

**Files:**
- Create: `supabase/migrations/20260923_49_productos_iap_plataforma.sql`
- Create: `supabase/tests/08_productos_iap_plataforma.sql`
- Modify: `supabase/functions/recibir-webhook-revenuecat/index.ts`
- Modify: `supabase/functions/recibir-webhook-revenuecat/README.md`
- Modify: `supabase/comercio-schema.md`
- Modify: `supabase/resumen.md`
- Modify: `src/modulos/tienda/gemas.servicio.ts`
- Modify: `src/modulos/tienda/gemas.tipos.ts`

**Interfaces:**
- Consumes: `paquetes_gemas_iap`, RevenueCat `event.product_id`, `comercio.acreditar_gemas`.
- Produces: `paquetes_gemas_iap_productos(paquete_id, plataforma, product_id_revenuecat, activo)` y catálogo cliente filtrado por plataforma.

- [ ] **Step 1: Escribir smoke SQL fallido**

El test debe afirmar: tabla hija presente; `plataforma` solo acepta `ios|android`; todos los productos heredados existen como Android; el mismo product ID no puede duplicarse en la misma plataforma; un producto iOS activo resuelve la cantidad del paquete lógico; dos créditos con el mismo `event.id` no duplican saldo.

Run: `node supabase/tests/ejecutar_sql_management.mjs supabase/tests/08_productos_iap_plataforma.sql`

Expected: FAIL porque la tabla hija no existe.

- [ ] **Step 2: Crear migración compatible con datos actuales**

La migración crea:

```sql
create table public.paquetes_gemas_iap_productos (
  paquete_id text not null references public.paquetes_gemas_iap(id) on delete cascade,
  plataforma text not null check (plataforma in ('ios', 'android')),
  product_id_revenuecat text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  primary key (paquete_id, plataforma),
  unique (plataforma, product_id_revenuecat)
);
```

Insertar con `plataforma='android'` los valores actuales de `paquetes_gemas_iap.product_id_revenuecat`, habilitar RLS de lectura solo para filas activas, otorgar lectura a `anon/authenticated` y escritura solo a `service_role`. Mantener la columna antigua durante esta entrega para rollback; marcarla como legado en documentación.

- [ ] **Step 3: Adaptar webhook y catálogo**

El webhook consulta la tabla hija por `product_id_revenuecat` y `activo`, obtiene `paquete_id`, y después consulta la cantidad en `paquetes_gemas_iap`. No usa el campo plataforma del cliente y no cambia `event.id` como referencia idempotente.

`obtenerCatalogoGemasIap(plataforma)` consulta la tabla hija activa de `ios` o `android`, une cantidad/precio del padre y nunca devuelve productos de la otra tienda.

- [ ] **Step 4: Aplicar migración y ejecutar smokes**

Run:

```bash
node supabase/tests/ejecutar_sql_management.mjs supabase/migrations/20260923_49_productos_iap_plataforma.sql
node supabase/tests/ejecutar_sql_management.mjs supabase/tests/08_productos_iap_plataforma.sql
node supabase/tests/ejecutar_sql_management.mjs supabase/tests/05_comercio_gemas_nivel_habito.sql
```

Expected: todos PASS y el saldo sube una sola vez ante el mismo evento.

- [ ] **Step 5: Configurar productos reales fuera de Git**

Crear en App Store Connect consumibles con IDs deterministas `com.lestinaty.app.gemas.100`, `com.lestinaty.app.gemas.550`, `com.lestinaty.app.gemas.1200`; configurar sus precios; enlazarlos en RevenueCat al mismo offering lógico; insertar sus tres filas `ios` activas. Los productos actuales de Play conservan sus IDs reales como filas `android`. No habilitar ventas mientras exista cualquier `com.tuapp.*` activo.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260923_49_productos_iap_plataforma.sql supabase/tests/08_productos_iap_plataforma.sql supabase/functions/recibir-webhook-revenuecat/index.ts supabase/functions/recibir-webhook-revenuecat/README.md supabase/comercio-schema.md supabase/resumen.md src/modulos/tienda/gemas.servicio.ts src/modulos/tienda/gemas.tipos.ts
git commit -m "feat: separar productos IAP por plataforma"
```

## Task 8: Encapsular RevenueCat y adaptar tienda, Horizon y restauración

**Files:**
- Create: `src/plataforma/compras/contrato.ts`
- Create: `src/plataforma/compras/cliente.native.ts`
- Create: `src/plataforma/compras/cliente.web.ts`
- Create: `src/plataforma/compras/cliente.native.test.ts`
- Modify: `src/nucleo/compras/revenueCat.ts`
- Modify: `src/nucleo/compras/horizon.ts`
- Modify: `src/nucleo/compras/horizon.test.ts`
- Modify: `src/modulos/tienda/pantallas/TiendaPantalla.tsx`
- Modify: `src/modulos/tienda/pantallas/TiendaArbolesPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/horizonCopy.ts`
- Modify: `src/modulos/direccion/pantallas/PerfilPantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`
- Modify: `src/servicios/i18n/recursos.test.ts`

**Interfaces:**
- Consumes: claves RevenueCat de `entorno`, productos por plataforma de Task 7 y `auth.uid()`.
- Produces: `PaqueteCompra`, `EstadoCatalogoCompras`, `ResultadoCompra`, `ResultadoRestauracion`; ningún componente importa tipos de `react-native-purchases`.

- [ ] **Step 1: Escribir tests fallidos del contrato**

Cubrir: iOS elige Apple key; Android elige Google key; clave ausente devuelve `no_configurada`; web devuelve `no_disponible`; cancelación devuelve `cancelada`; `paymentPending` devuelve `pendiente`; error devuelve mensaje seguro; restauración vacía se distingue de error.

Run: `npx vitest run src/plataforma/compras/cliente.native.test.ts`

Expected: FAIL porque el contrato no existe y el cliente actual usa `[]`/throw ambiguos.

- [ ] **Step 2: Definir tipos propios**

```ts
export type PaqueteCompra = {
  id: string;
  productId: string;
  precioTexto: string;
  tipo: 'mensual' | 'consumible' | 'otro';
};

export type ResultadoCompra =
  | { estado: 'completada' }
  | { estado: 'cancelada' }
  | { estado: 'pendiente' }
  | { estado: 'error'; mensajeSeguro: string };

export type EstadoCatalogoCompras =
  | { estado: 'lista'; paquetes: PaqueteCompra[] }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };

export type ResultadoRestauracion =
  | { estado: 'restaurada'; horizonActivo: boolean }
  | { estado: 'sin_compras' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };
```

- [ ] **Step 3: Implementar clientes nativo/web y fachadas históricas**

Solo `cliente.native.ts` importa Purchases. Configura una vez, conserva usuario pendiente, mapea offerings a `PaqueteCompra`, mantiene internamente un `Map<string, PurchasesPackage>` por `id`, y traduce errores del SDK a la unión anterior. La operación pública compra por `paqueteId: string`, nunca recibe el objeto nativo. `cliente.web.ts` nunca importa el SDK. `revenueCat.ts` y `horizon.ts` reexportan fachadas compatibles usando los tipos propios.

- [ ] **Step 4: Migrar consumidores y feedback**

Eliminar todos los imports de `PurchasesPackage` en pantallas y `horizonCopy.ts`. La tienda:

- no muestra error al cancelar;
- muestra mensaje de aprobación al quedar pendiente;
- no refresca saldo en cancelación/pendiente;
- refresca saldo de forma acotada solo al completar;
- deshabilita compra con copy explícito si falta clave/configuración.

Perfil abre `https://apps.apple.com/account/subscriptions` en iOS y Google Play en Android. Restauración distingue `restaurada`, `sin_compras`, `no_configurada` y `error`. Horizon no redirige a widgets en iOS; tras compra activa permanece en la pantalla compartida o vuelve a Perfil.

- [ ] **Step 5: Verificar contrato, imports y UI**

Run:

```bash
npx vitest run src/plataforma/compras/cliente.native.test.ts src/nucleo/compras/horizon.test.ts src/servicios/i18n/recursos.test.ts
rg "PurchasesPackage|react-native-purchases" src/modulos src/nucleo
npm run typecheck
```

Expected: tests/typecheck PASS; `rg` encuentra el SDK únicamente en `src/plataforma/compras/cliente.native.ts` y mocks de test.

- [ ] **Step 6: Configurar Horizon para App Store fuera de Git**

Crear en App Store Connect la suscripción mensual `com.lestinaty.app.horizon.monthly`, enlazarla en RevenueCat al entitlement `horizon` y al offering consumido por la app, y configurar el precio/localizaciones. Verificar que la misma restauración del cliente reconoce el entitlement tanto en Apple como en Google.

- [ ] **Step 7: Commit**

```bash
git add src/plataforma/compras src/nucleo/compras/revenueCat.ts src/nucleo/compras/horizon.ts src/nucleo/compras/horizon.test.ts src/modulos/tienda/pantallas/TiendaPantalla.tsx src/modulos/tienda/pantallas/TiendaArbolesPantalla.tsx src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx src/modulos/habitos/pantallas/horizonCopy.ts src/modulos/direccion/pantallas/PerfilPantalla.tsx src/servicios/i18n/recursos.ts src/servicios/i18n/recursos.test.ts
git commit -m "feat: adaptar compras y restauracion a iOS"
```

## Task 9: Orquestar el arranque sin fallos en cascada

**Files:**
- Create: `src/plataforma/inicializarPlataforma.ts`
- Create: `src/plataforma/inicializarPlataforma.test.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `inicializarGoogle()`, `inicializarCompras()` e `inicializarNotificaciones()` terminados en Tasks 5, 6 y 8.
- Produces: `inicializarPlataforma(): Promise<void>` como única llamada de arranque nativo.

- [ ] **Step 1: Escribir el test fallido de aislamiento**

Mockear los tres adaptadores; hacer que notificaciones lance y comprobar que Google y compras también se ejecutan exactamente una vez.

Run: `npx vitest run src/plataforma/inicializarPlataforma.test.ts`

Expected: FAIL porque el orquestador todavía no existe.

- [ ] **Step 2: Implementar el orquestador tolerante a fallos**

```ts
import { inicializarGoogle } from './autenticacion/google';
import { inicializarCompras } from './compras/cliente';
import { inicializarNotificaciones } from './notificaciones/cliente';

export async function inicializarPlataforma(): Promise<void> {
  await Promise.allSettled([
    Promise.resolve().then(inicializarGoogle),
    Promise.resolve().then(inicializarCompras),
    Promise.resolve().then(inicializarNotificaciones),
  ]);
}
```

- [ ] **Step 3: Dejar una sola llamada en el layout**

Eliminar de `app/_layout.tsx` los imports directos de OneSignal, RevenueCat y Google. Importar el orquestador y usar:

```ts
useEffect(() => { void inicializarPlataforma(); }, []);
```

Run:

```bash
npx vitest run src/plataforma/inicializarPlataforma.test.ts
npm run typecheck
```

Expected: test/typecheck PASS y el fallo simulado de una integración no impide las otras dos.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx src/plataforma/inicializarPlataforma.ts src/plataforma/inicializarPlataforma.test.ts
git commit -m "refactor: centralizar arranque de integraciones"
```

## Task 10: Convertir “Eliminar cuenta” en borrado real verificable

**Files:**
- Create: `supabase/migrations/20260923_50_eliminacion_cuenta_cascadas.sql`
- Create: `supabase/functions/eliminar-cuenta/index.ts`
- Create: `supabase/functions/eliminar-cuenta/README.md`
- Create: `supabase/tests/09_eliminacion_cuenta_remoto.mjs`
- Modify: `src/modulos/configuracion/configuracion.servicio.ts`
- Modify: `src/modulos/direccion/pantallas/PerfilPantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`
- Modify: `src/servicios/i18n/recursos.test.ts`

**Interfaces:**
- Consumes: JWT Supabase de la sesión actual, `auth.uid()`, solicitud existente de privacidad y `SUPABASE_SERVICE_ROLE_KEY` solo dentro de Edge Functions.
- Produces: `eliminarCuentaActual(): Promise<void>`; eliminación irreversible de Auth y datos en cascada; UI que no cierra sesión si el servidor no confirma.

- [ ] **Step 1: Escribir la prueba remota fallida**

`09_eliminacion_cuenta_remoto.mjs` crea dos usuarios desechables, datos de hábito/gemas/semillas para el primero y una referencia `referido_por` desde el segundo. Invoca `eliminar-cuenta` con el JWT del primero y afirma:

```js
assert.equal(await existeUsuarioAuth(usuarioA.id), false);
assert.equal(await contar('habitos_items', 'usuario_id', usuarioA.id), 0);
assert.equal(await contar('usuario_semillas', 'usuario_id', usuarioA.id), 0);
assert.equal(await saldoExiste(usuarioA.id), false);
assert.equal(await obtenerReferidoPor(usuarioB.id), null);
```

Run: `node supabase/tests/09_eliminacion_cuenta_remoto.mjs`

Expected: FAIL porque no existe la Edge Function y dos FKs actuales no permiten el borrado completo.

- [ ] **Step 2: Corregir únicamente las FKs bloqueantes**

La migración cambia `public.usuario_semillas.usuario_id` a `ON DELETE CASCADE` y `public.perfiles_usuario.referido_por` a `ON DELETE SET NULL`, conservando tipos e índices:

```sql
alter table public.usuario_semillas drop constraint usuario_semillas_usuario_id_fkey;
alter table public.usuario_semillas add constraint usuario_semillas_usuario_id_fkey
  foreign key (usuario_id) references auth.users(id) on delete cascade;

alter table public.perfiles_usuario drop constraint perfiles_usuario_referido_por_fkey;
alter table public.perfiles_usuario add constraint perfiles_usuario_referido_por_fkey
  foreign key (referido_por) references auth.users(id) on delete set null;
```

Antes de aplicar, consultar `pg_constraint` y confirmar que no queda ninguna FK directa hacia `auth.users(id)` con acción `NO ACTION`/`RESTRICT` para datos propios del usuario.

- [ ] **Step 3: Implementar la Edge Function autenticada**

La función exige `Authorization`, valida al usuario con un cliente Supabase anon ligado al JWT y usa el cliente service-role exclusivamente para `auth.admin.deleteUser(usuario.id, false)`. No acepta un UUID desde el body, no imprime tokens y responde `401`, `500` o `204`.

```ts
const autorizacion = request.headers.get('authorization');
if (!autorizacion) return new Response(null, { status: 401 });
const clienteUsuario = createClient(url, anonKey, { global: { headers: { Authorization: autorizacion } } });
const { data: { user }, error: errorUsuario } = await clienteUsuario.auth.getUser();
if (errorUsuario || !user) return new Response(null, { status: 401 });
const administrador = createClient(url, serviceRole);
const { error } = await administrador.auth.admin.deleteUser(user.id, false);
return new Response(null, { status: error ? 500 : 204 });
```

- [ ] **Step 4: Cambiar el cliente y la confirmación visual**

`eliminarCuentaActual` crea la solicitud de privacidad, invoca la Edge Function y solo después limpia la sesión local. Si falla, mantiene la sesión y muestra error recuperable. Antes de confirmar, Perfil advierte que una suscripción Apple puede seguir renovándose y ofrece abrir `https://apps.apple.com/account/subscriptions`; también aclara que el borrado elimina hábitos, progreso, gemas y árboles y no equivale a solicitar un reembolso.

- [ ] **Step 5: Aplicar, desplegar y probar**

Run:

```bash
node supabase/tests/ejecutar_sql_management.mjs supabase/migrations/20260923_50_eliminacion_cuenta_cascadas.sql
supabase functions deploy eliminar-cuenta
node supabase/tests/09_eliminacion_cuenta_remoto.mjs
npx vitest run src/servicios/i18n/recursos.test.ts
npm run typecheck
```

Expected: usuario Auth y datos propios desaparecen, el referente sobrevive con `referido_por=null`, tests/typecheck PASS y ningún service-role secret llega al cliente.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260923_50_eliminacion_cuenta_cascadas.sql supabase/functions/eliminar-cuenta supabase/tests/09_eliminacion_cuenta_remoto.mjs src/modulos/configuracion/configuracion.servicio.ts src/modulos/direccion/pantallas/PerfilPantalla.tsx src/servicios/i18n/recursos.ts src/servicios/i18n/recursos.test.ts
git commit -m "feat: completar eliminacion real de cuenta"
```

## Task 11: Crear el paquete preventivo de App Review

**Files:**
- Create: `docs/app-store/privacy-inventory.md`
- Create: `docs/app-store/review-notes-en.md`
- Create: `docs/app-store/rejection-runbook.md`
- Create: `docs/app-store/release-checklist.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/horizonCopy.ts`
- Modify: `src/servicios/i18n/recursos.ts`
- Modify: `src/servicios/i18n/recursos.test.ts`
- Verify/modify: `app/(principal)/_layout.tsx`
- Verify/modify: `src/modulos/hoy/pantallas/HoyPantalla.tsx`
- Verify/modify: `src/modulos/senderos/pantallas/SenderosPantalla.tsx`
- Verify/modify: `src/modulos/insights/pantallas/InsightsPantalla.tsx`
- Verify/modify: `src/modulos/tienda/pantallas/TiendaArbolesPantalla.tsx`
- Verify/modify: `src/modulos/direccion/pantallas/PerfilPantalla.tsx`
- Verify/modify: `src/modulos/acceso/componentes/PantallaAcceso.tsx`
- Verify/modify: `src/modulos/onboarding/pantallas/IntroduccionAppPantalla.tsx`
- Verify/modify: `src/modulos/onboarding/pantallas/AccesoOnboardingPantalla.tsx`
- Verify/modify: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Verify/modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`

**Interfaces:**
- Consumes: build candidato, matriz preventiva, políticas públicas, catálogo IAP, flujos de Tasks 1–10.
- Produces: expediente reproducible para App Review, checklist con gates P0/P1 y respuesta operativa ante rechazo.

- [ ] **Step 1: Inventariar datos y SDKs contra el build real**

Documentar por Supabase, OneSignal y RevenueCat: datos recogidos, finalidad, si se vinculan a identidad, si se usan para tracking, retención, eliminación y URL del proveedor. Incluir email, identificador de usuario, contenido de hábitos/progreso, saldo/compras, subscription ID de push, diagnóstico técnico y purchase history. La entrega exige `Tracking = No`: si el inventario encuentra tracking publicitario o entre compañías, desactivar esa capacidad o retirar el SDK/configuración que la cause antes de continuar; no ocultarla ni compensarla declarando falsamente que no existe.

Run:

```bash
rg -n "supabase|OneSignal|Purchases|AsyncStorage|Camera|ImagePicker|Notifications" src app modules
npx expo config --type public
```

Expected: cada dato/permiso/import tiene una fila en `privacy-inventory.md` o se elimina por no usarse.

- [ ] **Step 2: Validar privacidad, manifests y purpose strings**

El análisis del repositorio no encuentra consumidores reales de `expo-camera` ni `expo-image-picker`; retirarlos antes del build para no enlazar capacidades innecesarias:

```bash
npm uninstall expo-camera expo-image-picker
```

En el build de producción, revisar el reporte de privacidad y warnings de upload: cada SDK que Apple lista incluye firma/privacy manifest y cada required-reason API tiene una razón válida. Notificaciones conserva su descripción contextual. Como el build se entrega sin tracking, no añadir `NSUserTrackingUsageDescription`, no solicitar ATT y no declarar tracking domains.

Expected: cero warning pendiente de privacy manifest, firma o purpose string antes de Submit for Review.

- [ ] **Step 3: Blindar el paywall Horizon**

Antes del botón de compra mostrar, con precio localizado recibido de StoreKit: “Horizon mensual”, duración de un mes, renovación automática hasta cancelación, beneficios concretos, acceso a Restaurar compras, Gestionar suscripción, Política de privacidad y Términos. Nunca mostrar precio fallback inventado cuando RevenueCat no entregue producto.

Run: `npx vitest run src/nucleo/compras/horizon.test.ts src/servicios/i18n/recursos.test.ts`

Expected: copy EN/ES completo y ningún CTA de compra si el producto está no configurado.

- [ ] **Step 4: Preparar acceso de revisión y Review Notes**

Crear una cuenta demo confirmada por contraseña con tres hábitos, progreso en Senderos, gemas y datos visibles; crear por separado una cuenta desechable de borrado. Las credenciales no se guardan en Git: se colocan en los campos username/password de App Review. `review-notes-en.md` contiene este texto operativo, sin secretos:

```text
Lestinaty is a native habit-building app. The reviewer account credentials are provided in the secure fields above.
On iOS, authentication uses email and password only; Google Sign-In and Android widgets are not included in this binary.
Core flow: Today > open a habit > complete its node > Senderos shows progression.
Gem packs: Store > Gems. Purchases are fulfilled only after RevenueCat's verified webhook.
Horizon: Profile > Membership. Restore Purchases and Manage Subscription are available there.
Push reminders are optional and requested only after the reviewer enables a habit reminder.
Account deletion: Profile > Privacy and your data > Delete account. A separate disposable account is available in the review credentials notes for this destructive test.
Chests are earned through habit progress, are not sold, and never consume purchased currency.
```

- [ ] **Step 5: Auditar Safe Area en paywall y navegación principal**

Confirmar en código que Horizon conserva `SafeAreaView edges={['top','bottom']}`, la barra de tabs usa `insets.bottom`, y Hoy/Senderos/Insights/Tienda/Perfil aplican `insets.top` o un `SafeAreaView` equivalente sin sumar el inset dos veces. Ningún CTA puede quedar debajo del home indicator.

Probar en simuladores iPhone SE y iPhone con Dynamic Island: abrir cada tab, Horizon, Tienda de gemas, modales transparentes y pantallas de detalles; tomar capturas con overlays de safe area.

Expected: encabezados nunca quedan bajo notch/Dynamic Island; tab bar, Comprar, Restaurar, Gestionar suscripción y Volver son visibles y tocables; no aparece un bloque extra gigante por padding duplicado.

- [ ] **Step 6: Auditar formularios con teclado abierto**

Task 2A debe estar `PASS`. En `PantallaAcceso`, onboarding, recuperación/OTP, wizard y Aby conservar una estrategia de teclado probada por plataforma, contenido desplazable, `keyboardShouldPersistTaps='handled'` y safe area sin duplicar offsets. Enfocar el último campo en Android pequeño e iPhone SE, escribir hasta provocar validación y pulsar la acción sin cerrar manualmente el teclado.

Expected: Login, Crear cuenta, Verificar, Reenviar, Recuperar acceso, Continuar, Crear hábito y Enviar permanecen visibles o alcanzables con un solo scroll; ningún CTA queda detrás del teclado ni del home indicator.

- [ ] **Step 7: Completar los tres bloques manuales de App Store Connect**

1. **App Privacy:** publicar el cuestionario usando `privacy-inventory.md`; seleccionar `Tracking = No`, no declarar tracking domains y confirmar que no existe `NSUserTrackingUsageDescription`. Declarar correctamente datos vinculados a la cuenta y sus finalidades, incluidos email, user ID, contenido de hábitos, compras y push subscription ID.
2. **Age Rating:** responder todas las preguntas desde el contenido real. Los hábitos son privados, no existe navegador sin restricciones, apuestas, violencia ni contenido sexual; los cofres gratuitos no se presentan como apuestas. Aceptar el rating calculado por Apple y registrar el resultado, sin forzar artificialmente `4+`.
3. **App Review Information:** pegar `review-notes-en.md`; escribir el correo/contraseña demo en los campos seguros; verificar login desde una instalación limpia; añadir cuenta destructiva separada e instrucciones para eliminación.

Expected: Privacy y Age Rating aparecen completos/publicados; App Review Information tiene contacto, credenciales válidas, notas y attachment; ningún secreto se añadió a Git.

- [ ] **Step 8: Auditar metadata y material visual**

Comparar cada screenshot/description con el build final. Bloquear términos o imágenes de Google Play, Android widgets, funciones futuras, precios escritos, claims médicos, datos reales y assets sin derechos. Verificar icono 1024×1024 sin alpha, rating de edad honesto, soporte/contacto, privacidad y términos accesibles por HTTPS.

Run:

```bash
rg -ni "próximamente|proximamente|coming soon|placeholder|todo|google play|android|widget|cura|tratamiento|garantiza|diagnostica" docs/app-store src app
curl -I https://lestinaty.com/privacidad
curl -I https://lestinaty.com/terminos
curl -I https://lestinaty.com/soporte
```

Expected: no existe copy temporal ni acción muerta en el recorrido publicado; las únicas menciones técnicas Android están en Review Notes para explicar su ausencia; privacidad, términos y soporte responden 200 sin login.

- [ ] **Step 9: Preparar el runbook de rechazo**

Para cada mensaje de Apple registrar guideline, build, dispositivo/OS, reproducción y evidencia. Responder en Resolution Center con hechos y adjunto; corregir y resubir cuando el comportamiento incumple; pedir aclaración si los pasos no reproducen; apelar solo cuando el binario ya cumple y la discrepancia es de interpretación. No discutir, no afirmar “funciona en mi dispositivo” sin evidencia y no cambiar configuración remota mientras está In Review.

El runbook incluye tres rutas rápidas:

```text
Binary rejected: reproduce -> fix -> new build number -> attach video -> resubmit.
IAP item rejected: fix metadata/product; remove it only if the binary hides that purchase.
Policy disagreement: answer with exact guideline + evidence; appeal after one clear Resolution Center exchange.
```

- [ ] **Step 10: Commit**

```bash
git add docs/app-store package.json package-lock.json app/'(principal)'/_layout.tsx src/modulos/hoy/pantallas/HoyPantalla.tsx src/modulos/senderos/pantallas/SenderosPantalla.tsx src/modulos/insights/pantallas/InsightsPantalla.tsx src/modulos/tienda/pantallas/TiendaArbolesPantalla.tsx src/modulos/direccion/pantallas/PerfilPantalla.tsx src/modulos/acceso/componentes/PantallaAcceso.tsx src/modulos/onboarding/pantallas/IntroduccionAppPantalla.tsx src/modulos/onboarding/pantallas/AccesoOnboardingPantalla.tsx src/modulos/habitos/componentes/CrearHabitoWizard.tsx src/modulos/aby/pantallas/AgenteAbyPantalla.tsx src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx src/modulos/habitos/pantallas/horizonCopy.ts src/servicios/i18n/recursos.ts src/servicios/i18n/recursos.test.ts
git commit -m "chore: blindar entrega contra rechazos de App Review"
```

## Task 12: Builds, dispositivos reales y gate de publicación

**Files:**
- Modify: `docs/superpowers/plans/2026-09-23-adaptacion-ios-prioritaria.md` (marcar checks y evidencia no sensible)

**Interfaces:**
- Consumes: todos los artefactos de Tasks 1–11, credenciales Apple/EAS, APNs, sandbox App Store y RevenueCat.
- Produces: build de simulador, build TestFlight, regresión Android/web y checklist de release PASS.

- [ ] **Step 1: Ejecutar la suite automatizada completa**

Run:

```bash
node scripts/validar-entorno-release.mjs
npx expo-doctor
npm test -- --run
npm run typecheck
npx expo export --platform ios --output-dir /tmp/lestinaty-ios-final
npx expo export --platform android --output-dir /tmp/lestinaty-android-final
npx expo export --platform web --output-dir /tmp/lestinaty-web-final
```

Expected: entorno de producción completo sin imprimir valores, doctor limpio, tests/typecheck PASS y tres exports completos.

- [ ] **Step 2: Auditar que cada bundle contiene solo su plataforma**

Run:

```bash
rg "react-native-android-widget|HabitoFocoWidget|@react-native-google-signin" /tmp/lestinaty-ios-final /tmp/lestinaty-web-final
rg "@react-native-google-signin" /tmp/lestinaty-android-final
```

Expected: primera búsqueda sin imports ejecutables; segunda confirma Google en Android. Revisar también que ningún `.p8`, service role key ni clave privada aparezca en `git diff --cached`.

- [ ] **Step 3: Crear build de simulador iOS**

Run:

```bash
eas build --platform ios --profile ios-simulator
```

Con la app cerrada, poner el simulador en Dark Mode, abrir en frío y recorrer login, OTP, Perfil, Tienda, Senderos, alerts, modales y teclado. Alternar Light/Dark con `Cmd+Shift+A` mientras la app está abierta y repetir tras background/foreground.

Expected: build instalado; navegación, safe areas, teclado, status bar, fuentes, MasterGlass y Skia permanecen visualmente claros e idénticos; no hay flash negro, recolor semántico ni texto invisible; no aparece Google ni widgets; email/login/OTP funcionan con backend de prueba.

- [ ] **Step 4: Crear build TestFlight**

Run:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Expected: build procesado en App Store Connect/TestFlight usando explícitamente el entorno EAS `production`, sin entitlement de Apple Sign-In ni widgets.

- [ ] **Step 5: Ensamblar la submission sin items incompletos**

En App Store Connect seleccionar el build correcto, agregar en la misma submission inicial los tres consumibles de gemas y la suscripción Horizon, pegar `review-notes-en.md`, cargar credenciales demo en los campos seguros, contacto real y un video breve como attachment. Confirmar que app, IAP y suscripción están `Ready for Review`; Apple exige que la primera IAP se envíe junto con una nueva versión de la app.

Expected: ningún item en Missing Metadata, Developer Action Needed o Waiting for Upload; screenshots y texto corresponden al mismo build.

- [ ] **Step 6: Matriz manual en iPhone físico**

Poner primero el iPhone físico en Dark Mode y mantenerlo así durante toda la matriz. Probar: cold start y reapertura; registro OTP; login con contraseña; OTP inválido/expirado y reenvío; teclado claro; alerts/modales/controles; recuperación de cuenta Google usando email; navegación y Skia; compra sandbox completada/cancelada/pendiente; restauración efectiva y vacía; saldo actualizado solo tras webhook; permiso push aceptado/denegado; apertura de notificación hacia su ruta; eliminación de cuenta. Cambiar el sistema a Light y volver a Dark con la app en background para confirmar que la paleta no cambia. Después conectar el mismo dispositivo a una red IPv6-only DNS64/NAT64, apagar datos celulares y repetir login, Supabase, Aby, compras/restauración y URLs legales.

Expected: todos los criterios del spec PASS, conectividad completa bajo IPv6-only y ningún bloqueo de arranque ante red ausente o permiso denegado.

- [ ] **Step 7: Ejecutar el gate App Review P0/P1**

Recorrer `docs/app-store/release-checklist.md` y adjuntar evidencia de cada fila P0/P1 de la matriz preventiva. Probar específicamente: cuenta demo sin OTP, eliminación con cuenta desechable, URLs legales externas, paywall localizado, restauración, compra sandbox, push denegado, app sin red, background/foreground, sistema en Dark Mode sin cambio visual y ausencia de Google/widgets en iOS.

Expected: todas las filas P0/P1 están `PASS`. Un solo `FAIL`, `SKIP` o “no probado” bloquea Submit for Review.

- [ ] **Step 8: Regresión Android en dispositivo**

Run:

```bash
eas build --platform android --profile preview
```

Probar Google éxito/cancelación, email, compras, restauración, push, widget de hábito, widget calendario, handler headless, incrementos pendientes, cronómetro nativo y el wizard completo con Gboard abierto en pantalla pequeña.

Expected: comportamiento anterior conservado; ningún input o CTA del wizard queda detrás del teclado y no aparece padding doble al cerrarlo.

- [ ] **Step 9: Enviar y vigilar Resolution Center**

Pulsar Submit for Review solo después de los gates. Vigilar correo/App Store Connect. Si llega un rechazo, no resubir a ciegas: seguir `rejection-runbook.md`, reproducir exactamente, guardar screenshot/video/log, responder en inglés con la guideline y evidencia, y decidir entre metadata corregida, item IAP corregido o nuevo build.

Expected: toda comunicación y decisión queda registrada sin credenciales ni datos personales en Git.

- [ ] **Step 10: Revisión final del diff y commit de evidencia**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: sin whitespace errors, sin secretos y sin assets/archivos de Senderos ajenos incluidos.

```bash
git add docs/superpowers/plans/2026-09-23-adaptacion-ios-prioritaria.md
git commit -m "docs: registrar validacion de entrega iOS"
```

## Gates externos que condicionan TestFlight, no el desarrollo local

Estos trámites arrancan el mismo día que Task 1 y continúan en paralelo con el código; no se dejan para Task 12 porque controlan el camino crítico de publicación.

1. Membresía activa de Apple Developer y acceso a App Store Connect para `com.lestinaty.app`.
2. Certificados/perfiles administrados por EAS y aceptación de contratos fiscales/comerciales para IAP.
3. Llave APNs `.p8`, Team ID y Key ID cargados en OneSignal, nunca en Git.
4. Productos consumibles y suscripción Horizon creados y aprobados en App Store Connect, enlazados con RevenueCat.
5. `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` configurada como variable/secret de EAS para perfiles iOS.
6. Cuenta sandbox de App Store y un iPhone físico para compras y push; el simulador no valida esos dos flujos.
7. Ficha de App Store preparada: nombre, descripción, categoría, edad, soporte, política de privacidad, eliminación de cuenta, declaraciones de privacidad y capturas de iPhone.
8. Entorno EAS `production` contiene solo variables públicas del cliente; Gemini, service-role, webhook, scheduler y OneSignal REST permanecen en Supabase Secrets/backend.
9. Red IPv6-only DNS64/NAT64 disponible para el gate final, con un iPhone físico y datos celulares desactivados durante la prueba.

## Estrategia de rollback

- Las pantallas conservan fachadas históricas, de modo que cada adaptador puede revertirse sin tocar UI/negocio.
- La columna heredada `paquetes_gemas_iap.product_id_revenuecat` permanece durante la primera release iOS.
- La migración de OneSignal amplía Android a `ios|android`; revertirla vuelve a Android sin borrar dispositivos.
- Si falla un build iOS, no se modifica el build Android publicado; EAS mantiene perfiles separados.
- Si falla el gate de identidad, la adaptación social no se despliega y no se bloquea el acceso de cuentas Google existentes.
