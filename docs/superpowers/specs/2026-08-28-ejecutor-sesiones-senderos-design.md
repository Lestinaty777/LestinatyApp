# Ejecutor de sesiones de senderos

## Objetivo

Reemplazar el mapa vertical compartido y su componente `Nodo` por una experiencia de detalle propia de Lestinaty. Cada sendero se abre como una sesion accionable, no como un mapa gamificado.

## Alcance

- Mantener la biblioteca de categorias y sus animaciones progresivas en `Mis senderos`.
- Las tarjetas de sendero abren `/senderos/[id]`.
- El detalle presenta una sesion en un solo contenedor, dividido en tres franjas horizontales.
- Eliminar `MapaCompartido` y el `Nodo` anterior, que solo eran usados por ese mapa.
- La pestaña `Hoy` y el detalle deben abrir la misma sesion diaria; completar en un lugar actualiza el otro.

## Experiencia

### Franja superior

Ocupa aproximadamente el 22% del detalle. Muestra titulo, categoria, racha, progreso total e ilustracion parcial. No contiene acciones de completado.

### Franja central

Ocupa aproximadamente el 30%. Un `FlatList` horizontal de nodos con tres elementos visibles: anterior, actual y siguiente. El nodo actual se centra al abrir y despues de completar un paso. Una linea queda detras de los nodos y se ilumina brevemente solo en el tramo que avanza.

### Franja inferior

Ocupa aproximadamente el 48%. Un panel glass muestra el paso seleccionado: titulo, descripcion, metadata y una accion primaria. El panel cambia con una unica transicion breve de opacidad y desplazamiento vertical.

## Estados de sesion

- `programada`: aun no corresponde. El detalle muestra el plan y la proxima fecha; no ofrece completar pasos.
- `disponible`: corresponde hoy. El usuario puede iniciar la sesion desde `Hoy` o desde `Mis senderos`.
- `en-progreso`: conserva el paso actual y ofrece continuar desde ambas entradas.
- `completada`: muestra el resultado y la proxima programacion.

Iniciar desde `Mis senderos` nunca crea una segunda sesion. Se obtiene o crea la instancia correspondiente al dia y se navega al mismo ejecutor que usa `Hoy`.

## Componentes

- `DetalleSenderoPantalla`: carga el sendero por id y compone las tres franjas.
- `SesionSendero`: resuelve la sesion actual y coordina seleccion y completado de pasos.
- `CarrilPasosSendero`: `FlatList` horizontal con `getItemLayout`, centrado inicial y `scrollToIndex`.
- `NodoPasoSendero`: componente puramente visual y presionable. Estados: bloqueado, disponible, actual y completado. No contiene tooltip ni botones.
- `PanelPasoSendero`: panel inferior con el contenido y la accion del paso.
- Datos de senderos: se extraen de `SenderosPantalla` a un modulo compartido para que biblioteca, detalle y `Hoy` lean la misma definicion.

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

- Añadir pruebas de modelo para transiciones de sesion y bloqueo de pasos cuando se incorpore runner de pruebas.
- En esta base sin runner, verificar TypeScript con `npm run typecheck` y probar manualmente en Expo Go: apertura desde biblioteca, inicio, completado, auto-centrado, regreso y estado compartido con `Hoy`.
