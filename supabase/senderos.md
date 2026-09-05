# Senderos de Estudio

## Proposito

Este documento describe el nucleo persistente de los caminos de aprendizaje de Lestinaty. No es un schema PostgreSQL: todas estas tablas viven en `public` y usan RLS para que cada persona solo pueda leer sus propios datos.

El MVP activo usa exclusivamente la categoria `estudio`.

## Jerarquia

```text
Meta -> Sendero -> Seccion -> Nodo
                              -> Cofre (asociado al nodo de evaluacion)
```

- Una **meta** agrupa un resultado de aprendizaje, por ejemplo, `Aprobar Anatomia I`.
- Un **sendero** es el camino que Aby genera para esa meta.
- Una **seccion** contiene el primer bloque de avance del sendero.
- Un **nodo** es una leccion o una evaluacion.
- Un **cofre** es una recompensa, no un nodo navegable.

## Tablas

| Tabla | Responsabilidad | Regla principal |
| --- | --- | --- |
| `metas` | Resultado de aprendizaje privado de una persona. | Pertenece directamente a `perfiles_usuario`. |
| `senderos` | Camino de estudio, estado y origen. | Pertenece a una meta y solo puede usar una categoria activa. |
| `sendero_niveles` | Secciones ordenadas de un sendero. | `numero` es unico por sendero. |
| `sendero_nodos` | Lecciones y evaluacion de cada seccion. | `orden` es unico por seccion y solo puede haber una evaluacion. |
| `sendero_conexiones` | Enlaces dirigidos del mapa entre nodos. | Ambos nodos deben pertenecer al mismo sendero. |
| `sendero_cofres` | Cofre de gemas por seccion. | Se vincula unicamente a la evaluacion de su misma seccion. |
| `aby_propuestas` | Borrador privado generado por Aby antes de confirmarse. | Solo su propietario puede leerlo. |
| `aby_generation_locks` | Bloqueo efimero por usuario durante una generacion. | No se expone a Expo; lo usa el servidor. |

## Invariantes

Una seccion pasa de `borrador` a `activo` solo cuando tiene:

- Cinco nodos con `tipo = leccion`.
- Un nodo con `tipo = evaluacion`.
- Un cofre asociado a ese nodo de evaluacion.

Al activarse, el contenido de sus nodos se vuelve inmutable. El progreso individual se agregara en una migracion posterior; nunca se escribira en el contenido del nodo.

## Estados

| Entidad | Estados |
| --- | --- |
| `metas` | `activa`, `archivada` |
| `senderos` | `borrador`, `activo`, `archivado` |
| `sendero_niveles` | `borrador`, `activo`, `cerrado` |
| `aby_propuestas` | `generando`, `lista`, `aceptada`, `rechazada`, `fallida`, `expirada` |

## Seguridad y acceso

- RLS está habilitado en todas las tablas personales.
- Expo puede leer Senderos propios, pero no insertar ni activar senderos, secciones, nodos, conexiones, cofres o propuestas.
- La creación sucede desde una Edge Function o RPC de servidor, que deriva la identidad del JWT y crea todos los registros en una sola transacción.
- `service_role` se usa únicamente en procesos de servidor; nunca en Expo.
- La propuesta se conserva en `aby_propuestas` hasta que el usuario la confirme explícitamente.

## Flujo de Aby

1. Aby recibe una configuración validada de estudio.
2. La Edge Function crea o actualiza una `aby_propuesta` privada.
3. La persona revisa la propuesta en Expo.
4. Una aceptación transaccional crea una meta semilla, un sendero, una sección, cinco lecciones, una evaluación, sus conexiones y un cofre.
5. La sección y el sendero se activan únicamente si todas las invariantes se cumplen.

La aceptación transaccional y el registro de progreso todavía están pendientes de implementación.

## Archivos relacionados

- Migración: `supabase/migrations/20260905_06_senderos_nucleo_estudio.sql`.
- Smoke test remoto: `supabase/tests/03_senderos_nucleo_remoto.mjs`.
- Modelo de producto: `docs/superpowers/specs/2026-08-31-progresion-senderos-metas-design.md`.
- Flujo de creación: `docs/superpowers/specs/2026-09-03-flujo-creacion-estudio-design.md`.
