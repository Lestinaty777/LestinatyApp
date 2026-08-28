# Arquitectura de Widgets Dinámicos (SDUI + IA)

Este documento define la estructura maestra para desvincular el diseño visual de la lógica de negocio, permitiendo que la IA parametrice los widgets en tiempo real sin riesgo de romper la UI.

## 1. El Esquema de Datos (TypeScript / Supabase)

Todo el sistema gira en torno a esta separación de responsabilidades. Los colores se manejan con una cascada de prioridad: **Color del Content Pack > Color de la Categoría > Color por Defecto.**

```typescript
// 1. Identificadores de Motores Visuales (Capa 1)
// Estos son los ÚNICOS componentes que nosotros programaremos.
export type WidgetEngineId = 
  | 'progress-cylinder'   // El tanque de agua
  | 'progress-ring'       // Anillo estilo Apple Watch
  | 'trend-line'          // La línea de báscula/electrocardiograma
  | 'consistency-grid';   // El calendario de cuadritos/círculos

// 2. El Content Pack (Capa 2 - Cacheable)
export interface ContentPack {
  id: string;
  goal_id: string;           // Ej: 'bajar-de-peso'
  habit_id: string;          // Ej: 'caminar-20-min'
  widget_id: WidgetEngineId; // Qué motor visual usar
  
  // -- Semántica Visual --
  title: string;             // "Caminata Diaria"
  subtitle: string;          // "Tu paso hacia perder peso"
  value_label: string;       // "min caminados"
  unit: string;              // "min", "L", "kg"
  icon: string;              // Nombre del icono de Lucide (ej: 'Footprints')
  
  // -- Cascada de Color --
  // Si la IA decide un color específico (ej. Agua = Azul), se usa este.
  // Si es null, el MasterComponent inyectará automáticamente el color de la Categoría (Ej. Salud = Verde).
  color_override: string | null; 

  // -- Textos Dinámicos (El "Alma") --
  microcopy: {
    onTrack: string; // "Vas muy bien, sigue así 🔥"
    behind: string;  // "Aún puedes lograrlo hoy"
    done: string;    // "¡Meta cumplida! Tu corazón lo agradece"
  };
}

// 3. Datos Crudos del Usuario (Diario)
export interface UserMetric {
  habit_id: string;
  date: string;
  value: number;
}
```

## 2. El Catálogo de Motores (Widget Registry)

El Registro es un diccionario estático en la app que vincula el `WidgetEngineId` de la base de datos con el componente real de React Native.

```typescript
import { MotorCilindro, MotorAnillo, MotorLinea, MotorCalendario } from './motores';

export const WIDGET_REGISTRY = {
  'progress-cylinder': MotorCilindro,
  'progress-ring': MotorAnillo,
  'trend-line': MotorLinea,
  'consistency-grid': MotorCalendario
};
```

## 3. El Orquestador (`AnalyticsMaster.tsx`)

Este componente recibe los datos crudos y la configuración (Content Pack), resuelve la cascada de colores, y dibuja el motor correcto. **Él no sabe qué es un "litro" ni qué es "bajar de peso".**

```tsx
interface AnalyticsMasterProps {
  contentPack: ContentPack;
  metrics: UserMetric[];
  colorCategoria: string; // Se inyecta desde arriba (ej. verde para Salud)
}

export function AnalyticsMaster({ contentPack, metrics, colorCategoria }: AnalyticsMasterProps) {
  // 1. Resuelve el Motor Visual
  const MotorVisual = WIDGET_REGISTRY[contentPack.widget_id];

  // 2. Resuelve el Color (ContentPack Override > Color de Categoría)
  const acentoFinal = contentPack.color_override || colorCategoria;

  // 3. Renderiza inyectando vida
  return (
    <MotorVisual 
      pack={contentPack} 
      data={metrics} 
      acento={acentoFinal} 
    />
  );
}
```

## 4. Plan de Ejecución (Paso a Paso)

Para llevar nuestra app actual a esta arquitectura, ejecutaremos el siguiente plan:

1. **Definir Tipos:** Crear `tipos_sdui.ts` en nuestro código con las interfaces de arriba.
2. **Refactorizar Motores:** Agarrar el `WidgetHidratacion.tsx` que hicimos, renombrarlo a `MotorCilindro.tsx` y quitarle las palabras "Agua" y "Litros", reemplazándolas por `pack.title` y `pack.unit`.
3. **Crear el Registro:** Crear `registroWidgets.ts` y el `AnalyticsMaster.tsx`.
4. **Prueba de Mutación:** Configurar nuestro `AnalisisSenderos.tsx` para enviarle dos *Content Packs* falsos al `AnalyticsMaster`. Veremos en tiempo real cómo el mismo `MotorCilindro` sirve para mostrar "Tomar Agua" (azul) y "Tomar Café" (marrón) sin escribir más código de interfaz.
