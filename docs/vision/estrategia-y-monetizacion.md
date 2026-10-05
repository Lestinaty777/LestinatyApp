# Estrategia de producto y monetización

Estado: **borrador de estrategia** (2026-10-05). Complementa la [visión](lestinaty-vision.md). Donde los datos de mercado sean de segunda mano o se contradigan, se marca con su nivel de confianza; la regla de fondo es que **mandan los datos de nuestros propios usuarios sobre los promedios del mercado**.

## 1. Idea central

> Lestinaty es el lugar donde organizas tu vida entera, y cada área tiene su camino.

La gente no se va de una app de hábitos por el precio: se va porque deja de usarla. El motivo número uno de cancelación es "no la uso lo suficiente" (RevenueCat 2025, vía resumen de terceros). Por eso la estrategia no es bloquear funciones, sino que **Lestinaty sea una herramienta del día a día** y el dinero salga de ahí.

## 2. Usuario de partida: el fundador

El primer usuario es quien construye la app: una persona con **varias áreas de vida a la vez** (escuela, trabajo, hábitos, metas y un proyecto propio, incluido el plan de marketing de la app) que quiere todo organizado en un solo lugar y que además se sienta bien de usar.

Persona objetivo inicial (hipótesis, a validar): estudiantes y jóvenes que también construyen algo (creadores, freelancers, emprendedores) y manejan varias metas en paralelo.

Qué hace distinto a Lestinaty de Notion, ClickUp o Todoist (que no queremos ser): **ejecución diaria con progreso que se siente** (Senderos, árboles, constancia que perdona), no una base de datos flexible. No se organiza información: se recorren caminos.

Mensaje a probar: *tu día organizado y con progreso, para quien tiene varias metas a la vez.*

## 3. Áreas de vida: la estructura que une todo

En vez de un módulo por tema, una capa común de **áreas** (Cuerpo, Mente, Estudios, Trabajo y negocio, Finanzas, y las que cada persona añada) que contiene metas, hábitos, tareas, rutinas y planes.

```text
ÁREA  (Cuerpo, Estudios, Negocio, Finanzas…)
  └─ META
       └─ SENDERO
            ├─ hábitos   (constancia)
            ├─ tareas    (ejecutables)
            ├─ rutinas   (sesiones)
            └─ planes    (etapas, generados con Aby)
```

- **Hoy** muestra todo junto, dividido por franja (mañana, tarde, noche) y filtrable por área.
- Las áreas **no existen todavía** en el producto ni en ningún spec. Es la pieza que más necesita quien mezcla escuela, trabajo y proyecto, y requiere su propio spec (etiqueta de área en hábitos, tareas, rutinas y planes, y filtro en Hoy).

### Packs por área (sin código nuevo)

Cada área se ofrece como un pack que combina las herramientas existentes. Son a la vez las **plantillas premium** (ver 6) y el experimento para medir qué nicho se compra.

| Pack | Combina |
| --- | --- |
| Mejorar mi cuerpo | hábito de movimiento + rutina de entrenamiento + plan de 8 semanas con Aby |
| Estudios | rutina de estudio + plan por temas + meta con fecha |
| Finanzas | hábito de revisar gastos + rutina semanal de cierre + Sendero de ahorro |
| Negocio | plan de marketing + tareas por semana + rutina de enfoque |

### Límites deliberados

- **Finanzas** = metas y hábitos (por ejemplo, un Sendero de ahorro con aportes manuales usando contadores con unidad). **No** contabilidad, cuentas ni conexión con bancos: es otro producto con otros riesgos. Sin consejos financieros concretos.
- **Cuerpo y salud:** hábitos y rutinas de actividad general, no prescripciones. Mensaje claro de que no es consejo médico y evitar propuestas extremas (dietas muy restrictivas, entrenamientos sin progresión). Las tiendas revisan con lupa las apps con consejos de salud: revisar esto antes de lanzar un caso estrella de cuerpo.
- **Sin gemas por rutina completada** (para no pagar dos veces lo que ya premian hábitos y tareas).

