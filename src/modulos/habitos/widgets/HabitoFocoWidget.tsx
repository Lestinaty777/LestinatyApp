'use no memo';
import React from 'react';
import type { ImageRequireSource } from 'react-native';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

const ICONO_PLANTA = require('../../../../assets/icons/ui/planta.png') as ImageRequireSource;

// Widget real de Android (2×2): ancla UN hábito a la pantalla de inicio con su
// progreso de hoy y racha, y permite registrar avance con un toque en "+".
//
// Solo puede usar los primitivos de react-native-android-widget (FlexWidget,
// TextWidget, ImageWidget...) — nada de <View>/<Text> de React Native, ni
// hooks (se renderiza a RemoteViews nativas, no a una vista de RN real). Este
// MISMO componente es lo que se muestra en <WidgetPreview> dentro de la app y
// lo que se dibuja en el home screen real — una sola fuente de verdad.
export type HabitoFocoWidgetProps = {
  habitoId: string;
  titulo: string;
  /** Siempre resuelto por mapearHabitoWidget.ts (con respaldo garantizado) — nunca null, el widget nunca cae a un avatar con letra. */
  iconoFuente: ImageRequireSource;
  actual: number;
  meta: number;
  unidad: string;
  racha: number;
  color: string;
  completado: boolean;
};

function hexARgba(hex: string, alpha: number): `rgba(${number}, ${number}, ${number}, ${number})` {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16) || 0;
  const g = parseInt(limpio.slice(2, 4), 16) || 0;
  const b = parseInt(limpio.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Mismo cálculo que MasterProgressbar.tsx (mezclarColor) — duplicado a propósito:
// este archivo no puede importar nada que use hooks/Reanimated, así que se
// mantiene autocontenido con solo la parte pura (aritmética de color).
function mezclarColor(hex: string, porcentaje: number, haciaBlanco: boolean): `#${string}` {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16) || 0;
  const g = parseInt(limpio.slice(2, 4), 16) || 0;
  const b = parseInt(limpio.slice(4, 6), 16) || 0;
  const t = haciaBlanco ? 255 : 0;
  const nr = Math.round(r + (t - r) * porcentaje).toString(16).padStart(2, '0');
  const ng = Math.round(g + (t - g) * porcentaje).toString(16).padStart(2, '0');
  const nb = Math.round(b + (t - b) * porcentaje).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

export function HabitoFocoWidget({
  habitoId,
  titulo,
  iconoFuente,
  actual,
  meta,
  unidad,
  racha,
  color,
  completado,
}: HabitoFocoWidgetProps) {
  const porcentaje = meta > 0 ? Math.max(0, Math.min(100, Math.round((actual / meta) * 100))) : 0;
  const restante = Math.max(0, 100 - porcentaje);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
      }}
      accessibilityLabel={`Widget de ${titulo}, ${actual} de ${meta} ${unidad}`}
    >
      {/* Cabecera: icono del hábito + racha */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: hexARgba(color, 0.16),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageWidget image={iconoFuente} imageWidth={20} imageHeight={20} />
        </FlexWidget>
        <FlexWidget style={{ flex: 1, height: 1 }} />
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(234, 88, 12, 0.16)',
            borderRadius: 12,
            paddingHorizontal: 7,
            paddingVertical: 3,
          }}
        >
          <TextWidget text="🔥" style={{ fontSize: 10 }} />
          <TextWidget
            text={racha > 0 ? ` ${racha}d` : ' Hoy'}
            style={{ color: '#EA580C', fontSize: 10, fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Título + contador */}
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
        <TextWidget
          text={titulo}
          truncate="END"
          maxLines={1}
          style={{ fontSize: 13, fontWeight: 'bold', color: '#1A3320' }}
        />
        <TextWidget
          text={completado ? '¡Completado hoy!' : `${actual} de ${meta} ${unidad}`}
          style={{ fontSize: 10.5, color: '#5B8C65', marginTop: 2 }}
        />
      </FlexWidget>

      {/* Barra de progreso proporcional (flex, se adapta a cualquier ancho) —
          mismo degradado que MasterProgressbar (oscuro→claro sobre el color
          del hábito), sin la animación de burbujas: un widget se redibuja
          puntualmente, no anima en loop. */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          height: 8,
          borderRadius: 4,
          backgroundGradient: { from: mezclarColor(color, 0.85, true), to: mezclarColor(color, 0.92, true), orientation: 'LEFT_RIGHT' },
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            flex: Math.max(porcentaje, 2),
            height: 'match_parent',
            backgroundGradient: { from: mezclarColor(color, 0.2, false), to: mezclarColor(color, 0.4, true), orientation: 'LEFT_RIGHT' },
          }}
        />
        <FlexWidget style={{ flex: Math.max(restante, 0.001), height: 'match_parent' }} />
      </FlexWidget>

      {/* Pie: acción táctil de registro */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget
            text={completado ? '¡Buen trabajo!' : 'Toca + para registrar'}
            style={{ fontSize: 9, color: '#5B8C65' }}
          />
        </FlexWidget>
        {!completado && (
          <FlexWidget
            clickAction="INCREMENTAR"
            clickActionData={{ habitoId }}
            accessibilityLabel={`Registrar avance de ${titulo}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: color as `#${string}`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget text="+" style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }} />
          </FlexWidget>
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

/** Se muestra si el usuario no tiene ningún hábito (o falló la carga) — evita un widget vacío o roto. */
export function WidgetSinHabitos({ mensaje = 'Crea tu primer hábito en Lestinaty' }: { mensaje?: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
      }}
      accessibilityLabel="Widget de Lestinaty, sin hábitos todavía"
    >
      <ImageWidget image={ICONO_PLANTA} imageWidth={28} imageHeight={28} />
      <TextWidget
        text={mensaje}
        maxLines={2}
        truncate="END"
        style={{ fontSize: 11, color: '#5B8C65', textAlign: 'center', marginTop: 6 }}
      />
    </FlexWidget>
  );
}
