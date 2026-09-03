# Configuracion De Cuenta, Privacidad Y Avisos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar una configuración móvil funcional para perfil, privacidad, notificaciones, documentos legales y sesión.

**Architecture:** `src/modulos/configuracion` contendrá tipos, normalizadores y un servicio que sea la única capa que consulte Supabase. La pantalla consumirá ese servicio, mantendrá mutaciones aisladas por control y usará RPCs públicas para todo dato del schema `privacidad`.

**Tech Stack:** Expo Router, React Native, TypeScript estricto, Supabase JS, Vitest, Lucide React Native, Expo Haptics y Expo Blur.

**Spec:** `docs/superpowers/specs/2026-09-03-configuracion-design.md`

## Global Constraints

- No exponer el schema `privacidad` en Supabase Data API.
- Nunca enviar `usuario_id` desde Expo: la identidad procede del JWT de Supabase.
- Mantener soporte nativo Android/iOS y web sin depender de APIs exclusivas.
- Usar `RecuadroGlass`, Montserrat, iconos Lucide y el lenguaje visual claro existente.
- No introducir `any`; las respuestas de RPC se validan/normalizan en el servicio.
- La eliminación de cuenta solo crea una solicitud; no borra datos desde el cliente.

---

### Task 1: Enriquecer El Contrato De Aceptaciones Legales

**Files:**
- Create: `supabase/migrations/20260903_05_enriquecer_aceptaciones_legales.sql`
- Modify: `supabase/tests/02_plataforma_privacidad_remoto.mjs`
- Modify: `supabase/privacidad-schema.md`

**Interfaces:**
- Produces: `public.obtener_aceptaciones_legales(): jsonb` con `documento_id`, `codigo`, `version`, `idioma`, `url_publica`, `aceptado_at` y `origen`.
- Consumes: `privacidad.aceptaciones_documentos_legales` y `public.documentos_legales`.

- [ ] **Step 1: Extender la aserción remota antes de migrar**

En `02_plataforma_privacidad_remoto.mjs`, tras leer aceptaciones, exigir la forma legal:

```js
assert(
  acceptances.length === 1
    && acceptances[0].documento_id === documentId
    && acceptances[0].codigo === 'privacidad'
    && acceptances[0].version.startsWith('remote-smoke-')
    && acceptances[0].aceptado_at,
  'Legal acceptance must expose its active document metadata.',
);
```

- [ ] **Step 2: Ejecutar el smoke remoto y confirmar el fallo de contrato**

Run: `node supabase/tests/02_plataforma_privacidad_remoto.mjs`

Expected: FAIL porque la RPC todavía no devuelve `codigo`, `version` ni `url_publica`.

- [ ] **Step 3: Crear la migración de contrato**

Crear la función privada como `security definer` con `set search_path = ''`:

```sql
create or replace function privacidad.obtener_mis_aceptaciones_legales()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'documento_id', aceptacion.documento_id,
      'codigo', documento.codigo,
      'version', documento.version,
      'idioma', documento.idioma,
      'url_publica', documento.url_publica,
      'aceptado_at', aceptacion.aceptado_at,
      'origen', aceptacion.origen
    ) order by aceptacion.aceptado_at desc),
    '[]'::jsonb
  )
  from privacidad.aceptaciones_documentos_legales as aceptacion
  join public.documentos_legales as documento on documento.id = aceptacion.documento_id
  where aceptacion.usuario_id = auth.uid();
$$;
```

Revocar a `public, anon` y conceder `execute` solo a `authenticated, service_role`. El wrapper `public.obtener_aceptaciones_legales()` no cambia.

- [ ] **Step 4: Actualizar documentación de privacidad**

Documentar los campos públicos mínimos de la aceptación, sin documentar ni exponer el schema privado.

- [ ] **Step 5: Ejecutar migración y test remoto**

Run migration in Supabase SQL Editor, then: `node supabase/tests/02_plataforma_privacidad_remoto.mjs`

Expected: PASS con usuarios, documento y datos temporales eliminados.

### Task 2: Crear Contrato Tipado Y Servicio De Configuración

**Files:**
- Create: `src/modulos/configuracion/configuracion.tipos.ts`
- Create: `src/modulos/configuracion/configuracion.normalizar.ts`
- Create: `src/modulos/configuracion/configuracion.normalizar.test.ts`
- Create: `src/modulos/configuracion/configuracion.servicio.ts`

**Interfaces:**
- Produces: `cargarConfiguracion()`, `actualizarPerfil()`, `actualizarPermisosDatos()`, `actualizarPreferenciaNotificacion()`, `crearSolicitudPrivacidad()` y `cerrarSesion()`.
- Produces: tipos `ConfiguracionUsuario`, `PermisosDatos`, `PreferenciaNotificacion`, `DocumentoLegal`, `AceptacionLegal` y `SolicitudPrivacidad`.
- Consumes: las RPC públicas existentes y `obtenerClienteSupabase()`.

- [ ] **Step 1: Escribir el test de normalización**

