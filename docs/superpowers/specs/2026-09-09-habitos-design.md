# Diseño: categoría de Hábitos

## Objetivo

Incorporar Hábitos como una categoría persistente y analítica. La persona registra
hábitos diarios, consulta su cumplimiento y navega a cinco vistas derivadas de datos
reales: Hoy, Patrones, Conexiones, Riesgo e Impacto.

## Navegación

```text
Inicio -> /habitos -> Hoy (pantalla principal basada en habitos.png)
                       -> Patrones
                       -> Conexiones
                       -> Riesgo
                       -> Impacto
```

- **Hoy** es la categoría activa al llegar desde Inicio y muestra la composición de
  `assets/ilustraciones/habitos.png`, sin las ilustraciones superiores que el
  producto añadirá posteriormente.
- La parte superior de Hábitos toma como plantilla la UI actual de Inicio
  (`HoyPantalla`): misma distribución de widgets en la columna izquierda,
  ilustración en la columna derecha y la fila horizontal de cards de categoría.
  Se reutilizan sus proporciones, superficies glass, espaciado y comportamiento
  táctil; cambia solo el contenido para representar el estado de Hábitos.
- El bloque de saludo conserva el orden y tipografía de Inicio. La única variación
  es un `ChevronLeft` de Lucide a su izquierda, que vuelve a la pantalla anterior;
  no se usa el orden de saludo/chevron de las referencias.
- La fila de cards conserva el lenguaje de Inicio (Estudio, Rutinas, Hábitos,
  Metas y equivalentes), pero se convierte en el selector de categorías de
  Hábitos: Hoy, Patrones, Conexiones, Riesgo e Impacto. No se introduce un diseño
  de cards alternativo en esa zona.
- La fila de accesos de la pantalla principal contiene exactamente: Hoy, Patrones,
  Conexiones, Riesgo e Impacto. Sustituye Rachas, Cadenas, Retos, Evolución y
  Progreso de la referencia.
- Cada acceso abre la composición equivalente de
  `assets/ilustraciones/categoriasmockup.png`.
- Dentro del espacio analítico, `TabChanger` alterna entre **Categorías** y
  **Hábitos**. En Categorías se muestran las cinco cards analíticas; en Hábitos se
  sustituyen por las cards de hábitos de la persona, manteniendo el mismo control.
- Elegir una card de hábito abre `/habitos/[id]`, basado en
  `assets/ilustraciones/pantallahabitos.png`. La cabecera conserva el patrón actual:
  chevron a la izquierda y título/subtítulo a la derecha. No se implementan
  ilustraciones superiores. Todos los iconos son de `lucide-react-native`.
- Las rutas deben conservar el historial de navegación de Expo Router; Atrás nunca
  debe reconstruir el estado con datos estáticos.

## Modelo de datos

Las nuevas tablas viven en `public`, usan RLS por `usuario_id` y solo permiten a la
persona autenticada leer y mutar sus propias filas. `auth.uid()` determina la
propiedad; ningún RPC acepta un `usuario_id` proporcionado por el cliente.

### Prefijo de tablas

Todas las tablas propias del módulo llevan el prefijo SQL `habitos_`. El guion
solicitado se representa como guion bajo porque `habitos-...` no es un identificador
SQL seguro sin entrecomillar.

### `public.habitos_items`

| Campo | Tipo / reglas |
| --- | --- |
| `id` | `uuid` PK, `gen_random_uuid()` |
| `usuario_id` | `uuid` FK a `public.perfiles_usuario(id)`, no nulo |
| `titulo` | `text`, 1--80 caracteres |
| `descripcion` | `text`, opcional, máximo 280 caracteres |
| `icono_lucide` | `text`, nombre validado contra catálogo de app |
| `color` | `text`, token/hex validado por app |
| `tipo_meta` | `check`, `cantidad` o `duracion` |
| `unidad` | nullable para `check`; por ejemplo `vasos`, `paginas`, `minutos` |
| `estado` | `activo`, `pausado` o `archivado` |
| `created_at`, `updated_at`, `archivado_at` | auditoría estándar |

Índices: `(usuario_id, estado, created_at desc)`.

### `public.habitos_planes`

Versiona la configuración para que editar una meta no cambie métricas históricas.

| Campo | Tipo / reglas |
| --- | --- |
| `id` | `uuid` PK |
| `habito_id` | FK a `habitos_items(id)` con cascada |
| `frecuencia` | `diaria`, `dias_semana` o `veces_semana` |
| `dias_semana` | `smallint[]`, solo para `dias_semana`, valores 1--7 |
| `veces_por_semana` | `smallint`, solo para `veces_semana`, 1--7 |
| `objetivo_valor` | `numeric(10,2)`, positivo; `1` para `check` |
| `desde_fecha` | `date`, inclusiva |
| `hasta_fecha` | `date`, nullable, exclusiva |
| `created_at` | `timestamptz` |

No puede haber períodos de plan solapados para el mismo hábito. Un trigger valida
la coherencia entre frecuencia, días, objetivo y el `tipo_meta` del hábito.

### `public.habitos_registros`