## 4. El ciclo diario (lo que hay que hacer bien)

Cada acción diaria tiene cuatro piezas; casi todas existen o están planificadas:

| Pieza | Qué es | Estado |
| --- | --- | --- |
| Disparador | recordatorios por franja, widgets (Android), Live Activities (iOS, ver 6) | recordatorios y widgets: parcial; Live Activities: pendiente |
| Acción | **sesión guiada** de rutinas, una pulsación para empezar, versión corta ("tengo 15 minutos") | pendiente: es la siguiente etapa |
| Recompensa | árbol que crece, constancia que perdona, cierres visuales | hábitos y tareas: hecho; rutinas: pendiente |
| Inversión | lo que la persona va construyendo (hábitos con nivel, planes, rutinas propias, plantillas compradas) | en curso |

**Constancia que perdona:** completar solo los pasos esenciales de una rutina cuenta como sesión completa, para que un mal día no rompa la racha (implementado en la sesión guiada; la racha de sesiones como tal está pendiente).

## 5. Qué es gratis y qué es de pago

Regla: **gratis todo lo que no cuesta servir** y el ciclo central completo; **de pago** lo que cuesta dinero, lo que es comodidad fuera de la app y lo que es identidad o contenido.

| | Gratis | Horizon (suscripción) | Gemas |
| --- | --- | --- | --- |
| Hábitos | Todo | Widgets | Árboles |
| Tareas | Simples y checklist, ilimitadas | Contador/cronómetro con sendero de días, Planes | |
| Rutinas | 1 o 2 activas + sesión guiada | Ilimitadas, Live Activities (iOS) | Plantillas premium |
| Aby | Pocas generaciones al mes | Más generaciones (el tope mensual ya existe, verificado en servidor) | |

- **Límites siempre comprobados en el servidor**, como ya se hace con Aby; solo en la app se saltan.
- **Pre-lanzamiento:** fijar los límites ahora, antes de tener usuarios, evita quitar funciones a quien ya las tiene.
- **Trial:** propuesta de **14 días sin tarjeta con todo desbloqueado y unas 3 generaciones de Aby** (tope por cuenta, en servidor), y luego plan gratuito. Lo creado durante el trial que supere los límites **no se borra**: queda pausado y se reactiva al suscribirse. Aviso unos 2 días antes de que termine. El trial inverso no tiene evidencia directa en apps móviles (ver 8). Pendiente: aclarar qué pasó con el bono de trial de Horizon de la migración 41, que parece una idea anterior ya retirada.
- **Live Activities como beneficio de Horizon en iOS:** hoy Horizon no ofrece nada en iOS (sus widgets son solo Android). El cronómetro del paso actual no necesita push por segundo; el cambio automático de paso con la app cerrada se deja para una segunda versión. Requiere extensión nativa de iOS (SwiftUI) que no se puede compilar ni probar desde la sesión de desarrollo en la nube.
- Idea a probar más adelante: plan "de por vida" para Horizon (Streaks y Habitify lo ofrecen).

## 6. Plantillas con gemas: el primer experimento de nicho

Ya construido (migración 72, spec `2026-10-04-plantillas-rutinas-design.md`): catálogo en el servidor, gratis y de pago con gemas, contenido entregado solo a quien lo compró. Falta cargar plantillas premium reales.

Uso estratégico: publicar **1 o 2 plantillas por nicho (cuerpo, estudio, trabajo, finanzas) al mismo precio** y medir cuáles se **compran** y cuáles se **completan**. Es un experimento barato con datos reales de usuarios, mejor que decidir por promedios.

## 6.1. Orden de construcción

