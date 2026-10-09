# Inventario de privacidad — build candidato a iOS

Verificado contra el código real (no contra lo que "debería" recolectar la
app) el 2026-09-24. Debe volver a compararse contra el build final antes de
completar el cuestionario de privacidad de App Store Connect. Coincide con
`https://lestinaty.com/privacidad`.

**Resultado exigido por Global Constraints: `Tracking = No`.** No hay SDK de
publicidad, atribución entre apps/sitios, ni `NSUserTrackingUsageDescription`
en ningún plugin instalado (verificado: `rg -n "AppTrackingTransparency|requestTrackingAuthorization" src app` → sin resultados).

## Proveedores que procesan datos (lista completa y exacta)

| Proveedor | Qué recibe | Para qué | Vinculado a identidad | Tracking | Retención / borrado |
|---|---|---|---|---|---|
| **Supabase** | Email, contraseña (hasheada), hábitos, tareas, rutinas, planes, metas y áreas propias, progreso, gemas, cofres, zona horaria, horas de inicio de cada franja del día, subscription ID de push, estado de compras | Backend completo: auth, datos de la app, RLS por usuario | Sí (es la identidad de la cuenta) | No | Borrado inmediato y real al eliminar cuenta (`privacidad.eliminar_cuenta_propia`, verificado con usuarios desechables) |
| **RevenueCat** | `app_user_id` (= `auth.uid()` de Supabase), estado de compra/suscripción, product ID | Validar y sincronizar compras/suscripciones entre Apple/Google y el backend | Sí | No | Gestionado por RevenueCat; el backend solo guarda el resultado (saldo, entitlement activo) |
| **OneSignal** | Subscription ID de push, plataforma (ios/android), permiso nativo | Enviar recordatorios de hábitos, tareas y rutinas que el usuario programa explícitamente | Indirectamente (subscription ID, no email) | No | Se solicita solo tras acción contextual (activar un recordatorio), nunca al abrir la app |
| **Apple App Store / Google Play** | Datos de pago (tarjeta, Apple ID/Google account) | Procesar el cobro de compras/suscripciones | Gestionado por Apple/Google | No | Lestinaty nunca ve ni almacena datos de pago |
| **Vercel** | IP y datos técnicos estándar de acceso web | Hosting de lestinaty.com (marketing, privacidad, términos, soporte) — no aplica al tráfico de la app móvil | No | No | Estándar de hosting, fuera del alcance de la app |

**No usados actualmente** (confirmado por ausencia de imports/dependencias):
Gemini/IA (no se usa en ningún flujo activo — Aby es contenido fijo, no
generado), Google Sign-In en iOS (Android únicamente), Sign in with Apple
(no se ofrece ningún login social en iOS, solo email/contraseña/OTP),
analítica o crash-reporting de terceros (`posthogKey`/`sentryDsn` en
`src/nucleo/configuracion/entorno.ts` son placeholders vacíos, nunca leídos
de variables de entorno reales).

## Datos por categoría (para el formulario de App Privacy)

- **Contact Info → Email Address**: sí, vinculado a la identidad, usado para funcionalidad de la app (cuenta).
- **Identifiers → User ID**: sí (`auth.uid()`), vinculado a la identidad.
- **User Content → Other User Content**: hábitos, tareas, rutinas, planes, metas, progreso, notas — vinculado a la identidad, usado para funcionalidad de la app.
- **Purchases → Purchase History**: sí, vinculado a la identidad (gestionado vía RevenueCat), usado para funcionalidad de la app.
- **Identifiers → Device ID**: subscription ID de OneSignal — vinculado a la identidad, usado para funcionalidad de la app (notificaciones).
- **Diagnostics**: ninguno recolectado actualmente (sin Sentry/Crashlytics/similar integrado).
- **Usage Data**: ninguno recolectado con fines de tracking o analítica de terceros.
- **Todo lo anterior**: `Used for Tracking = No` en cada fila.

## Verificación estática (comandos usados)

```bash
rg -n "supabase|OneSignal|Purchases|AsyncStorage|Camera|ImagePicker|Notifications" src app
npx expo config --type public
```

Resultado: cada import/permiso real tiene fila en esta tabla o fue removido
del proyecto (`expo-camera`, `expo-image-picker` — sin consumidores,
desinstalados; permiso de micrófono de `expo-audio` desactivado por no
usarse grabación en ningún flujo).
