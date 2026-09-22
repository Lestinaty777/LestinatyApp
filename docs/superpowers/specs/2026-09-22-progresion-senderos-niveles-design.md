# Progresión de niveles y maestría infinita en Senderos

## Estado y alcance

Esta especificación reemplaza la progresión de un solo mapa descrita en
`2026-09-21-cofres-senderos-design.md`. Conserva los cofres intermedios, pero
integra el cofre final, el desbloqueo de niveles y la maestría infinita como
una sola operación segura.

El objetivo es que cada cumplimiento válido de un hábito avance exactamente
un nodo. Los niveles 1 a 6 desbloquean el siguiente mapa al terminar su último
nodo. El nivel 7 nunca termina: se repite en ciclos de 42 días.

## Auditoría remota del 22 de septiembre de 2026

La base real del proyecto `nzwkiffbircixvznnjek` se inspeccionó mediante
consultas de solo lectura a la API de administración de Supabase.

Hallazgos vinculantes para la implementación:

- La base está sana: no hay saldos negativos, planes solapados, registros
  diarios duplicados, niveles fuera de 1–7 ni recompensas de nivel duplicadas.
- Hay ocho planes en nivel 1, uno en nivel 2 y un movimiento histórico de
  `recompensa_nivel` por 10 gemas.
- `habitos_registros` ya garantiza una sola fila por `(habito_id,
  fecha_local)` y los planes tienen una exclusión de rangos solapados.
- `authenticated` solo puede leer planes y registros; sus escrituras pasan
  por RPC. Las tablas de comercio solo tienen privilegios para
  `service_role` y tienen RLS activado.
- `privacidad.registrar_progreso_habito` crea el plan siguiente con fecha de
  inicio del día posterior y acredita hoy `recompensa_nivel`.
- `comercio.acreditar_gemas` es `security definer`, tiene `search_path=''` y
  no es ejecutable por usuarios autenticados. Sin embargo, su idempotencia
  respaldada por índice único solo cubre `compra_iap`; los motivos de referido
  y trial dependen de guardas externas.
- La migración local `20260922_36_cofres_senderos.sql` no está aplicada: en
  producción no existen `habitos_cofres_reclamados`,
  `reclamar_cofre_sendero` ni `obtener_cofres_reclamados_habito`.
- El historial de `supabase_migrations` solo contiene cuatro migraciones
  antiguas. Las migraciones de este repositorio se han aplicado manualmente,
  por lo que no se debe usar `supabase db push` para este cambio.

La implementación debe usar una migración consolidada, autosuficiente e
idempotente que funcione tanto si la migración 36 existe como si no.

## Modelo de progresión

### Niveles 1 a 6

Cada mapa conserva su cantidad actual de nodos:

| Nivel | Días del recorrido | Desbloquea |
| --- | ---: | --- |
| 1 | 3 | Nivel 2 |
| 2 | 7 | Nivel 3 |
| 3 | 12 | Nivel 4 |
| 4 | 18 | Nivel 5 |
| 5 | 25 | Nivel 6 |
| 6 | 33 | Nivel 7 |

Un día cuenta cuando existe un registro que cumple la meta del plan que estaba
vigente en esa fecha y esa fecha estaba programada. Editar frecuencia o meta
dentro de un nivel no reinicia el sendero: cada registro se evalúa contra su
plan histórico y se acumulan todos los segmentos del mismo nivel.

Al completar el último nodo, la misma transacción:

1. registra el cumplimiento;
2. marca y acredita el cofre final;
3. cierra el plan actual y crea el siguiente para el día posterior;
4. devuelve la transición a la app.

La app reproduce la apertura y selecciona el mapa recién desbloqueado. El
mapa es visible de inmediato, pero su primer nodo no se puede completar hasta
el próximo día programado.

### Nivel 7 infinito

El nivel 7 se presenta como `Maestría` y usa siempre `etapa7.png`. Su mapa
tiene ciclos de 42 nodos para evitar una lista infinita:

- `ciclo = floor(días válidos de nivel 7 / 42) + 1`;
- `progreso = días válidos de nivel 7 % 42`;
- al completar exactamente 42 días se acredita el cofre final del ciclo y el
  siguiente ciclo comienza en `0/42`;
- el cofre final de cada ciclo entrega 35 gemas, igual que la recompensa
  máxima anunciada por el wizard;
- los cofres intermedios de los nodos 3, 6, 9… 39 se renuevan por ciclo;
- los días totales y los ciclos terminados nunca se pierden.

## Cofres y economía

`public.habitos_cofres_reclamados` tendrá una columna `ciclo` con valor 1 en
los niveles 1–6 y valor creciente en nivel 7. La unicidad será:

`(usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia)`.

Los cofres intermedios siguen siendo reclamables por toque y entregan 8–15
gemas. El cofre final se reclama automáticamente al registrar el último día.
Todos los premios se calculan y persisten en servidor.

La acreditación seguirá una única ruta. `comercio.acreditar_gemas` aceptará
los motivos de cofre y primero insertará un movimiento idempotente con
referencia estable; solo si ese movimiento es nuevo incrementará la billetera.
Un índice único parcial en `(persona_id, motivo, referencia)` protegerá todos
los créditos con referencia, además del índice global ya existente para IAP.

`registrar_progreso_habito` dejará de llamar a
`acreditar_recompensa_nivel_habito`. La recompensa anunciada por el wizard
será el cofre final, no un segundo pago paralelo.

El movimiento histórico de `recompensa_nivel` se convertirá únicamente en un
registro de cofre final ya reclamado. Este backfill no cambia ningún saldo ni
crea otro movimiento.

