# Cofres de Senderos

## Objetivo

Dar a las personas free una fuente visible, frecuente y segura de gemas dentro
del sendero de cada hábito, sin añadir días artificiales ni alterar la
progresión de nivel.

## Experiencia

Los cofres son hitos visuales entre nodos, no nodos de progreso:

- Cada tercer día completado de un nivel desbloquea un cofre menor.
- Un cofre menor otorga de 8 a 15 gemas, decidido y persistido por el servidor.
- El último nodo de un nivel desbloquea un cofre final con la recompensa del
  nivel definida hoy por la fórmula existente: nivel nuevo × 5.
- Un cofre disponible muestra `cofre.png`; tras reclamarse muestra siempre
  `cofre-cerrado.png` y no responde al toque.
- Al reclamar: se reproduce `abrir-cofre.webm`, aparecen las gemas ganadas y
  se actualiza el saldo. El estado cerrado sustituye al cofre al terminar.

Los cofres se colocan junto al nodo que los desbloquea y no cambian
`cantidadNodos`, conexiones, orden de días ni escala del mapa.

## Economía y seguridad

Se agrega un estado persistente por `(usuario, hábito, nivel, umbral, tipo)`.
Una RPC `reclamar_cofre_sendero` verifica que el hábito sea de la persona y
que el número real de días completados del plan vigente alcance el umbral.
La fila única y la acreditación de gemas ocurren en la misma transacción: un
reintento nunca paga dos veces.

Los cofres menores usan el motivo `recompensa_cofre_sendero`; el cofre final
conserva `recompensa_nivel`, pero deja de acreditarse automáticamente al subir
de nivel. La subida crea su cofre final pendiente y el saldo se acredita solo
cuando este se reclama.

## Color y assets

`cofre.png` y `cofre-cerrado.png` se renderizan con `MasterChanger` dentro de
`TonoDelHabito`, tomando el hue del paquete del hábito.

`expo-video` no puede aplicar el shader de `MasterChanger` a un WebM durante
la reproducción. Para que la apertura también tenga color, se generan siete
variantes estáticas de `abrir-cofre.webm`, una por `ColorMaster` (1–7), con un
script reproducible de FFmpeg que rota el hue del vídeo verde. La UI selecciona
la variante con `colorMasterMasCercano(colorPaquete)`, el mismo criterio usado
para assets no vectoriales del tema. Esto evita filtros nativos frágiles y
mantiene la animación ligera.

## Restricciones

- Sin recompensas ni aleatoriedad calculada en cliente.
- Sin aumentar la longitud, zoom o tamaño lógico de los mapas.
- El vídeo debe descargarse desde assets locales y reproducirse una vez, sin
  loop ni capas de vídeo simultáneas.
- El resultado debe funcionar en Android con `expo-video` ya instalado.

## Pruebas

- Los umbrales generan cofres en 3, 6, 9… y el final del nivel.
- La RPC rechaza reclamar un cofre bloqueado, ajeno o ya reclamado.
- Un cofre menor devuelve y persiste un valor entre 8 y 15.
- El cofre final entrega exactamente la recompensa de nivel una sola vez.
- El selector de asset WebM coincide con el `ColorMaster` más cercano.
- Un cofre reclamado muestra el asset cerrado y no es presionable.