1. **Sesión guiada de rutinas** (acción diaria, esenciales/opcionales, "tengo X minutos"): la necesita el propio fundador para usar la app. **Primera versión hecha (2026-10-05); falta probarla en dispositivo.**
2. **Eventos de analítica** del embudo (ver 7).
3. **Áreas + filtro en Hoy** y **franjas en los asistentes de hábito y tarea.**
4. **Metas** como punto de partida de cada Sendero.
5. **Packs por área con Aby** (a la vez, plantillas premium).
6. **Trial** y comprobación de límites en servidor.
7. **Live Activities** (iOS, en una rama aparte).
8. **Finanzas** sencillas, solo si después de usar lo anterior todavía hacen falta.

## 7. Cómo se mide

Cuenta más lo que la gente hace que lo que dice o lo que promedia el mercado.

- **Primera sesión:** qué porcentaje llega a una primera victoria (el primer hábito, tarea o rutina completados).
- **Retención:** vuelven al día 1, 7 y 30.
- **Número principal:** **días activos por semana** (días con al menos una acción).
- **Activación y pago:** probar con datos propios la hipótesis "3 días seguidos activan, 7 predicen el pago" (viene de un blog de marketing, no verificada).
- **Plantillas:** compras y finalizaciones por nicho.
- **Embudo de pago:** quién llega a ver la oferta, quién empieza el trial, quién se suscribe, y qué hacía la semana anterior a abandonar.
- **Cualitativo:** hablar con 5 a 10 personas del nicho con preguntas como "¿cómo organizas esto hoy?" y "¿qué te frustra?", no "¿te gustaría mi app?".

## 8. Qué dicen los datos de mercado, y cuánto fiarse

**Importante:** el proxy del entorno de desarrollo bloquea revenuecat.com, adapty.io y otros, así que **no se pudieron abrir los informes originales**. Todo viene de resúmenes de búsqueda que citan esos informes y de blogs. Conviene verificar las cifras clave antes de apostar fuerte.

| Hallazgo | Fuente (de segunda mano) | Confianza |
| --- | --- | --- |
| Pago duro: ~10,7 % de descargas a pago a los 35 días; freemium ~2,1 %; retención al año casi igual; freemium es mejor si los usuarios gratuitos traen a otros | RevenueCat 2026, vía resúmenes | Media |
| Cuanto más larga la prueba, más convierte: 1–4 días ≈ 27–30 %, 5–9 ≈ 37 %, 10–16 ≈ 42 %, 17–32 ≈ 49 % (cortes distintos según la fuente, misma tendencia) | RevenueCat 2025 / Adapty, vía resúmenes | Media |
| La primera sesión decide: la mayoría de las pruebas empiezan y la mayoría de las cancelaciones ocurren el día 0 | RevenueCat, vía resúmenes | Media |
| Motivo nº 1 de cancelación: "no la uso lo suficiente" (32–47 %) | RevenueCat 2025, vía blog | Media-baja |
| Salud y fitness: mejor conversión de prueba a pago (~35–40 %, top 10 % ~68 %) y más ingreso por instalación (~0,63 USD a 60 días); pero solo el 5 % de esas apps llega a 10.000 USD en dos años | Varias, vía resúmenes | Media |
| Educación y estilo de vida: buena renovación anual (~31 %) | RevenueCat, vía resumen | Media |
| Retención anual de Productividad: **una fuente dice 23 % (floja), otra dice que es la mejor** | Contradictorio | Baja: no usar |
| Ingreso medio por pagador por categoría | **Se contradice entre fuentes** | Baja: no usar |
| Reverse trial: "+38 % sobre freemium", "Toggl duplicó ingresos" | Blogs de **software de empresa**, no apps móviles | Baja: es una hipótesis, no un resultado probado en esta categoría |
| "3 días activan, 7 predicen el pago" | Blog de marketing | Baja: medir con datos propios |

Modelos de las apps de hábitos (según las fuentes, verificar precios actuales): Streaks, pago único; Habitify, gratis hasta 3 hábitos y de pago por mes o de por vida; Routinery, gratis o de pago mensual; Finch, gratis casi completo con Plus de pago; Habitica, casi todo gratis con suscripción de extras cosméticos.

