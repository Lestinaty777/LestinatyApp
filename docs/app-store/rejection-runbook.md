# Runbook de rechazo de App Review

Para cada mensaje de Apple: registrar guideline citada, build number,
dispositivo/OS del revisor (si lo menciona), pasos para reproducir, y la
evidencia que se adjunte en la respuesta. Responder en inglés, con hechos y
un adjunto (screenshot/video) — nunca "funciona en mi dispositivo" sin
evidencia, y nunca cambiar configuración remota (flags, RevenueCat,
OneSignal) mientras el build sigue In Review.

## Tres rutas rápidas

```text
Binary rejected: reproduce -> fix -> new build number -> attach video -> resubmit.
IAP item rejected: fix metadata/product; remove it only if the binary hides that purchase.
Policy disagreement: answer with exact guideline + evidence; appeal after one clear Resolution Center exchange.
```

## Causas más probables para Lestinaty y su respuesta preparada

| Guideline | Causa | Qué revisar primero | Evidencia a adjuntar |
|---|---|---|---|
| 2.1 | Crash o pantalla en blanco al abrir | Cold start del build exacto enviado, con la cuenta demo, en red normal y sin red | Video del crash reproducido + logs sin secretos |
| 2.1 | El revisor no pudo iniciar sesión | Confirmar que la cuenta demo sigue activa, con contraseña (no OTP) y datos sembrados | Captura de login exitoso desde una instalación limpia |
| 3.1.1 / 3.1.2 | Objeción a gemas/cofres o a Horizon | Confirmar que los cofres se ganan gratis por progreso (nunca se compran) y que el paywall muestra precio/duración/renovación automática | Video del flujo de cofre gratuito + captura del paywall |
| 4.8 | Aparece Google en iOS | `rg "google-signin"` contra el export iOS y el JSON de autolinking iOS — debe salir vacío | Salida del comando + Review Notes explicando "email/password only on iOS" |
| 5.1.1(v) | "Eliminar cuenta" no borra de verdad | Repetir la prueba con una cuenta desechable: confirmar en Supabase que `auth.users` y sus datos desaparecieron | Captura del flujo + resultado de la verificación en base de datos |
| 5.1.1 | Nutrition Label no coincide con el build | Comparar `docs/app-store/privacy-inventory.md` contra el cuestionario publicado en App Store Connect | Captura del cuestionario publicado junto al inventario |
| 2.3 | Metadata/capturas muestran Android, Google Play o funciones ausentes | Revisar que las capturas sean del build iOS final, sin barra Android ni menciones a Google Play | Comparación pantalla-a-pantalla |

## Al recibir un rechazo

1. Reproducir exactamente los pasos que describe Apple, en el mismo tipo de
   build (TestFlight/production) si es posible.
2. Si el binario realmente falla: corregir, subir un build nuevo con
   número incrementado, adjuntar video de la corrección funcionando.
3. Si el ítem IAP fue rechazado por metadata: corregirla en App Store
   Connect; solo retirarlo de la submission si el binario deja de exponer
   esa compra.
4. Si es una discrepancia de interpretación y el binario ya cumple:
   responder en Resolution Center citando la guideline exacta más la
   evidencia; apelar solo después de un intercambio claro sin resolución.
5. Registrar el resultado acá (fecha, build, guideline, resolución) — sin
   credenciales ni datos personales.
