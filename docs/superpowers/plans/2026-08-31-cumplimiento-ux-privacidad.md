# Cumplimiento, Privacidad y UX Operativa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar controles de privacidad, programación segura, IA responsable, comunidad moderada y requisitos de tienda en la UI y backend de Lestinaty.

**Architecture:** La UI explica y solicita consentimiento; Supabase aplica RLS y la Edge Function filtra datos antes de Gemini. Las operaciones sensibles se registran y las restricciones de tiempo se aplican en base de datos, no solo en cliente.

**Spec:** `docs/superpowers/specs/2026-08-31-progresion-senderos-metas-design.md`

## Matriz de Consideraciones y Resolucion

| Consideracion | Riesgo si falta | Resolucion en producto | Respaldo tecnico |
| --- | --- | --- | --- |
| Consentimiento y minimizacion | Usar datos sin finalidad clara | Toggles separados, explicacion previa y revocacion inmediata | `usuario_permisos_datos`, `auditoria_permisos_datos`; Edge Function consulta DB, no el payload del cliente |
| Eliminacion, exportacion y correccion | Cuenta sin control sobre sus datos o identidad push conservada | Acciones visibles en Configuracion, estado de solicitud y enlace web equivalente | `solicitudes_privacidad`; proceso de borrado/anonimizacion, correccion, revocacion de sesiones y eliminacion de identidad OneSignal |
| Salud y bienestar | Interpretarse como consejo medico | Aviso de bienestar, no diagnostico, permiso sensible separado | Catalogo de metricas con sensibilidad y filtro antes de Aby |
| IA generativa | Planes opacos o acciones automaticas | Etiqueta Aby, confirmar antes de crear, ajustar, reiniciar y reportar | `aby_turnos` y `aby_propuestas` con modelo, prompt, consentimiento y limites de servidor |
| Horarios y notificaciones | Doble reserva, spam o revelar datos en bloqueo de pantalla | Conflicto explicado, controles por tipo, horario silencioso y texto privado por defecto | ejecuciones de `Hoy`, catalogo, preferencias, presupuesto, cola idempotente y OneSignal solo como entrega |
| Contenido compartido | Abuso, spam, acoso o contenido infractor | Reportar, bloquear, reglas y soporte visibles | `reportes_contenido`, `bloqueos_usuario`, `moderacion_contenido`, `reclamaciones_propiedad` |
| Plantillas y compras | Cobros inconsistentes o bypass de tiendas | Sin economia en piloto; restauracion y recibo validado antes de desbloquear | `transacciones_compra` y `movimientos_gemas` append-only, validados por servidor |
| Privacidad entre cuentas | Filtracion de progreso, notas o metricas | Cada vista compartida explica exactamente que se comparte | RLS por propietario/membresia; vistas de expedicion con allowlist de metadatos, nunca tablas personales directas |
| Retencion y seguridad | Datos excesivos o credenciales expuestas | Minimo necesario, secretos solo en servidor, historial controlable | politicas de retencion, backups cifrados, auditoria y secretos en Edge Function |
| Edad y cuentas | Tratamiento inadecuado de menores | Fecha/region de elegibilidad y flujo de tutor si aplica | `perfiles_usuario` con estado de elegibilidad; bloquear funciones no permitidas |
| Avisos y terminos | No poder demostrar que se mostro una regla o finalidad | Politica, terminos, uso de IA, comunidad y salud versionados | `documentos_legales`, `aceptaciones_documentos_legales` con version, region, idioma y fecha |

## Decisiones Cerradas del Piloto

- Audiencia: personas de 13 anos o mas. No se habilita registro ni procesamiento de cuentas para menores de 13 anos hasta contar con consentimiento parental verificable.
- Compras: todo bien digital se vende mediante StoreKit o Google Play Billing. Lestinaty no recolecta tarjetas; valida recibos en servidor y registra el resultado en un ledger idempotente.
- Gemas: pueden obtenerse por cofres de progreso o compra nativa. Los cofres entregan recompensas fijas, nunca aleatorias, y las gemas no expiran ni compran completado de nodos.
- Compartidos: solo expediciones privadas por invitacion revocable o codigo temporal. No hay directorio, feed, perfiles publicos, mensajes directos, comentarios ni medios en el piloto.
- Privacidad de equipo: cada persona mantiene privadas sus ejecuciones, sesiones con Aby, notas, métricas y evidencia. Solo se comparten hitos, estado agregado, próximo objetivo y metadatos de trabajo autorizados: rama/nodo, responsable, estado, dependencia, fecha acordada y resultado marcado como compartible.
- Notificaciones: `Hoy` es la unica fuente de avisos. Los recordatorios con hora habilitados por la persona pueden enviarse individualmente; los avisos proactivos se limitan a dos por dia, con separacion de cuatro horas y horario silencioso.
- Pantalla bloqueada: las notificaciones usan contenido generico por defecto y deep links con referencias opacas. No muestran salud, metricas, finanzas, notas ni progreso privado.
- Compartidos: se permite avisar invitaciones, turno disponible/proximo, desbloqueos y hitos autorizados. Se prohíben avisos que expongan retrasos, notas, metricas o progreso individual de otra persona.

