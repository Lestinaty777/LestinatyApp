# Agente conversacional Aby

## Objetivo

Reemplazar la pestaña principal `Tienda` por Aby, el guia conversacional de Lestinaty. Aby recopila el contexto mediante chat y respuestas visuales, genera una propuesta completa de sendero y entrega datos estructurados que la app puede validar antes de guardar.

## Alcance de la primera entrega

- Mantener la ruta `/(principal)/tienda` de forma temporal para no romper enlaces existentes, pero cambiar su icono, titulo y contenido a Aby.
- El icono central pasa de `Storefront` a un heptagono propio, como referencia a los siete biomas/categorias.
- Mostrar una pantalla conversacional visual con un saludo de Aby, entrada de texto, cards de ejemplos y respuestas de seleccion.
- Mantener las siete categorias existentes como unico espacio de clasificacion: `rutinas`, `salud`, `tareas`, `habitos`, `relaciones`, `finanzas` y `estudio`.
- Usar Gemini para guiar preguntas adaptativas y generar propuestas estructuradas que la app pueda validar antes de guardar.
- Usar la Edge Function de Supabase como unico lugar permitido para llamar a Gemini. La app Expo nunca contiene `GEMINI_API_KEY`.

## Fuera de alcance

- Persistencia de conversaciones, preferencias y senderos hasta que la persona confirme explicitamente una propuesta.
- Metas de largo plazo, hitos y senderos vinculados. Aby convierte temporalmente una meta amplia en un primer sendero concreto dentro de las siete categorias.
- Cobros, catalogo de tienda o funciones premium. La tienda solo se mostrara despues como recomendacion contextual del agente.
- Llamadas reales a Gemini antes de que el flujo mock se pruebe en Expo Go.
- Generacion o animacion de Aby 3D. La UI acepta un asset futuro, pero funciona con un placeholder mientras se exportan poses individuales.
- Edicion completa de un sendero creado y sincronizacion con `Hoy`.

## Navegacion y lenguaje

La pestaña central conserva el identificador y ruta `tienda` durante esta fase. Su etiqueta visible sera `Aby`; su icono sera un heptagono. `Ruta` se mantiene intacta.

La pantalla no se comporta como un chat abierto. Es un constructor conversacional visual: cada turno debe avanzar hacia una decision, una propuesta o una correccion de la propuesta. Aby usa mensajes breves y nunca solicita informacion que el usuario ya proporciono.

## Flujo de creacion

### Estado inicial

La cabecera muestra la pose `aby-saludando` cuando exista. El primer mensaje es `Que quieres construir hoy?`. Debajo se ofrecen estas cards de inicio:

- Hacer ejercicio.
- Dormir mejor.
- Planificar mi semana.
- Crear un habito.
- Organizar mis finanzas.
- Otro objetivo.

La caja de texto siempre esta disponible. Tocar una card agrega el objetivo equivalente como mensaje del usuario y avanza a la siguiente pregunta.

### Preguntas adaptativas

El cuestionario inicial puede orientar a quien no sabe que crear, pero Gemini dirige el resto de la entrevista. Cada respuesta llega como JSON validado y contiene un mensaje corto mas, opcionalmente, una sola `PreguntaVisual` de tipo `cards`, `chips`, `dias` o texto libre.

Gemini debe recopilar solo la informacion que falte para una propuesta sostenible: objetivo concreto, categoria permitida, tipo ciclico o finito cuando aplique, frecuencia, tiempo real disponible, restricciones y barreras. No repite una pregunta respondida ni emite JSX, estilos o acciones fuera del contrato. La aplicacion conserva el historial reducido y responde a las cards localmente.

Si la persona pide una meta amplia como `crear mi SaaS`, Aby explica que iniciara por un primer sendero concreto, por ejemplo `Validar la idea del SaaS`, clasificado en una de las siete categorias. No crea una entidad Meta en esta fase.

### Propuesta

Cuando Gemini considera que tiene contexto suficiente, devuelve una propuesta temporal y Aby pregunta: `Preparé este sendero para ti. ¿Te funciona?`. Debajo del mensaje aparece un contenedor de vista previa con categoria, subcategoria, titulo, descripcion, frecuencia, duracion, 3 a 5 nodos y los widgets de cada nodo. La propuesta contiene:

- Titulo y descripcion.
- Categoria y subcategoria validas.
- Tipo de sendero y programacion.
- Entre 3 y 5 nodos.
- Un `ActionPack` por nodo con exactamente un widget principal y hasta dos de apoyo.

El usuario puede elegir `Sí, crear sendero`, `Ajustar` o `Empezar de nuevo`. `Ajustar` conserva el contexto y permite que Gemini haga una pregunta de seguimiento; `Empezar de nuevo` descarta la propuesta. La propuesta no se persiste hasta la confirmacion explicita de `Sí, crear sendero`.

