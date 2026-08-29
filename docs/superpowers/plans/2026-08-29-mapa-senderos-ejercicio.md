# Mapa De Senderos De Ejercicio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un mapa visual de nodos para `Salud / Ejercicio` usando datos mock, aislado del mapa compartido actual.

**Architecture:** `ContenedorMapaSenderos` orquesta los datos, posicionamiento, seleccion y scroll. `NodoSendero` representa un nodo reutilizable y `MapaSubcategoria` decide cuando montarlo. `Nodo.tsx` actual se mantiene sin cambios para proteger `MapaCompartido.tsx`.

**Tech Stack:** Expo 57, React Native 0.86, TypeScript, Animated, react-native-svg, lucide-react-native.

**Spec:** `docs/superpowers/specs/2026-08-29-mapa-senderos-ejercicio-design.md`

## Global Constraints

- No se agregan dependencias.
- Las animaciones usan `Animated` con native driver cuando aplica.
- El mapa conserva scroll interno solo en modo enfoque.
- Verificar con `npm run typecheck` y `git diff --check`.

---

### Task 1: Datos Mock Del Mapa

**Files:**
- Create: `src/modulos/senderos/datos/mapaEjercicio.mock.ts`

**Interfaces:**
- Produces: `NodoMapaSendero` and `obtenerNodosMapaMock(subcategoriaId: string): NodoMapaSendero[]`.

- [ ] **Step 1: Definir el contrato y los cinco pasos mock**

```ts
export type NodoMapaSendero = {
  estado: 'activo' | 'bloqueado' | 'completado';
  icono: LucideIcon;
  id: string;
  subtitulo: string;
  titulo: string;
};

export function obtenerNodosMapaMock(subcategoriaId: string): NodoMapaSendero[] {
  return subcategoriaId === 'ejercicio' ? nodosEjercicio : [];
}
```

- [ ] **Step 2: Verificar el contrato con TypeScript**

Run: `npm run typecheck`
Expected: PASS.

### Task 2: Nodo Visual Nuevo

**Files:**
- Create: `src/modulos/senderos/componentes/mapa/NodoSendero.tsx`

**Interfaces:**
- Consumes: `NodoMapaSendero['estado']`, `LucideIcon`, color y callback.
- Produces: `NodoSendero({ Icono, color, estado, seleccionado, onPress })`.

- [ ] **Step 1: Implementar el nodo aislado**

```tsx
type NodoSenderoProps = {
  Icono: LucideIcon;
  color: string;
  estado: NodoMapaSendero['estado'];
  seleccionado: boolean;
  onPress: () => void;
};
```

- [ ] **Step 2: Aplicar escala de pulsacion y halo para el nodo activo**

```tsx
<Pressable onPress={onPress} onPressIn={activarPulsacion} onPressOut={restaurarPulsacion}>
  <Animated.View style={estiloPulsacion}>{contenido}</Animated.View>
</Pressable>
```

- [ ] **Step 3: Verificar compilacion**

Run: `npm run typecheck`
Expected: PASS.

### Task 3: Contenedor Del Mapa

**Files:**
- Create: `src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx`

**Interfaces:**
- Consumes: `altura`, `color`, `enfocado` y `subcategoriaId`.
- Produces: `ContenedorMapaSenderos` con conectores SVG, seleccion y scroll interno.

- [ ] **Step 1: Posicionar nodos en una ruta vertical con desviacion horizontal suave**

```ts
const posicionX = (indice: number) => centro + [0, -46, 42, -30, 20][indice];
const posicionY = (indice: number) => margenSuperior + indice * separacionVertical;
```

- [ ] **Step 2: Dibujar conectores entre posiciones consecutivas con SVG**

```tsx
<Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
  {conexiones.map(({ d, id, activa }) => <Path d={d} key={id} stroke={activa ? color : '#D8D2CC'} />)}
</Svg>
```

- [ ] **Step 3: Seleccionar un nodo, activar haptic seguro y desplazarlo a una zona visible**

```ts
setNodoSeleccionado(id);
scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, y - 120) });
```

- [ ] **Step 4: Verificar compilacion**

Run: `npm run typecheck`
Expected: PASS.

### Task 4: Integracion En Senderos

**Files:**
- Modify: `src/modulos/senderos/pantallas/SenderosPantalla.tsx:1125`

**Interfaces:**
- Consumes: `ContenedorMapaSenderos`.
- Produces: Mapa visible solo cuando la subcategoria activa es `ejercicio`.

- [ ] **Step 1: Montar el contenedor dentro de `MapaSubcategoria`**

```tsx
{categoria.id === 'salud' && subcategoriaId === 'ejercicio' ? (
  <ContenedorMapaSenderos altura={alturaEnfoque} color={color} enfocado={enfocado} subcategoriaId={subcategoriaId} />
) : null}
```

- [ ] **Step 2: Pasar la subcategoria activa desde `CarpetaGiganteSenderos`**

```tsx
<MapaSubcategoria subcategoriaId={subcategoriaEnfocada?.id ?? ''} {...propsMapa} />
```

- [ ] **Step 3: Verificacion final**

Run: `npm run typecheck && git diff --check`
Expected: PASS.