Los promedios por categoría mezclan apps muy distintas (muchas de IA, foto o pago duro desde el primer minuto) y **no son una guía directa para una app de hábitos con juego**.

## 9. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Alcance de "todo en uno" (el fundador es una sola persona) | Áreas como capa común, packs como combinaciones de lo existente, orden de construcción por etapas |
| Parecerse a Notion/ClickUp/Todoist | Mantener el ángulo de ejecución diaria con progreso, no bases de datos |
| Mensaje demasiado amplio | Frase concreta y persona objetivo clara |
| Freemium convierte poco (~2 %) y necesita volumen | Referidos como palanca de crecimiento; medir antes de apretar límites |
| Consejos de salud o finanzas | Hábitos y rutinas generales, avisos claros, sin prescripciones; revisar políticas de las tiendas antes de lanzar |
| Datos de mercado poco fiables | Tratarlos como pistas; decidir con datos propios |
| Límites solo en el cliente se saltan | Comprobar en el servidor |
| Live Activities no se pueden probar desde el entorno de desarrollo en la nube | Rama aparte y prueba en dispositivo |
| Licencia: `main` BUSL-1.1 y `mejoras` propietaria | Decidir antes de fusionar ramas |

## 10. Plan inmediato: usarla dos semanas

1. Usar Lestinaty en serio: el plan de marketing en Planes (probando a Aby), tareas de escuela y trabajo, hábitos y rutinas.
2. Anotar cada vez que algo estorba o falta. **Esa lista de fricciones ordena el trabajo** mejor que cualquier promedio.
3. Con lo aprendido, escribir el mensaje de la app y la persona objetivo, y abrir el grupo pequeño de TestFlight (el README ya tiene ese enlace pendiente).

## 11. Decisiones abiertas

- ~~Confirmar que completar solo lo esencial cuenta como sesión completa.~~ Implementado así; revisar si se quiere otra regla.
- Cuántas rutinas activas gratis (1 o 2) y qué entra exactamente en Horizon.
- Duración del trial (14 días propuestos) y número de generaciones de Aby.
- Qué pasó con el bono de trial de Horizon (migración 41).
- Nombre y alcance de las áreas de vida y su spec.
- Categoría de la tienda (Salud y fitness o Productividad) según el nicho de partida.
- Rango de precio de las plantillas premium (50–150 gemas propuesto) y cuáles de las actuales siguen gratis.

## Fuentes consultadas (de segunda mano)

- [RevenueCat: State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps)
- [RevenueCat: Subscription app trends & benchmarks 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)
- [RevenueCat: Average subscription renewal rates by app category](https://www.revenuecat.com/blog/growth/average-subscription-renewal-rates-by-app-category)
- [Adapty: State of In-App Subscriptions 2026](https://adapty.io/state-of-in-app-subscriptions/)
- [Adapty: Freemium to premium conversion](https://adapty.io/blog/freemium-to-premium-conversion-techniques)
- [Adapty: Productivity app subscription benchmarks](https://adapty.io/blog/productivity-app-subscription-benchmarks/)
- [Airbridge: Hard paywall vs freemium 2026](https://www.airbridge.io/en/blog/hard-paywall-vs-freemium-2026)
- [Fitness apps: monetizable, winner take all or most? (Athletech News)](https://athletechnews.com/fitness-apps-monetizable-winner-take-all-or-most/)
- [Reverse trial method (Userpilot)](https://userpilot.com/blog/?p=13042)
- [Habitify pricing (Toolradar)](https://toolradar.com/tools/habitify/pricing)
- [Streaks pricing (Toolradar)](https://toolradar.com/tools/streaks/pricing)
- [Habitica: Play to Win, Not Pay to Win](https://habitica.fandom.com/wiki/Play_to_Win,_Not_Pay_to_Win)
