# Ejecutor de sesiones de senderos

## Objetivo

Reemplazar el mapa vertical compartido y su componente `Nodo` por una experiencia de detalle propia de Lestinaty. Cada sendero se abre como una sesion accionable, no como un mapa gamificado.

## Alcance

- Mantener la biblioteca de categorias y sus animaciones progresivas en `Mis senderos`.
- Las tarjetas de sendero abren `/senderos/[id]`.
- Al abrir una tarjeta, la biblioteca se desenfoca brevemente, el encabezado de Senderos se contrae y se navega al espacio de trabajo.
- El detalle presenta una sesion en un solo contenedor, dividido en tres franjas horizontales.
- Eliminar `MapaCompartido` y el `Nodo` anterior, que solo eran usados por ese mapa.
- Esta primera entrega usa pasos mock y estado local del detalle. La persistencia, base de datos e integracion con `Hoy` se definen despues.

## Experiencia

### Franja superior

Ocupa aproximadamente el 22% del detalle. Muestra regreso, titulo, categoria, racha, progreso total e ilustracion parcial propia del sendero. `senderos.png` no persiste como fondo bloqueado; se desvanece durante la transicion. No contiene acciones de completado.

### Franja central

Ocupa aproximadamente el 30%. Un `FlatList` horizontal de nodos con tres elementos visibles: anterior, actual y siguiente. El nodo actual se centra al abrir y despues de completar un paso. Una linea queda detras de los nodos y se ilumina brevemente solo en el tramo que avanza.

### Franja inferior

Ocupa aproximadamente el 48%. Es un espacio de trabajo contextual: conserva cabecera con titulo y progreso, y monta un unico widget principal del nodo. El panel cambia con una unica transicion breve de opacidad y desplazamiento vertical.

Los widgets pequenos se ejecutan dentro de la franja: temporizador, check, selector, registro de gasto o matriz Eisenhower. Un Kanban completo comienza compacto y ofrece abrir un modo foco de pantalla completa; no se incrusta un tablero completo dentro de la franja.

## Estados de sesion futuros

- `programada`: aun no corresponde. El detalle muestra el plan y la proxima fecha; no ofrece completar pasos.
- `disponible`: corresponde hoy. El usuario puede iniciar la sesion desde `Hoy` o desde `Mis senderos`.
- `en-progreso`: conserva el paso actual y ofrece continuar desde ambas entradas.
- `completada`: muestra el resultado y la proxima programacion.

Cuando exista base de datos, iniciar desde `Mis senderos` nunca creara una segunda sesion. En esta entrega, el estado solo vive mientras la pantalla de detalle esta montada.

## Componentes

- `DetalleSenderoPantalla`: carga el sendero por id y compone las tres franjas.
- `DetalleSenderoPantalla`: coordina seleccion y completado de pasos mock locales.
- `CarrilPasosSendero`: `FlatList` horizontal con `getItemLayout`, centrado inicial y `scrollToIndex`.
- `NodoPasoSendero`: componente puramente visual y presionable. Estados: bloqueado, disponible, actual y completado. No contiene tooltip ni botones.
- `PanelPasoSendero`: panel inferior con el contenido y la accion del paso.
- Datos de senderos: se extraen de `SenderosPantalla` a un modulo compartido para que biblioteca y detalle lean la misma definicion.

## Animacion y rendimiento

- Conservar la carga progresiva existente de la biblioteca.
- Usar una animacion corta para completar: haptic, relleno de nodo, avance de linea y centrado del siguiente paso.
- No usar mapas SVG largos, posiciones sinusoidales, tooltips dentro de nodos ni bucles decorativos en el ejecutor.
- El carril usa una sola lista horizontal y medidas fijas para rendimiento estable en Android.

## Errores y limites

- Si el id no existe, mostrar estado vacio con retorno a `Mis senderos`.
- Si no existe sesion para el dia, mostrar proxima programacion sin accion de completar.
- Si un paso ya esta completado, permitir revisarlo sin volver a ejecutar la accion.
- Los nodos futuros no se pueden completar hasta que el paso anterior termine, salvo que la configuracion del sendero habilite orden flexible.

## Verificacion

- Añadir pruebas de modelo para transiciones de sesion cuando se incorpore base de datos y runner de pruebas.
- En esta base sin runner, verificar TypeScript con `npm run typecheck` y probar manualmente en Expo Go: apertura desde biblioteca, completado local, auto-centrado y regreso.
