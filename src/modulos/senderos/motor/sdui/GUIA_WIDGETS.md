# Biblioteca SDUI de Lestinaty

## Responsabilidades

- La libreria de widgets vive en `componentes/widgets/accion/`.
- El motor SDUI valida packs, resuelve el registro y procesa eventos.
- Un widget no navega, no consulta datos y no inventa titulos globales.
- El contenedor del nodo proporciona contexto, color, estado y accion de cierre.

## Contrato de un widget

Cada widget recibe `color`, `config`, `estado` y `onEvento` desde `WidgetAccionProps`.

- `estado: 'activo'`: permite interaccion.
- `estado: 'bloqueado'`: se ve gris y no responde al toque.
- `estado: 'completado'`: muestra su resultado sin reiniciar datos.

Al avanzar o terminar, llama `onEvento`. Nunca actualiza el progreso global por si mismo.

## Como agregar uno

1. Crea el componente en `componentes/widgets/accion/`.
2. Define su esquema Zod para `config`.
3. Registralo en `registroAcciones.ts` con componente, esquema y descripcion.
4. Agrega su ID a `IDS_WIDGET_ACCION` solo si no existe.
5. Prueba los tres estados: activo, bloqueado y completado.

## Limites de un nodo

- Un ActionPack tiene un widget principal.
- Puede incluir hasta dos widgets de apoyo.
- Un nodo tiene hasta tres tareas accionables.
- La IA solo produce IDs y configuraciones validadas; no genera JSX ni estilos.
