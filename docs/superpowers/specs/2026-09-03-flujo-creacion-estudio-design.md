# Flujo de creación de senderos de estudio

## Objetivo

Reorientar la pantalla central de Aby hacia el MVP universitario de Lestinaty. La
persona debe poder iniciar un sendero de estudio personalizado para aprobar un
examen, dominar una materia, construir un hábito de estudio u organizar su
rutina, sin perder la identidad visual existente de la pantalla.

## Mensaje de producto

El mensaje principal será:

> Aprueba tus exámenes con un plan hecho para ti.

El texto de apoyo será:

> Cuéntale a Lestinaty qué necesitas estudiar.

Lestinaty no promete conocer el contenido exacto de cualquier examen. Construye
planes basados en el alcance, fecha, tiempo disponible y material que la persona
aporte.

## Entrada visual

La ruta actual `/(principal)/tienda` seguirá mostrando `AgenteAbyPantalla`, pero
dejará de presentar las siete categorías generales como punto de entrada.

Se conserva el fondo pastel, los árboles, la mandala, la aurora y las
animaciones progresivas existentes. El centro de la pantalla tendrá:

1. Título y subtítulo de estudio.
2. Campo de texto con ejemplo adaptado a la intención activa.
3. Cuadrícula de cuatro tarjetas `RecuadroGlass`, dos columnas por dos filas.
4. Enlace secundario `No sé por dónde empezar` para descubrimiento guiado.

Las tarjetas no son tabs de navegación. Seleccionan la intención con la que Aby
inicia el flujo.

| Intención | Color | Icono | Descripción |
| --- | --- | --- | --- |
| Tengo un examen | Azul | `FileText` | Prepárate con un plan hasta tu fecha. |
| Dominar una materia | Verde | `GraduationCap` | Construye bases tema por tema. |
| Hábito de estudio | Amarillo | `Flame` | Estudia con constancia cada semana. |
| Organizar mi rutina | Rojo coral | `CalendarClock` | Ordena sesiones, prioridades y descansos. |

En estado base las tarjetas son blancas y translúcidas. Al seleccionarse, la
tarjeta conserva el vidrio pero incorpora borde, halo e iluminación interna del
color de su intención. El texto no pasa a blanco sobre un bloque saturado: se
mantiene legible y coherente con el lenguaje glass.

## Contrato mínimo de un sendero de estudio

Antes de proponer un sendero, Aby obtiene progresivamente estos cinco datos:

1. Materia y objetivo.
2. Fuentes disponibles: libro, ISBN, foto del índice, temario, guía,
   diapositivas o apuntes.
3. Alcance evaluado: unidades o capítulos.
4. Fecha del examen y disponibilidad semanal.
5. Nivel de partida mediante autopercepción o evaluación diagnóstica.

No se presenta un formulario largo. Aby pregunta solamente el dato faltante más
relevante para la intención elegida y conserva las respuestas durante el flujo.

## Flujos

### Tengo un examen

1. Identificar materia y fecha.
2. Pedir alcance: unidades o capítulos evaluados.
3. Pedir fuente opcional: ISBN, índice, temario o material autorizado.
4. Solicitar disponibilidad y nivel inicial.
5. Proponer un sendero de preparación, práctica y repaso.

### Dominar una materia

1. Identificar materia y meta de dominio.
2. Pedir fuente, temario o unidades a cubrir.
3. Solicitar disponibilidad y nivel inicial.
4. Proponer un sendero secuencial por conceptos y prerrequisitos.

### Hábito de estudio

1. Definir materia o foco de estudio.
2. Preguntar frecuencia, días y duración.
3. Identificar principal obstáculo de consistencia.
4. Proponer un sendero cíclico con repasos.

### Organizar mi rutina

1. Identificar materias, entregas o exámenes próximos.
2. Pedir disponibilidad semanal y restricciones.
3. Proponer bloques de estudio, descansos y prioridades.

## Fuentes y derechos de autor

El ISBN, título o portada solo se usan para recuperar metadatos legítimos: título,
autor, edición, editorial, área y descripción. La foto del índice permite
identificar el alcance de un libro sin requerir el libro completo.

Lestinaty no busca, descarga, almacena ni reproduce copias no autorizadas de
libros comerciales. Puede usar recursos abiertos, material con licencia, fuentes
públicas autorizadas o material que la persona declara tener derecho a aportar.
El resultado debe ser un plan, explicaciones y ejercicios originales, no una
reproducción del libro.

## Técnicas de estudio

Las técnicas de estudio no son una quinta intención. Son herramientas que Aby
recomienda dentro de un sendero, por ejemplo recuperación activa, repetición
espaciada, Pomodoro, mapas conceptuales o práctica de problemas. Más adelante
podrán tener una biblioteca dedicada, sin alterar la entrada principal.

## Arquitectura propuesta

Se separará el estado actual de categorías generales del nuevo dominio de estudio:

- Un catálogo tipado de `intencionesEstudioAby` define id, color, icono, título,
  descripción, ejemplo de input y primer paso.
- Un componente visual de tarjetas consume exclusivamente ese catálogo.
- El estado conversacional incorpora `intencionEstudio` y respuestas tipadas del
  contrato mínimo.
- El contrato de Aby distingue preguntas por intención y valida las respuestas
  antes de solicitar la propuesta remota.
- La integración remota recibe una estructura de estudio, no un texto libre de
  hábitos genéricos.

La configuración visual de árboles y fondo se conserva y queda independiente de
la intención. El azul académico será el acento inicial sin selección.

## Manejo de fallos

- Si falla la consulta bibliográfica, Aby permite continuar con título y tema
  escritos manualmente.
- Si una foto del índice no se puede leer, se pide una imagen más nítida o la
  transcripción manual de unidades.
- Si la generación remota falla, la pantalla conserva respuestas y muestra una
  acción explícita para reintentar; no vuelve al estado inicial.
- El plan debe indicar si fue creado con material aportado, fuentes abiertas o
  conocimiento general.

## Verificación

- Pruebas unitarias del catálogo y de los placeholders por intención.
- Pruebas del reducer para el orden de preguntas y persistencia de respuestas.
- Pruebas de contrato para solicitudes remotas válidas e inválidas.
- Verificación manual en Android y web: selección de cada tarjeta, teclado,
  pantallas pequeñas, retorno desde descubrimiento y estado de error.

## Alcance inicial

La primera entrega implementa las cuatro tarjetas y el flujo de `Tengo un
examen` hasta una propuesta estructurada. Los otros tres accesos pueden mostrar
su primer paso y reutilizar el flujo existente solo cuando su contrato específico
esté implementado; no deben aparentar recopilar datos de examen.

La carga de PDF, OCR, catálogo ISBN, búsqueda web, diagnóstico adaptativo,
persistencia del sendero y generación de nodos quedan como entregas posteriores.
