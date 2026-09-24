# Release checklist — gate P0/P1 antes de Submit for Review

Actualizado el 2026-09-24. Una fila sin evidencia `PASS` bloquea el envío —
que el código "parezca correcto" no cuenta como evidencia.

## P0 — bloqueantes

| Ítem | Estado | Evidencia |
|---|---|---|
| Google Sign-In no enlaza en iOS | **PASS** | `npx expo-modules-autolinking react-native-config --platform ios --json` sin `google-signin`; presente en Android. Bundle iOS/web sin `GoogleSignin` (`rg` sobre el export). |
| Gate Google→email preserva `auth.uid()` | **PASS (backend)** / pendiente dispositivo real | Script contra Supabase real: mismo `auth.uid()`, sin fila duplicada, hábito intacto tras recovery. Falta repetir con una cuenta Google auténtica en un Android físico. |
| Eliminar cuenta borra de verdad | **PASS** | RPC `privacidad.eliminar_cuenta_propia` verificado con usuarios desechables: `auth.users` y datos en cascada desaparecen; referido sobrevive con `referido_por=null`. |
| Notificaciones no se piden al arrancar | **PASS** | `inicializarNotificaciones`/`inicializarOneSignal` nunca llaman `requestPermission`; solo `solicitarPermisoYRegistrar` (acción contextual) lo hace. |
| iOS recibe recordatorios push | **PASS** | Migración 50 aplicada; smoke `07_notificaciones_ios.sql` confirma dispositivos iOS incluidos en `reclamar_recordatorios_habitos`. |
| Compra cancelada/pendiente no acredita ni miente | **PASS** | `comprarPaquete` distingue completada/cancelada/pendiente/error; UI no acredita salvo `completada`, no muestra error en `cancelada`. |
| Webhook resuelve producto sin depender del cliente | **PASS** | `paquetes_gemas_iap_productos` + smoke `08_productos_iap_plataforma.sql`; falta cargar los product IDs reales de iOS cuando existan en App Store Connect. |
| `userInterfaceStyle` fijado en claro | **PASS** | `UIUserInterfaceStyle: 'Light'` confirmado en `expo config --type introspect`; `ui.ts` ignora `Appearance` (test + código). |
| Teclado no tapa botones (wizard) | **PASS (código)** / pendiente dispositivo | Root cause corregido (`behavior` real en Android dentro del Modal, sin duplicar el alto del teclado en el padding). Falta grabar el gate físico Android + iPhone SE. |
| Secretos de backend fuera del cliente | **PASS** | `supabase secrets list` vía Management API: Gemini/service-role/OneSignal REST/scheduler/webhook solo en Supabase Secrets; `scripts/validar-entorno-release.mjs` falla si detecta cualquiera en el entorno del cliente. |
| Entorno `production` de EAS completo | **Pendiente** | `eas.json` ya fija `environment` por perfil; falta cargar los valores reales en EAS Environment Variables y correr `eas env:list --environment production`. |
| Privacy Nutrition Label = build real | **Documentado, pendiente publicar** | `docs/app-store/privacy-inventory.md` listo; falta completarlo en App Store Connect y comparar. |
| Sin placeholders ni menciones a Android/Google Play visibles al usuario | **PASS (auditoría estática)** | `rg` encontró y corrigió "Google Play" fijo en Perfil (ahora `{{tienda}}` según plataforma). Sin "próximamente"/"coming soon" en flujos activos de compra. |

## P1

| Ítem | Estado | Evidencia |
|---|---|---|
| Paywall Horizon completo | **PASS** | Precio, duración, renovación automática, Restaurar, Gestionar suscripción (URL correcta por plataforma), Privacidad/Términos. |
| Permisos sin justificación | **PASS** | `expo-camera`/`expo-image-picker` desinstalados (sin consumidores); permiso de micrófono de `expo-audio` desactivado (la app solo reproduce audio). |
| Compatibilidad IPv6 DNS64/NAT64 | **Pendiente** | Sin endpoints IP/localhost en el código (verificado por `rg`); falta la prueba física en red IPv6-only. |
| Gemas no expiran / restauración no engañosa | **PASS** | El saldo vive en `comercio.billeteras_gemas` (servidor); "Restaurar" solo aplica a Horizon, nunca promete restaurar consumibles. |
| Cofres no son loot box comprable | **PASS** | Los cofres se ganan por progreso de hábito; nunca se compran ni consumen gemas (confirmado en el código de `registrar_progreso_habito`/`reclamar_cofre_sendero`). |

## Pendiente de acción externa (no automatizable desde este entorno)

- Crear productos IAP reales de iOS en App Store Connect + enlazarlos en RevenueCat y en `paquetes_gemas_iap_productos` (plataforma `ios`).
- Configurar APNs (.p8, Team ID, Key ID) en OneSignal para producción.
- Cuenta demo confirmada por contraseña + cuenta desechable para el flujo de borrado (ver `review-notes-en.md`).
- Completar App Privacy / Age Rating / App Review Information en App Store Connect.
- Builds `ios-simulator` y `production` vía `eas build`, matriz física (Task 12).