## Decisiones Pendientes de Lanzamiento

- Paises iniciales y entidad legal adulta titular de cuentas de tienda.
- Controles finos de visibilidad por frente de trabajo, dentro de la allowlist compartida ya definida.
- Proveedores de inicio de sesion y requisitos de equivalencia en iOS.
- Catalogo de compra inicial y si gems se habilitan desde la primera version.
- Precio, duracion y elegibilidad de la oferta comercial de Círculo en StoreKit y Google Play Billing.
- Dominio y alojamiento de la pagina web de privacidad y eliminacion de cuenta.

## Tasks

### Task 1: Datos y privacidad
- [ ] Crear Configuración → `Datos y privacidad` con toggles separados para personalización de Aby, Salud, Finanzas, Relaciones y memoria conversacional.
- [ ] Mostrar una explicación previa al consentimiento: qué se usa, para qué, qué no se envía y cómo revocarlo.
- [ ] Implementar lectura de permisos exclusivamente en Edge Function; ignorar permisos enviados por Expo.
- [ ] Añadir exportación y eliminación de cuenta/datos desde Configuración, incluyendo estado de solicitud y fecha de finalización.
- [ ] Crear `solicitudes_privacidad` para exportación, eliminación y corrección, una función administrativa de borrado/anonimización, baja de `dispositivos_notificacion`, eliminacion o anonimización de la identidad externa en OneSignal y registro de finalización auditable.
- [ ] Crear `documentos_legales`, `aceptaciones_documentos_legales`, responsable de privacidad e incidentes; guardar la versión, región e idioma aplicables a cada decisión.
- [ ] Publicar una página web funcional de eliminación que permita iniciar la solicitud sin reinstalar la app; enlazarla en Play Console.
- [ ] Crear `eventos_hoy`, `catalogo_notificaciones`, `preferencias_notificacion_usuario`, `dispositivos_notificacion`, `presupuestos_notificacion_usuario`, `notificaciones_programadas`, `notificaciones_entregas` y `notificacion_interacciones`; OneSignal se limita a entregar, mientras Supabase decide y audita.
- [ ] Solicitar permiso nativo solo despues de explicar el beneficio y permitir modalidades: resumen, cada actividad con hora y personalizado por tipo. El estado del permiso del sistema prevalece sobre el toggle interno.
- [ ] Publicar política de privacidad enlazada desde app, App Store Connect y Play Console.

### Task 2: Salud y métricas sensibles
- [ ] Etiquetar métricas sensibles en catálogo y requerir permiso específico antes de registrarlas o resumirlas para Aby.
- [ ] Mostrar aviso de bienestar: los registros y planes no son diagnóstico, tratamiento ni consejo médico.
- [ ] No usar datos de salud para publicidad, segmentación ni marketplace.
- [ ] Permitir desactivar una métrica sin borrar automáticamente su historial; ofrecer borrado explícito separado.

### Task 3: Hoy, conflictos de horario y notificaciones
- [ ] Crear editor de programación con hora ancla, duración, días y flexibilidad.
- [ ] Detectar conflicto al guardar y mostrar sendero existente, intervalo ocupado y opciones: mover nuevo, reprogramar existente, mantener ambos con confirmación o cancelar.
- [ ] Aplicar restricción de exclusión en Postgres para intervalos activos del mismo usuario.
- [ ] Registrar reprogramaciones como evento y no duplicar ejecuciones.
- [ ] Proyectar solo desde `Hoy` recordatorios programados, eventos del sistema y sugerencias proactivas; prohibir llamadas directas a OneSignal desde Senderos, Metas o Expediciones.
- [ ] Antes de cada envio, revalidar la ejecucion o evento, preferencias, ventana silenciosa, permiso nativo y presupuesto; cancelar el aviso si su fuente ya no es aplicable.
- [ ] Usar una clave idempotente, reserva atomica de cola y registro de entrega para que cron/reintentos nunca dupliquen un push.
- [ ] Agrupar eventos informativos en una ventana de treinta minutos y limitar su frecuencia; conservar individuales solo los recordatorios horarios solicitados y eventos compartidos accionables de la propia persona.
- [ ] Registrar apertura y accion de un aviso; considerar ignorada una proactiva solo despues de su ventana sin interaccion y reducir su elegibilidad futura, sin cambiar preferencias del usuario.
- [ ] Mantener el contenido de bloqueo generico por defecto y abrir `Hoy` con un deep link que vuelve a consultar el estado actual.

