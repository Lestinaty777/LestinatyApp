# Ejecutor de Sesiones de Senderos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir cada sendero de la biblioteca en una sesion accionable con carril horizontal de pasos y espacio de trabajo contextual.

**Architecture:** Extraer el catalogo de senderos desde `SenderosPantalla` a datos compartidos y construir pasos mock locales por sendero. La pantalla de detalle recibe el id, centra un `FlatList` horizontal en el paso actual y cambia un unico espacio de trabajo inferior segun el tipo de nodo. La biblioteca solo navega y conserva sus animaciones existentes; no hay base de datos ni integracion con `Hoy`.

**Tech Stack:** Expo Router, React Native, TypeScript, React Native Animated, react-native-reanimated, expo-haptics, react-native-safe-area-context.

**Spec:** `docs/superpowers/specs/2026-08-28-ejecutor-sesiones-senderos-design.md`

## Global Constraints

- Conservar la carga progresiva y las animaciones de biblioteca existentes.
- No usar mapas SVG largos, posiciones sinusoidales, tooltips dentro de nodos ni bucles decorativos en el ejecutor.
- Usar un unico `FlatList` horizontal con medidas fijas, `getItemLayout` y `scrollToIndex`.
- No hay runner de pruebas configurado; verificar cada tarea con `npm run typecheck` y Expo Go Android.
- No modificar archivos de Analisis no relacionados.

---

### Task 1: Modelo compartido de senderos y sesiones

**Files:**
- Create: `src/modulos/senderos/datos/senderos.ts`
- Create: `src/modulos/senderos/datos/pasosMock.ts`
- Modify: `src/modulos/senderos/pantallas/SenderosPantalla.tsx`

**Interfaces:**
- Produces: `obtenerSendero(id: string): SenderoDefinicion | undefined`.
- Produces: `obtenerPasosMock(sendero: SenderoDefinicion): PasoSendero[]`.
- Consumes: tipos de categoria y datos mock que hoy estan declarados en `SenderosPantalla`.

- [ ] **Step 1: Implementar datos mock de pasos**

Definir los tipos y transiciones sin React:

```ts
export type TipoWidgetNodo = 'check' | 'temporizador' | 'eisenhower' | 'kanban' | 'registro';
export type EstadoPasoSesion = 'bloqueado' | 'disponible' | 'actual' | 'completado';

export type PasoSendero = {
  descripcion: string;
  id: string;
  metadata: string;
  tipoWidget: TipoWidgetNodo;
  titulo: string;
};
```

`obtenerPasosMock` devuelve pasos diferentes segun categoria. El estado de completado se mantiene en `DetalleSenderoPantalla` y se pierde al cerrar la ruta.

- [ ] **Step 2: Verificar los datos mock**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Migrar biblioteca al catalogo compartido**

Mover `CategoriaSenderoId`, `SenderoMini`, `CategoriaCarpeta` y `categoriasCarpeta` desde `SenderosPantalla.tsx` a `datos/senderos.ts`; importar los valores sin cambiar JSX ni animaciones de biblioteca.

- [ ] **Step 4: Verificar sin regresion de biblioteca**

Run: `npm run typecheck`

Expected: PASS. En Expo Go, abrir y cerrar una categoria y confirmar que los skeletons y separadores animados no cambian.

### Task 2: Componentes del espacio de trabajo

**Files:**
- Create: `src/modulos/senderos/componentes/NodoPasoSendero.tsx`
- Create: `src/modulos/senderos/componentes/CarrilPasosSendero.tsx`
- Create: `src/modulos/senderos/componentes/EspacioTrabajoNodo.tsx`

**Interfaces:**
- Consumes: `PasoSendero`, `EstadoPasoSesion` y `TipoWidgetNodo` de `datos/pasosMock.ts`.
- Produces: `CarrilPasosSendero({ pasos, pasoSeleccionadoId, onSeleccionarPaso, indiceActual })`.
- Produces: `EspacioTrabajoNodo({ paso, puedeCompletar, onCompletar })`.

- [ ] **Step 1: Implementar `NodoPasoSendero` sin tooltip**

Renderizar icono y cuatro estados con una unica superficie presionable:

```tsx
<Pressable disabled={estado === 'bloqueado'} onPress={onPress}>
  <View style={[styles.nodo, estado === 'actual' && { borderColor: color }]}>
    <Icono color={estado === 'bloqueado' ? '#9A9A9A' : color} size={22} />
  </View>
</Pressable>
```

Mantener la base visual de hexagono solo si no obliga a tooltip, SVG complejo o posicionamiento absoluto.

- [ ] **Step 2: Implementar carril centrable**