```ts
import { describe, expect, it } from 'vitest';
import { normalizarAceptacionesLegales, normalizarSolicitudesPrivacidad } from './configuracion.normalizar';

describe('configuracion.normalizar', () => {
  it('descarta respuestas legales incompletas', () => {
    expect(normalizarAceptacionesLegales([{ documento_id: 'a' }])).toEqual([]);
  });

  it('conserva solo solicitudes activas reconocidas', () => {
    expect(normalizarSolicitudesPrivacidad([{ id: 'x', tipo: 'exportacion', estado: 'pendiente', solicitada_at: '2026-09-03T00:00:00Z' }])).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Ejecutar el test para confirmar que falla**

Run: `npx vitest run src/modulos/configuracion/configuracion.normalizar.test.ts`

Expected: FAIL porque el módulo aún no existe.

- [ ] **Step 3: Definir tipos y normalizadores puros**

Usar uniones literales para `tipo` (`exportacion | eliminacion | correccion`) y `estado`. Los normalizadores deben aceptar `unknown`, comprobar cada campo y devolver arreglos vacíos ante datos no confiables.

- [ ] **Step 4: Implementar el servicio de Supabase**

`cargarConfiguracion()` ejecuta en paralelo perfil, permisos, documentos, aceptaciones, solicitudes, catálogo y preferencias. Las operaciones de actualización filtran por la fila propia mediante RLS, no con id recibido de la pantalla.

- [ ] **Step 5: Ejecutar tests del módulo**

Run: `npx vitest run src/modulos/configuracion/configuracion.normalizar.test.ts`

Expected: PASS.

### Task 3: Reemplazar La Pantalla De Privacidad Por Una Pantalla Completa

**Files:**
- Create: `src/modulos/configuracion/configuracion.presentacion.ts`
- Create: `src/modulos/configuracion/configuracion.presentacion.test.ts`
- Modify: `src/modulos/direccion/pantallas/ConfiguracionPrivacidadPantalla.tsx`
- Modify: `app/configuracion/index.tsx`
- Modify: `app/configuracion/_layout.tsx`

**Interfaces:**
- Consumes: servicio y tipos de `src/modulos/configuracion`.
- Consumes: `cerrarSesion()` de `src/modulos/acceso/acceso.servicio.ts`.
- Produces: ruta funcional `/configuracion` y subruta `/configuracion/privacidad`.

- [ ] **Step 1: Escribir la prueba de las decisiones de UI puras**

Crear `src/modulos/configuracion/configuracion.presentacion.test.ts` para probar:

```ts
expect(etiquetaSolicitudActiva({ tipo: 'eliminacion', estado: 'pendiente' })).toBe('Solicitud de eliminación pendiente');
expect(etiquetaSolicitudActiva(null)).toBeNull();
expect(puedeEditarPreferencia('hoy_sesion_inicio')).toBe(true);
```

- [ ] **Step 2: Ejecutar el test y confirmar fallo**

Run: `npx vitest run src/modulos/configuracion/configuracion.presentacion.test.ts`

Expected: FAIL porque el módulo de presentación no existe.

- [ ] **Step 3: Implementar helpers de presentación**

Crear `configuracion.presentacion.ts` con etiquetas de solicitud, formato de fecha mediante `Intl.DateTimeFormat('es')` y grupos de avisos. No colocar lógica de Supabase en este archivo.

- [ ] **Step 4: Implementar pantalla visual y estados**

Reescribir `ConfiguracionPrivacidadPantalla.tsx` con estos bloques:

```text
Cuenta -> perfil editable, correo, idioma/zona horaria, contraseña y cerrar sesión
Aby y tus datos -> tres Switch con mutación independiente
Avisos -> ajustes nativos + toggles por catálogo
Tus datos -> exportar, corregir, eliminar con confirmación
Legal -> documentos activos y aceptaciones con versión y fecha
```

Usar `useEffectEvent` para acciones que leen el último estado, `Animated` para entrada de secciones, `hapticSeguro('toggle')` para toggles y `hapticSeguro('accion')` para filas. Al fallar una mutación, restaurar solo el valor anterior de esa fila.

- [ ] **Step 5: Conectar rutas y menú**

El menú de `/configuracion` debe llevar a la pantalla completa. Mantener `/configuracion/privacidad` como enlace directo a la sección de privacidad hasta que una navegación anclada sea necesaria; no duplicar datos ni lógica.

- [ ] **Step 6: Ejecutar pruebas de presentación**

Run: `npx vitest run src/modulos/configuracion/configuracion.presentacion.test.ts`

Expected: PASS.

### Task 4: Validar Integración Y Regresión

**Files:**
- Modify: `supabase/resumen.md`

**Interfaces:**
- Consumes: migración 05, pantalla y smoke remoto.
- Produces: documentación con el orden de ejecución y cobertura comprobable.

- [ ] **Step 1: Añadir migración 05 a la documentación**

Incluir la descripción exacta: "Enriquece las aceptaciones legales con metadatos del documento para la UI autenticada".

- [ ] **Step 2: Ejecutar validación estática completa**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 3: Ejecutar todas las pruebas unitarias**

Run: `npm test`

Expected: exit code 0.

- [ ] **Step 4: Ejecutar smoke remoto completo**

Run: `node supabase/tests/02_plataforma_privacidad_remoto.mjs`

Expected: `Remote privacy smoke test passed.`

- [ ] **Step 5: Validar el renderizado web**

Run: `npx expo start --web`

Expected: la ruta `/configuracion` carga sin error rojo y permite navegar a privacidad; detener el servidor tras la comprobación.