## Contrato remoto

### Resumen del sendero

Una RPC pública de solo lectura devolverá las siete secciones de un hábito:

```ts
type SeccionSendero = {
  nivel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  ciclo: number;
  estado: 'completado' | 'actual' | 'bloqueado';
  diasCompletados: number;
  diasRequeridos: number;
  puedeAvanzarHoy: boolean;
  disponibleDesde: string | null;
  totalDiasNivel7: number;
};
```

Los niveles sin plan permanecen bloqueados. Los niveles por debajo del máximo
desbloqueado son consultables y completados. En nivel 7, `diasCompletados`
representa el ciclo actual y `totalDiasNivel7` conserva el acumulado.

### Registro diario

La respuesta existente se amplía sin romper consumidores:

```ts
type TransicionSendero = {
  tipo: 'nivel' | 'ciclo_maestria';
  nivelAnterior: number;
  nivelActual: number;
  cicloAnterior: number;
  cicloActual: number;
  cofreFinalReclamado: true;
  gemas: number;
};
```

`registrar_progreso_habito` bloqueará la fila del hábito durante el cálculo.
Repetir la misma petición, tocar dos veces o ejecutar dos clientes en paralelo
devolverá el estado ya creado sin duplicar nodos, planes, cofres ni gemas.

### Cofres intermedios

`reclamar_cofre_sendero` recibirá también `ciclo`. Validará propiedad,
progreso real, nivel, ciclo y que el nodo sea un múltiplo de tres anterior al
final. Un reclamo repetido devolverá el resultado persistido en vez de pagar
de nuevo.

## Interfaz

Al abrir un hábito desde Senderos se muestra un `ScrollView` horizontal con
siete cards y `snapToInterval`. No se usa `FlatList`: son siete elementos
ligeros y la virtualización añadiría trabajo sin beneficio.

Cada card:

- usa `MasterGlass` con radio de 12 px;
- vive dentro de `MasterColorContext` del paquete del hábito;
- muestra a la izquierda `etapa1.png`–`etapa7.png`;
- muestra nivel, estado, progreso `X/Y` y `MasterProgressBar`;
- usa `MasterIcon` para estado bloqueado o completado;
- en nivel 7 muestra `Maestría · Ciclo N` y `X/42 días`.

Solo el mapa seleccionado está montado. Las cards bloqueadas son visibles pero
no seleccionables. Los niveles anteriores se pueden abrir en modo consulta:
sus nodos y cofres se ven, pero ninguna acción registra progreso.

Tras una transición confirmada por servidor:

1. se reproduce una sola vez `abrir-cofre-{paquete}.webm`;
2. se muestran las gemas recibidas;
3. al terminar, el carrusel se desplaza y selecciona el siguiente nivel;
4. en nivel 7 permanece seleccionada la misma card y cambia el número de
   ciclo.

Si el vídeo falla, se muestra el cofre estático reclamado y se continúa la
transición. Si la mutación remota falla, no se reproduce una apertura exitosa
ni se cambia de mapa. Si la app se cierra después de confirmar la transacción,
al volver carga directamente el estado nuevo desde servidor.

## Assets y rendimiento

La apertura usa las 17 variantes WebM por paquete ya generadas. Los árboles de
las cards reutilizan los assets de etapa existentes; no se generan copias.
Solo se mantienen montados siete cards ligeras, una escena procedural y, de
forma temporal, un vídeo sin loop.

El cambio de card debe respetar reducción de movimiento. La transición normal
usa desplazamiento suave; con reducción de movimiento salta directamente.

## Migración y compatibilidad

La migración consolidada debe:

1. crear o adaptar la tabla de cofres y su RLS;
2. añadir `ciclo` y reemplazar la unicidad anterior;
3. ampliar los motivos permitidos del ledger;
4. crear el índice idempotente general sin eliminar el índice IAP;
5. redefinir `acreditar_gemas` sin ampliar sus permisos públicos;
6. crear wrappers públicos mínimos para resumen y cofres;
7. redefinir `registrar_progreso_habito` y conservar su firma;
8. hacer backfill del único pago histórico de nivel sin modificar saldo;
9. notificar a PostgREST para recargar el esquema.

No se ejecutará la migración 36 por separado en producción. La migración nueva
debe tolerar que exista en instalaciones de desarrollo.

## Verificación

Las pruebas puras y SQL cubrirán:

- avance de un solo nodo por fecha;
- día no programado y registro que no alcanza la meta;
- edición de plan sin reiniciar días del nivel;
- doble toque y llamadas concurrentes;
- transiciones 1→2 hasta 6→7;
- acreditación única de cofre final y ausencia de `recompensa_nivel` nueva;
- backfill histórico sin cambio de saldo;
- cofres intermedios por nivel y ciclo;
- nivel 7 en 41/42, 42/42 y primer día del ciclo siguiente;
- siete cards y estados bloqueado/actual/completado;
- niveles anteriores en solo lectura;
- fallo del vídeo y reducción de movimiento;
- recarga de consultas, saldo y selección automática tras la animación.

Antes de aplicar en producción se ejecutará la migración dentro de una
transacción revertida, los tests SQL con usuarios de prueba y una nueva
auditoría de funciones, ACL, constraints, índices, RLS y saldos.

## Fuera de alcance

- No se cambian las metas ni el incremento de 15 % entre niveles.
- No se renderizan siete mapas simultáneamente.
- No se permite completar nodos históricos ni futuros.
- No se modifica la economía de compras IAP, tienda o referidos salvo reforzar
  la idempotencia común de créditos con referencia.