Usar ancho fijo de item, espaciadores laterales calculados desde `useWindowDimensions`, `getItemLayout` y `scrollToIndex` al cambiar `indiceActual`:

```tsx
const ITEM_WIDTH = 92;
const getItemLayout = (_: unknown, index: number) => ({
  index,
  length: ITEM_WIDTH,
  offset: ITEM_WIDTH * index,
});
```

- [ ] **Step 3: Implementar espacio de trabajo con un widget activo**

Crear widgets `check` y `temporizador` funcionales; renderizar Eisenhower, Kanban y registro como superficies compactas no editables en esta primera entrega. El boton de completar solo se muestra para el nodo `actual`.

- [ ] **Step 4: Verificar componentes**

Run: `npm run typecheck`

Expected: PASS. En Expo Go, deslizar el carril sin saltos y confirmar que nodos bloqueados no ejecutan `onPress`.

### Task 3: Reemplazar el placeholder de detalle por el ejecutor

**Files:**
- Modify: `src/modulos/senderos/pantallas/DetalleSenderoPantalla.tsx`
- Modify: `app/senderos/[id].tsx`

**Interfaces:**
- Consumes: `obtenerSendero`, `obtenerPasosMock`, `CarrilPasosSendero`, `EspacioTrabajoNodo`.
- Produces: detalle navegable para cualquier id del catalogo y estado vacio para ids inexistentes.

- [ ] **Step 1: Añadir estado de detalle sin datos**

Usar `useLocalSearchParams<{ id: string }>()`, resolver el sendero y mostrar un retorno cuando `obtenerSendero(id)` sea `undefined`.

- [ ] **Step 2: Comprobar ruta invalida**

Run: `npm run typecheck`

Expected: PASS. En Expo Go abrir `/senderos/inexistente` y verificar que no hay excepcion.

- [ ] **Step 3: Componer las tres franjas**

Usar `SafeAreaView` y un contenedor glass de altura util:

```tsx
<View style={styles.espacioTrabajo}>
  <CabeceraSesion sendero={sendero} onVolver={router.back} />
  <CarrilPasosSendero ... />
  <EspacioTrabajoNodo ... />
</View>
```

La cabecera usa la ilustracion del sendero y reemplaza `senderos.png`; no conservar la ilustracion global detras.

- [ ] **Step 4: Implementar completado y centrado**

Al completar: invocar `hapticSeguro('accion')`, actualizar solo los pasos locales con `useState`, seleccionar el siguiente paso y dejar que el carril ejecute `scrollToIndex`. Animar una sola capa de linea de progreso durante 300-450 ms.

- [ ] **Step 5: Verificar detalle**

Run: `npm run typecheck`

Expected: PASS. En Expo Go abrir `rutina-manana`, completar cada paso y confirmar que el carril centra el siguiente y no hay nodos futuros completables.

### Task 4: Navegacion desde biblioteca y retiro del mapa antiguo

**Files:**
- Modify: `src/modulos/senderos/pantallas/SenderosPantalla.tsx`
- Modify: `src/modulos/senderos/paginas/CompartidosSenderos.tsx`
- Delete: `src/modulos/senderos/paginas/MapaCompartido.tsx`
- Delete: `src/diseno/componentes/Nodo.tsx`
- Modify: `src/diseno/componentes/index.ts`

**Interfaces:**
- Consumes: `router.push({ pathname: '/senderos/[id]', params: { id } })`.
- Removes: `MapaCompartido` y exportacion de `Nodo` sin consumidores.

- [ ] **Step 1: Conectar tarjetas de biblioteca al detalle**

En `TarjetaSenderoMini` y `TarjetaSenderoVertical`, conservar haptic y navegar con el id:

```ts
router.push({ pathname: '/senderos/[id]', params: { id: sendero.id } });
```

- [ ] **Step 2: Aplicar transicion de biblioteca**

Antes de navegar, animar solo la tarjeta tocada con escala y opacidad. La cabecera global se desvanece por la transicion nativa de Stack; no mantener un blur activo despues de navegar.

- [ ] **Step 3: Retirar mapa y nodo anteriores**

Eliminar el boton que abre `MapaCompartido`, su overlay y sus imports. Borrar `MapaCompartido.tsx`, `Nodo.tsx` y su reexportacion cuando `rg "MapaCompartido|\\bNodo\\b" src app` no tenga consumidores productivos.

- [ ] **Step 4: Ejecutar verificacion final**

Run: `npm run typecheck`

Expected: PASS.

Manual Android: abrir una categoria, entrar a un sendero, volver, verificar la biblioteca; abrir una ruta inexistente; completar una sesion; navegar a Compartidos y confirmar que no queda accion muerta hacia el mapa eliminado.