### Task 4: Aby responsable
- [ ] Etiquetar propuestas como generadas por Aby y ofrecer `Ajustar`, `Reportar resultado` y `Empezar de nuevo`.
- [ ] Filtrar y validar prompts, respuestas y ActionPacks en servidor; limitar presupuesto, tamaño, reintentos y timeout.
- [ ] No permitir que Aby complete nodos, modifique progreso o envíe métricas sin acción explícita de la persona.
- [ ] Guardar versión de modelo/prompt y consentimiento aplicable a cada propuesta.
- [ ] Validar con Zod los contratos de objetivo, evidencia, micro pasos y propuestas de Aby; limitar respuestas a una recomendacion destacada, alternativas explicadas y maximo tres pasos por defecto.
- [ ] Implementar sesiones de Aby guiadas o silenciosas por nodo, con cierre breve de resultado/bloqueo/aprendizaje. Nunca usar seguimiento oculto de actividad o interrumpir una sesion iniciada por la persona.
- [ ] Exigir confirmacion humana antes de aplicar rutas alternativas, subtareas, fechas, dependencias o responsables; los cambios compartidos permanecen pendientes hasta la aprobacion aplicable.

### Task 5: Compartidos y creator content
- [ ] Antes de publicar plantillas o expediciones: crear reporte de contenido, bloqueo de usuario, revisión de reportes y contacto de soporte visible.
- [ ] Persistir `reportes_contenido`, `bloqueos_usuario`, `moderacion_contenido` y `reclamaciones_propiedad`; restringir la cola de moderación a personal autorizado.
- [ ] Separar contenido público de progreso privado mediante RLS; en expediciones, mostrar mediante vistas/controladores solo la allowlist de hitos, agregados, objetivo y metadatos de trabajo autorizados.
- [ ] Añadir términos de comunidad y reglas de contenido para creadores.
- [ ] En el piloto, limitar expediciones a invitaciones revocables o codigos temporales y prohibir directorio, feed, perfiles publicos, mensajes, comentarios y medios.
- [ ] En el contrato de expedicion, permitir exclusivamente hitos, estado agregado, proximo objetivo y metadatos autorizados de ramas/nodos; denegar por defecto ejecuciones, sesiones con Aby, notas, métricas y evidencia de otros miembros.
- [ ] Aplicar permisos fijos de propietario, coordinador y miembro; usar roles de trabajo dinámicos sin elevar permisos. Propietario/coordinador asignan por defecto; las solicitudes de miembros requieren aprobación, salvo autoasignación explícita para trabajo sin dependencias.
- [ ] Permitir solo eventos compartidos accionables y autorizados: invitacion, turno propio disponible/proximo, desbloqueo propio, hito agregado, plazo y cambio de plan relevante. No notificar retrasos o detalles privados de otros miembros.

### Task 6: Gems y compras futuras
- [ ] Habilitar solo gemas gratuitas de cofres durante el piloto; mantener compras y precios fuera de la UI.
- [ ] Antes de vender plantillas digitales, integrar In-App Purchase en iOS y Google Play Billing en Android.
- [ ] Crear ledger de transacciones inmutable, restauración de compras y precio por versión de plantilla.
- [ ] Modelar `transacciones_compra` y `movimientos_gemas` como append-only; validar recibos en servidor y derivar el saldo desde el ledger.
- [ ] No desbloquear contenido digital mediante pagos externos dentro de la app móvil.

### Task 7: Checklist de lanzamiento
- [ ] Completar Data Safety en Play Console con datos transmitidos a Supabase y Gemini.
- [ ] Completar privacidad, eliminación de cuenta y propósito de datos en App Store Connect.
- [ ] Declarar funcionalidades de Salud si se incluyen registros de fitness, bienestar, nutrición o sueño.
- [ ] Confirmar edad mínima, países objetivo, retención de datos, soporte y flujos de reporte antes de activar contenido compartido o cobros.
- [ ] Probar con cuenta A que no puede leer, escribir ni inferir datos de cuenta B.
- [ ] Revisar avisos de seguridad de Supabase antes de cada lanzamiento.
