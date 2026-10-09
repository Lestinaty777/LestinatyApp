# Plantillas de rutinas con gemas

Parte de la [visión de Lestinaty](../../vision/lestinaty-vision.md) (cursos y marketplace) y de [Rutinas](2026-10-04-rutinas-design.md). Es el primer experimento barato para medir si la gente paga por un camino ya armado.

## Objetivo

Que la pestaña **Plantillas** de Rutinas ofrezca plantillas gratuitas y plantillas de pago que se compran con gemas, sin crear productos nuevos en las tiendas. El contenido vive en el servidor, así que se pueden añadir, cambiar de precio o retirar sin publicar una versión de la app.

## Decisiones

- **Contenido en el servidor**, no en el bundle: las plantillas de pago entregan sus pasos solo a quien las compró (por RLS, no por ocultar en la interfaz). Esto deja listo el camino a cursos y Senderos de pago.
- **Gemas, no dinero directo:** reutiliza la economía existente (RevenueCat → gemas → gastos). Mismo mecanismo que `comprar_semillas_arbol`.
- **Solo pasos propios** (simple, cronómetro, contador). Una plantilla nunca incluye hábitos o tareas, porque esos son de cada persona.
- **Una plantilla comprada es tuya para siempre** y se pueden crear varias rutinas desde ella. Se recupera en otro dispositivo porque la compra está en la cuenta.
- **Sin ventaja de progreso:** las plantillas no dan gemas, cofres ni niveles.
- **Las plantillas gratuitas** (las cuatro de antes) pasan al servidor con precio 0; ya no hay contenido de plantillas en el código de la app.
- **Sin creadores externos por ahora:** pagar a terceros con una moneda que se compra dentro de la app es un problema aparte. Solo plantillas de Lestinaty (`autor`).
- **Retirar una plantilla** = `activa = false`. Quien ya la compró la conserva; las compras impiden borrar la fila.

## Modelo (migración `20261009_80_plantillas_rutinas.sql`)

| Tabla | Contenido | Quién puede leer |
| --- | --- | --- |
| `rutinas_plantillas` | id estable, título, descripción, franja, ícono, autor, `precio_gemas` (0 = gratis), `num_pasos`, `duracion_min`, `activa`, `orden` | Cualquiera con sesión si `activa`; el dueño aunque esté apagada |
| `rutinas_plantillas_contenido` | `pasos` (jsonb, 1–20) | Solo si es gratis y activa, o si la compró |
| `rutinas_plantillas_compradas` | (usuario, plantilla, `precio_pagado`, fecha) | Solo el propio usuario |

- Ningún rol de la app puede escribir en las tres tablas: se revoca todo y solo se concede `select`. El catálogo y el contenido los escribe `service_role`/admin; las compras, solo el RPC.
- Un trigger valida cada paso (título, modo, objetivo numérico solo en cronómetro/contador) y calcula `num_pasos` y `duracion_min`.
- Ledger: nuevo motivo `gasto_plantilla_rutina`, referencia `plantilla-rutina:<id>`.

## RPCs

- `obtener_plantillas_rutinas()`: catálogo con `desbloqueada` y, solo si lo está, los `pasos`. Una llamada.
- `comprar_plantilla_rutina(p_plantilla_id)`: wrapper invoker sobre `comercio.comprar_plantilla_rutina` (security definer). Bloquea primero la billetera, así dos llamadas simultáneas se serializan y no se cobra dos veces. Comprar de nuevo, o una gratuita, no cobra. Sin gemas: `check_violation` ("No tienes gemas suficientes."), sin rastro.

## Interfaz

- Las bloqueadas muestran candado y precio. Al tocarlas se abre una vista previa con descripción, nº de pasos, duración y autor; **los nombres de los pasos no se muestran hasta desbloquear**.
- Si faltan gemas, el botón pasa a "Conseguir gemas" y lleva a la tienda. Mientras el saldo carga no se afirma que falten.
- Tras comprar se refrescan catálogo y saldo y se abre el asistente de creación con la plantilla cargada.

## Cómo añadir una plantilla premium

Ejemplo comentado al inicio de la migración 80. Es un `insert` en `rutinas_plantillas` más otro en `rutinas_plantillas_contenido`; no requiere publicar la app.

## Pruebas

- `supabase/tests/10_plantillas_rutinas.sql` (psql): validación de contenido, cálculo de pasos/duración, premium oculta antes de comprar y visible después, sin gemas, compra única y sin doble cobro, ledger, aislamiento entre cuentas, plantilla apagada, sin sesión y anon. Verificado en Postgres 16 local, no contra el proyecto real.
- Vitest: mapper de plantillas y resultado de compra, detección de "gemas insuficientes", paridad de i18n.

## Pendiente y fuera de alcance

- Precios y contenido real de las plantillas premium (decisión de producto; la migración solo incluye las cuatro gratuitas).
- Reembolsos, regalar plantillas, ofertas por tiempo limitado.
- Creadores externos, reparto de ingresos, moderación.
- Plantillas que propongan hábitos o tareas nuevas.
- Analítica de compras (qué se ve, qué se compra) para decidir el siguiente paso hacia cursos.