| Campo | Tipo / reglas |
| --- | --- |
| `id` | `uuid` PK |
| `habito_id` | FK a `habitos_items(id)` con cascada |
| `usuario_id` | FK a perfil, duplicado de forma controlada para RLS eficiente |
| `fecha_local` | `date`, calculada con la zona horaria del perfil al registrar |
| `valor` | `numeric(10,2)`, no negativo |
| `registrado_at` | `timestamptz`, momento real del registro |
| `nota` | `text`, opcional, máximo 500 caracteres |
| `created_at`, `updated_at` | auditoría |

`unique (habito_id, fecha_local)` permite actualizar el acumulado diario sin crear
dobles registros. Una función calcula si se alcanzó el objetivo usando el plan
vigente en `fecha_local`; el estado de completado se deriva, no se persiste.

### Contextos opcionales

`public.habitos_contextos` contiene el catálogo personal (`id`, `usuario_id`,
`nombre`, `icono_lucide`, `created_at`).
`public.habitos_registro_contextos` relaciona registros y contextos con PK compuesta
`(registro_id, contexto_id)`. Ejemplos: mañana, música o después de ejercicio.
No es obligatorio capturarlos para registrar progreso.

### `public.habitos_conexiones`

| Campo | Tipo / reglas |
| --- | --- |
| `id` | `uuid` PK |
| `usuario_id` | FK a perfil |
| `origen_habito_id`, `destino_habito_id` | FKs a hábitos propios, distintos entre sí |
| `tipo` | `refuerza` o `dificulta` |
| `origen` | `manual` o `sugerida` |
| `activa` | booleano, por defecto `true` |
| `created_at`, `updated_at` | auditoría |

La relación es dirigida y única por par y tipo. Triggers verifican que ambos
hábitos pertenezcan a la misma persona.

## Datos derivados y RPC

La app no guarda porcentajes, riesgos ni correlaciones como valores canónicos.
`public.obtener_panel_habitos(fecha_referencia date default local)` devuelve datos
reales calculados y limitados a `auth.uid()`. El motor usa la zona horaria de
`perfiles_usuario` y una ventana de 14 días por defecto; 28 días cuando exista
historial suficiente.

| Categoría | Fuente y cálculo |
| --- | --- |
| Hoy | Planes vigentes para la fecha, registro acumulado, meta, avance y racha de días programados cumplidos. |
| Patrones | Cumplimiento por día de semana, franja de `registrado_at` y contextos; una conclusión requiere al menos 7 ocurrencias programadas y 3 por grupo comparado. |
| Conexiones | Co-cumplimiento de pares de hábitos en días programados compartidos, más conexiones manuales/sugeridas activas. Se publica una fuerza solo con al menos 7 días comparables. |
| Riesgo | Diferencia entre la tasa de los últimos 7 días programados y su línea base de 28 días; también omisiones consecutivas. Sin línea base se muestra seguimiento en curso. |
| Impacto | Cambio de tasa de cumplimiento de hábitos conectados cuando el origen se cumple frente a cuando no, con mínimo de 7 pares comparables. Integraciones futuras solo aparecen si su fuente existe; nunca se muestra un impacto inventado. |

La RPC devuelve estados `sin_habitos`, `sin_historial`, `en_observacion` o `listo`
por bloque para que la UI explique qué dato falta y ofrezca registrar/crear un
hábito.

## Creación y registro

1. La creación inserta atómicamente un hábito y su primer plan.
2. La pantalla de Hoy incrementa o reemplaza el registro del día mediante una RPC
   idempotente; no permite registrar hábitos ajenos ni fechas futuras.
3. Un cambio de meta cierra el plan actual en la fecha elegida y crea uno nuevo.
4. Archivar conserva registros y métricas históricas, pero lo excluye de Hoy.

## Componentes y límites

- `HabitosPantalla`: composición principal, navegación a categorías y resumen Hoy.
- La cabecera, hero y cards de categorías se extraerán o reutilizarán desde los
  primitives visuales de Inicio cuando no cambie su responsabilidad. Hábitos no
  duplicará estilos de `HoyPantalla`; solo define datos y variantes de contenido.
- `PanelCategoriasHabitos`: `TabChanger` controlado y las cinco cards.
- `DetalleCategoriaHabitos`: renderiza Hoy, Patrones, Conexiones, Riesgo o Impacto
  con la misma respuesta de panel.
- `DetalleHabitoPantalla`: resumen, registro y analítica individual.
- `habitos.servicio.ts`: consultas Supabase y mutaciones RPC; sin datos mock.
- `habitos.tipos.ts`: contratos de dominio y DTOs de la RPC.

`TabChanger` recibirá un valor controlado y una pestaña inicial para no depender de
su estado interno actual, que abre en Hábitos. Su API existente seguirá funcionando
para los consumidores actuales.

## Errores, seguridad y pruebas

- RLS valida propiedad en todas las tablas; triggers protegen relaciones cruzadas,
  fechas de planes y duplicados.
- Errores de red preservan el valor previo y muestran una acción para reintentar;
  las escrituras idempotentes evitan duplicar el avance al reintentar.
- Pruebas SQL cubren RLS, solapamiento de planes, registro único, conexiones de
  otro usuario y cálculos de cada categoría.
- Pruebas unitarias cubren frecuencia, rachas, umbrales estadísticos, riesgo e
  impacto.
- Pruebas de interfaz verifican la apertura en Hoy, navegación de las cinco cards,
  el cambio de `TabChanger` y la ruta de detalle de un hábito.
