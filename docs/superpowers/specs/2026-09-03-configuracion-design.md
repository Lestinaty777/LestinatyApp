# Configuracion De Cuenta, Privacidad Y Avisos

## Objetivo

Completar la sección `app/configuracion` para que una persona autenticada pueda
gestionar su perfil, consentimientos, avisos, solicitudes de privacidad,
documentos legales y sesión desde Expo sin acceder directamente al schema
`privacidad`.

## Alcance

La interfaz tendrá cinco bloques, en este orden:

1. **Cuenta**: correo de solo lectura, nombre visible editable, idioma, zona
   horaria, cambio de contraseña y cierre de sesión.
2. **Aby y tus datos**: los tres consentimientos existentes
   (`contexto_aby`, `procesar_fuentes`, `analitica_producto`).
3. **Avisos**: enlace a ajustes nativos y preferencias por tipo de aviso.
4. **Tus datos**: crear solicitudes idempotentes de exportación, corrección y
   eliminación; mostrar su estado activo.
5. **Legal**: mostrar los documentos activos y las aceptaciones actuales con
   versión y fecha reales.

No se incluirán compras, perfiles públicos, controles parentales ni funciones
de salud. Tampoco se expondrá el schema `privacidad` en la Data API.

## Arquitectura

Se creará un servicio tipado en `src/modulos/configuracion` que encapsule:

- Lectura y actualización de `public.perfiles_usuario`.
- RPCs públicas de permisos, solicitudes y aceptaciones.
- Lectura de `public.documentos_legales`,
  `public.catalogo_notificaciones` y
  `public.preferencias_notificacion_usuario`.
- Cierre de sesión mediante el servicio de acceso existente.

La pantalla no llama a Supabase de forma directa. Carga un estado único al
entrar, usa actualizaciones optimistas para toggles y revierte solo la sección
que falle. Cada mutación bloquea exclusivamente su propio control, no toda la
pantalla.

## Contrato Legal

`obtener_aceptaciones_legales()` debe proporcionar por aceptación:

- Identificador del documento.
- Código, versión e idioma del documento.
- Fecha de aceptación y origen.

Esto permite que la UI no invente campos como `version` o `created_at` que la
RPC actual no devuelve. La migración añadirá el contrato sin abrir las tablas
privadas al cliente.

## Estados Y Errores

- Carga inicial: esqueleto o indicador visual dentro de la misma pantalla.
- Error global de lectura: tarjeta de error y botón de reintento.
- Error de mutación: revertir el cambio afectado, haptic de advertencia y
  alerta breve.
- Solicitud activa: deshabilitar solamente esa acción y mostrar estado y fecha.
- Eliminación de cuenta: confirmación explícita antes de crear la solicitud.
- Sin sesión: mostrar un estado neutro y llevar a acceso, sin intentar RPCs.

## Diseño Visual

Se mantiene el lenguaje existente: fondo claro, `RecuadroGlass`, Montserrat,
iconos Lucide y acento verde. Las secciones se presentan como tarjetas de
cristal con icono, descripción clara y separadores suaves. Las acciones
destructivas se distinguen con rojo y nunca comparten aspecto con los toggles.

## Verificación

1. Pruebas unitarias para normalización de datos y cambios optimistas.
2. `npm run typecheck` y `npm test`.
3. Smoke test remoto existente para RPCs y RLS.
4. Smoke test de configuración autenticado que lea, modifique y revierta un
   perfil y preferencias temporales.
5. Renderizado en Expo Web y comprobación manual en Android/Expo Go.
