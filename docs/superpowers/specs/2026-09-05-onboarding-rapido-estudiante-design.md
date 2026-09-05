# Onboarding Rápido de Estudiante

## Objetivo

Convertir la primera sesión autenticada en un viaje guiado que termina con el primer Sendero de estudio confirmado. El flujo debe pedir el contexto académico mínimo solo cuando aporta valor, ser reversible y no mostrar tabs vacías a una persona nueva.

## Alcance

Incluye:

- Un perfil académico mínimo persistido por usuario.
- Un guard posterior a la sesión y anterior a `/(principal)`.
- Una ruta de onboarding que guía desde contexto mínimo hasta la propuesta del primer Sendero.
- Reutilización del flujo visual de creación de Senderos de Aby para las preguntas específicas del objetivo.
- Decoración visual con los árboles existentes del bioma de estudio.
- Servicios y pruebas unitarias del módulo de onboarding.

No incluye:

- Perfil académico completo obligatorio.
- Generación definitiva en Gemini; en esta entrega el contrato permite usar una propuesta local mientras se termina el cableado de Aby.
- Edición del perfil desde Configuración.
- Institución, horario, materias prioritarias ni fuentes de estudio.

## Datos

Se crea `public.perfiles_estudiante`, separado de `public.perfiles_usuario` para distinguir el perfil técnico de cuenta del contexto académico.

Campos:

- `usuario_id uuid primary key references auth.users(id) on delete cascade`.
- `etapa_academica text not null`, restringida a `secundaria`, `preparatoria`, `universidad`, `admision` o `autodidacta`.
- `objetivo_academico text null`, texto normalizado y limitado a 120 caracteres. Representa carrera, área u objetivo, por ejemplo `Medicina`.
- `onboarding_completado_at timestamptz not null default now()`.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.

RLS queda habilitado. Una persona autenticada solo puede leer, insertar y actualizar su propia fila. No se expondrá el perfil a Aby en esta entrega: ese paso requerirá que `privacidad.usuario_permisos_datos.permite_contexto_aby` sea verdadero.

## Rutas y guard

Se agrega el grupo `app/(onboarding)` con la ruta `perfil-rapido`.

El guard se resuelve en una capa de acceso dedicada. La condición de finalización es tener un perfil de estudiante y un primer Sendero confirmado por el usuario:

1. Si la sesión está cargando, no se navega.
2. Si no hay usuario, se redirige a `/(publico)/iniciar-sesion`.
3. Si hay usuario sin perfil o sin primer Sendero confirmado, se redirige a `/(onboarding)/perfil-rapido`.
4. Si existe el perfil y el primer Sendero está confirmado, se abre `/(principal)/inicio`.

El chequeo debe refrescarse después de guardar, para impedir un flash de tabs o un bucle de redirección. La consulta de ausencia de perfil no se trata como error; errores de red sí muestran una recuperación explícita.

## Experiencia

La ruta usa una pantalla completa con área segura. No es un formulario aislado: es el primer viaje de creación.

1. **Bienvenida.** Explica que Lestinaty construirá el primer camino de estudio. No solicita datos.
2. **Etapa actual.** Cinco tarjetas presionables: Secundaria, Preparatoria, Universidad, Preparación para admisión y Autodidacta. La selección es obligatoria.
3. **Objetivo académico.** Campo de texto opcional: “¿Qué te gustaría estudiar?”. Incluye la alternativa clara “Aún no lo tengo claro”; esta guarda `objetivo_academico = null`.
4. **Necesidad inmediata.** Se muestran cuatro opciones: `Tengo un examen`, `Dominar una materia`, `Crear un hábito de estudio` y `Organizar mi rutina`.
5. **Creación guiada.** El flujo reutiliza las preguntas cerradas de Aby. Para un examen solicita materia, fecha, temario o índice, tiempo disponible y nivel. Las demás intenciones tienen su propio conjunto cerrado de preguntas.
6. **Propuesta.** Aby muestra un resumen visual del primer Sendero. La persona debe confirmarlo; puede volver a editar las respuestas.
7. **Perfil completo opcional.** Tras confirmar, se ofrece “Personaliza tus próximos caminos”. Puede recopilar país/sistema educativo, materias prioritarias y tiempo semanal, pero `Ahora no` no bloquea.
8. **Cierre.** Se marca el onboarding como completado y se navega al primer Sendero o a `Hoy` con su siguiente acción visible.

El perfil rápido se guarda después del paso 3. El cierre del onboarding se persiste exclusivamente después de confirmar una propuesta. Esto evita que alguien entre a tabs sin Senderos y permite reanudar el viaje si cierra la app durante la creación.

Las tarjetas siguen el lenguaje de los tooltips de nodos: contenedor elevado, flecha/motivo decorativo ligero, icono y texto directo. Todo acento y estado seleccionado se deriva de `biomas.estudio.MasterColor` y su paleta; no se introducen colores de categoría hardcodeados.

Se utilizan `base-estudio.png` y `sauce-ruinas-01.png` como capas decorativas de fondo, con `pointerEvents="none"`, recortadas por pantalla y sin afectar legibilidad. La transición de paso usa `Animated` con opacidad y traslación corta. No usa Skia ni Reanimated para mantener una ruta estable en Android de gama baja.

## Módulos

`src/modulos/onboarding/` contendrá:

- `onboarding.tipos.ts`: tipos de etapa y perfil.
- `onboarding.normalizar.ts`: normalización y validación pura del formulario.
- `onboarding.servicio.ts`: lectura y guardado vía Supabase.
- `onboarding.estado.ts`: estado persistente del viaje y del guard.
- `onboarding.flujo.ts`: transiciones permitidas y reanudación de pasos.
- `pantallas/OnboardingRapidoPantalla.tsx`: bienvenida, perfil rápido y selección de necesidad.
- `pantallas/OnboardingPrimerSenderoPantalla.tsx`: preguntas y confirmación, reutilizando contratos de Aby.
- `componentes/`: tarjetas de etapa y decoración si se requieren extracciones.

La navegación solo consume un estado compacto: `cargando`, `requiereOnboarding`, `error` y `refrescar`. El viaje conserva el último paso guardado para reanudarlo; las pantallas no consultan Supabase directamente.

## Errores y recuperación

- Si cargar el estado del perfil falla, se muestra una pantalla de recuperación con `Reintentar`; no se asume que el perfil falta.
- Si el guardado falla, se conserva la selección local, se informa el error y no se navega.
- Si se cierra la app antes de confirmar, el guard reabre el último paso seguro del viaje; nunca se crea un Sendero como confirmado sin confirmación explícita.
- Si existe una fila inválida por una migración histórica, la lectura falla de forma visible en vez de redirigir indefinidamente.
- Reintentos de guardar el mismo perfil son seguros mediante `upsert` por `usuario_id`.

## Pruebas

Antes del código productivo se crean pruebas unitarias para:

- Aceptar exclusivamente las cinco etapas soportadas.
- Normalizar objetivo vacío a `null` y recortar espacios.
- Rechazar un objetivo mayor de 120 caracteres.
- Determinar correctamente el destino de navegación según sesión, perfil y primer Sendero confirmado.
- Impedir que el flujo salte de selección de necesidad a cierre sin una propuesta confirmada.
- Reanudar el último paso seguro después de una interrupción.

Luego se verificará el módulo de onboarding y `npm run typecheck`. La migración se podrá ejecutar manualmente en Supabase antes de probar el flujo autenticado en Android.