## Modelo de datos

`ConfiguracionConversacionAby` contiene los datos estructurados explicitamente confirmados por el usuario. Gemini puede incluir contexto conversacional adicional limitado en el historial, pero no puede escribir campos fuera de este contrato:

```ts
type TipoSenderoAby = 'ciclico' | 'finito';

type ConfiguracionConversacionAby = {
  diasSemana: number[];
  duracionMinutos: number | null;
  objetivo: string;
  tipo: TipoSenderoAby | null;
};
```

`RespuestaAgenteAby` separa el texto de Aby de una accion visual segura:

```ts
type RespuestaAgenteAby = {
  mensaje: string;
  tipo: 'mensaje' | 'pregunta' | 'resumen' | 'propuesta';
  pregunta?: PreguntaVisual;
  propuesta?: PropuestaSenderoAby;
};
```

`PropuestaSenderoAby` se valida con Zod antes de llegar a la UI. Debe reutilizar `ActionPack`, `WidgetAccionId` y `validarActionPack` del motor SDUI. Ninguna respuesta de modelo entrega JSX, estilos, rutas arbitrarias o identificadores de widgets fuera del registro.

## Integracion futura con Gemini

La app llama a una Edge Function autenticada de Supabase, por ejemplo `generar-sendero-aby`, en cada turno adaptativo. Esta funcion:

1. Recibe historial reducido, respuestas visuales confirmadas y `ConfiguracionConversacionAby` parcial.
2. Agrega el catalogo de categorias, subcategorias y widgets permitidos desde una version de servidor del contrato.
3. Llama a Gemini con salida JSON estructurada y un schema de respuesta que permite un turno de pregunta o una propuesta temporal.
4. Valida la respuesta con Zod y limites de producto.
5. Devuelve una `RespuestaAgenteAby` o un error seguro para mostrar al usuario.

`GEMINI_API_KEY` existe solo en secretos de Supabase/servidor. No se coloca en `.env` expuesto por Expo, `app.json`, `EXPO_PUBLIC_*` ni codigo cliente.

La funcion impone limites de coste y abuso: usuario autenticado, maximo un pedido en curso por usuario, limite de mensajes y timeout. Si Gemini falla o la respuesta no valida, la app conserva la conversacion y ofrece reintentar; no crea un sendero parcial.

## Componentes

- `AgenteAbyPantalla`: compone safe area, cabecera, historial, compositor de respuestas y entrada.
- `AvatarAby`: presenta una pose PNG opcional y placeholder visual mientras los renders no existan.
- `MensajeAby`: burbuja textual de Aby.
- `PreguntaVisualAby`: cards/chips para una sola decision.
- `ResumenSenderoAby`: contexto confirmado y acciones de ajuste para la propuesta temporal.
- `PropuestaSenderoAby`: previsualizacion compacta del sendero generado.
- `estadoConversacionAby`: reducer local, puro y testeable; conserva respuestas confirmadas, propuesta temporal y estado de carga, sin llamar a Gemini.
- `contratoAby`: tipos y schemas Zod compartidos por mock y por la futura respuesta remota.

## Animacion y rendimiento

- Usar `Animated` con driver nativo para entrada de burbujas, cards y heptagono; no usar animacion 3D en runtime.
- Renderizar el historial con `FlatList` si supera seis mensajes.
- Las cards de respuesta aparecen de forma escalonada, pero solo se montan para el turno activo.
- La pose de Aby se muestra como PNG prerenderizado y optimizado. No se carga la lamina de referencias `aby.png` como avatar final.
- Cada interaccion usa `hapticSeguro('seleccion')`; `Crear mi sendero` usa `hapticSeguro('confirmacion')`.

## Accesibilidad y compatibilidad

- Todo chip, card y boton debe tener `accessibilityRole`, etiqueta y estado seleccionado.
- El chat debe mantener la entrada visible sobre el teclado mediante `KeyboardAvoidingView` y contenido desplazable.
- Respetar safe areas y la barra inferior compacta en Android e iOS.
- No depender de blur obligatorio para lectura: texto y cards deben conservar contraste sobre fondo claro.

## Verificacion

- Probar el reducer con configuracion inicial, respuesta de card, respuesta textual, propuesta temporal, ajuste y descarte.
- Probar schemas Zod contra widget invalido, mas de tres widgets, sin widget principal y categoria inexistente.
- Ejecutar `npm run typecheck` y `git diff --check` en cada tarea.
- Prueba manual en Expo Go Android: seleccionar una card, responder una pregunta adaptativa, ajustar una propuesta, descartarla, confirmar otra y cambiar a las otras cuatro tabs sin conservar estado visual roto.
