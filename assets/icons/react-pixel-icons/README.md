# react-pixel-icons

Versión pixel-art (grilla 24x24) de los 2066 íconos de [Lucide](https://lucide.dev),
generados automáticamente. Pensada como reemplazo drop-in de `lucide-react`.

## Cómo se generó

1. Cada SVG original de lucide se rasterizó exactamente a una grilla de 24x24
   (la resolución nativa de diseño de lucide).
2. El canal alpha se binarizó (sin antialiasing): cada celda queda 100% dentro
   o 100% fuera del ícono.
3. Cada fila se comprimió en rects horizontales contiguos (run-length encoding).
4. Se generó un componente `.tsx` por ícono, vectorial (no PNG), con
   `shapeRendering="crispEdges"` para que el borde se vea nítido y "cuadriculado"
   a cualquier tamaño, sin blur de escalado.

## Uso

```tsx
import { Home, Settings, Bell } from 'react-pixel-icons';

function App() {
  return (
    <div>
      <Home size={32} />
      <Settings size={24} color="#e63946" />
      <Bell />
    </div>
  );
}
```

Misma API que `lucide-react`: `size` (número o string), `color`, y cualquier
prop de `<svg>` se puede pasar directo (className, onClick, etc.), más `ref`.

## Calidad / limitaciones (léelo antes de usar en producción)

Esto es una conversión **automática**, no un rediseño manual pixel-art. Es
consistente y queda bien para la mayoría de los casos, pero:

- Íconos con muchos detalles finos en 24px (ej. algunos de "brands" o íconos
  muy geométricos) pueden verse un poco cargados o perder legibilidad.
- No hay pasada de limpieza manual de simetría/kerning entre píxeles como
  haría un pixel artist — para un set "premium" real, usa esto como base y
  corrige a mano los ~50-100 íconos que más uses en tu producto.
- 4 colisiones de nombre por números en el nombre original (ej.
  `arrow-down-0-1` y `arrow-down01` ambos mapean a `ArrowDown01`) — el
  segundo sobrescribe al primero en el build actual. Revisa `generate_react.py`
  si necesitas esos íconos específicos.

## Regenerar / ajustar

El script fuente (`generate_react.py`, no incluido en el paquete final) permite
ajustar:
- `GRID_SIZE`: tamaño de grilla (24 = más "chunky", 32 = más detalle)
- `ALPHA_THRESHOLD`: qué tan "gordos" o "finos" quedan los trazos
- `DEFAULT_COLOR`: color por defecto de los componentes
