'use no memo';
import React from 'react';
import type { ImageRequireSource } from 'react-native';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

const ICONO_PLANTA = require('../../../../assets/icons/ui/planta.png') as ImageRequireSource;

// Widget real de Android (2×2): ancla UN hábito a la pantalla de inicio con su
// progreso de hoy y racha, y permite registrar avance con un toque en "+".
//
// Diseñado siguiendo el lenguaje visual MasterGlass (cristal esmerilado con
// bisel reflectivo, degradados blanco→menta y botón táctil estilo MasterButton).
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

function mezclarHex(origen: string, destino: string, proporcion: number): `#${string}` {
  const limpioOrigen = origen.replace('#', '');
  const limpioDestino = destino.replace('#', '');
  const rO = parseInt(limpioOrigen.slice(0, 2), 16) || 0;
  const gO = parseInt(limpioOrigen.slice(2, 4), 16) || 0;
  const bO = parseInt(limpioOrigen.slice(4, 6), 16) || 0;
  const rD = parseInt(limpioDestino.slice(0, 2), 16) || 0;
  const gD = parseInt(limpioDestino.slice(2, 4), 16) || 0;
  const bD = parseInt(limpioDestino.slice(4, 6), 16) || 0;
  const r = Math.round(rO + (rD - rO) * proporcion).toString(16).padStart(2, '0');
  const g = Math.round(gO + (gD - gO) * proporcion).toString(16).padStart(2, '0');
  const b = Math.round(bO + (bD - bO) * proporcion).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
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
  // El widget siempre guarda un hex válido (mismo color que MasterButton usa
  // en el resto de la app) — se afirma el tipo acá en vez de en cada uso.
  const colorSeguro = (color || '#21A844') as `#${string}`;

  // Paleta de cristal adaptativa basada en MasterGlass.tsx:
  // El cristal refleja blanco puro en la parte superior y se funde suavemente
  // en un menta translúcido con un matiz específico del hábito en la base.
  const mentaSuave = mezclarHex(colorSeguro, '#FFFFFF', 0.95);
  const mentaProfunda = mezclarHex(colorSeguro, '#FFFFFF', 0.86);
  const colorCuerpo = mezclarHex(mentaSuave, mentaProfunda, 0.45);
  const colorFondoPie = mezclarHex(colorCuerpo, colorSeguro, 0.16);
  const colorBordeInferior = mezclarHex(colorFondoPie, colorSeguro, 0.35);

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
        borderRadius: 22,
        borderWidth: 1.6,
        borderColor: 'rgba(255, 255, 255, 0.92)',
        borderBottomColor: hexARgba(colorBordeInferior, 0.7),
        backgroundGradient: {
          from: '#FFFFFF',
          to: colorFondoPie,
          orientation: 'TOP_BOTTOM',
        },
        paddingHorizontal: 13,
        paddingTop: 12,
        paddingBottom: 12,
      }}
      accessibilityLabel={`Widget MasterGlass de ${titulo}, ${actual} de ${meta} ${unidad}`}
    >
      {/* Cabecera: icono del hábito (pedestal mini MasterGlass) + chip de racha esmerilado */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            borderWidth: 1.2,
            borderColor: 'rgba(255, 255, 255, 0.95)',
            borderBottomColor: hexARgba(colorSeguro, 0.35),
            backgroundGradient: {
              from: mezclarHex(colorSeguro, '#FFFFFF', 0.88),
              to: mezclarHex(colorSeguro, '#FFFFFF', 0.7),
              orientation: 'TOP_BOTTOM',
            },
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
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(251, 146, 60, 0.35)',
            backgroundGradient: {
              from: '#FFF8F1',
              to: '#FED7AA',
              orientation: 'TOP_BOTTOM',
            },
            paddingHorizontal: 7.5,
            paddingVertical: 3,
          }}
        >
          <TextWidget text="🔥" style={{ fontSize: 9.5 }} />
          <TextWidget
            text={racha > 0 ? ` ${racha}d` : ' Hoy'}
            style={{ color: '#C2410C', fontSize: 10, fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Título + contador en contraste con el cristal */}
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent', marginTop: 1 }}>
        <TextWidget
          text={titulo}
          truncate="END"
          maxLines={1}
          style={{ fontSize: 13.5, fontWeight: 'bold', color: '#132E1B' }}
        />
        <TextWidget
          text={completado ? '✓ ¡Meta lograda hoy!' : `${actual} de ${meta} ${unidad}`}
          style={{
            fontSize: 10.5,
            color: completado ? '#15803D' : '#3F724D',
            fontWeight: completado ? 'bold' : 'normal',
            marginTop: 2,
          }}
        />
      </FlexWidget>

      {/* Barra de progreso MasterProgressbar (borde blanco brillante y relleno de color puro) */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          height: 8,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.85)',
          backgroundGradient: {
            from: '#E3F2E5',
            to: '#EEF8EF',
            orientation: 'LEFT_RIGHT',
          },
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            flex: Math.max(porcentaje, 2),
            height: 'match_parent',
            borderRadius: 3.5,
            backgroundGradient: {
              from: colorSeguro,
              to: mezclarHex(colorSeguro, '#FFFFFF', 0.35),
              orientation: 'LEFT_RIGHT',
            },
          }}
        />
        <FlexWidget style={{ flex: Math.max(restante, 0.001), height: 'match_parent' }} />
      </FlexWidget>

      {/* Pie: mensaje de estado + botón táctil 3D réplica de MasterButton */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget style={{ flex: 1, marginRight: 6 }}>
          <TextWidget
            text={completado ? '🎉 ¡Constancia impecable!' : 'Toca + para registrar'}
            truncate="END"
            maxLines={1}
            style={{
              fontSize: 9.5,
              color: completado ? '#1E6B34' : '#4E7E5A',
              fontWeight: completado ? 'bold' : 'normal',
            }}
          />
        </FlexWidget>

        {!completado ? (
          <FlexWidget
            clickAction="INCREMENTAR"
            clickActionData={{ habitoId }}
            accessibilityLabel={`Registrar avance de ${titulo}`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 11,
              backgroundColor: mezclarHex(colorSeguro, '#000000', 0.45), // Extrusión inferior 3D (sombra física)
              paddingBottom: 2.5,
            }}
          >
            <FlexWidget
              style={{
                width: 'match_parent',
                height: 'match_parent',
                borderRadius: 9,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.45)', // Bisel superior de luz
                backgroundGradient: {
                  from: mezclarHex(colorSeguro, '#FFFFFF', 0.16),
                  to: colorSeguro,
                  orientation: 'TOP_BOTTOM',
                },
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextWidget text="+" style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }} />
            </FlexWidget>
          </FlexWidget>
        ) : (
          <FlexWidget
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 1.2,
              borderColor: 'rgba(34, 197, 94, 0.45)',
              backgroundGradient: {
                from: 'rgba(240, 253, 244, 0.95)',
                to: 'rgba(220, 252, 231, 0.85)',
                orientation: 'TOP_BOTTOM',
              },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget text="✓" style={{ color: '#16A34A', fontSize: 13, fontWeight: 'bold' }} />
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
        justifyContent: 'space-between',
        borderRadius: 22,
        borderWidth: 1.6,
        borderColor: 'rgba(255, 255, 255, 0.92)',
        borderBottomColor: 'rgba(140, 207, 146, 0.5)',
        backgroundGradient: {
          from: '#FFFFFF',
          to: '#E5F5E6',
          orientation: 'TOP_BOTTOM',
        },
        padding: 15,
      }}
      accessibilityLabel="Widget MasterGlass de Lestinaty, sin hábitos todavía"
    >
      <FlexWidget
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          borderWidth: 1.2,
          borderColor: 'rgba(255, 255, 255, 0.95)',
          borderBottomColor: 'rgba(33, 168, 68, 0.25)',
          backgroundGradient: {
            from: '#EAF7EC',
            to: '#D2EED8',
            orientation: 'TOP_BOTTOM',
          },
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
        }}
      >
        <ImageWidget image={ICONO_PLANTA} imageWidth={26} imageHeight={26} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
        <TextWidget
          text="Comienza tu sendero"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#132E1B' }}
        />
        <TextWidget
          text={mensaje}
          maxLines={2}
          truncate="END"
          style={{ fontSize: 10, color: '#437751', textAlign: 'center', marginTop: 2 }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(33, 168, 68, 0.3)',
          backgroundColor: 'rgba(33, 168, 68, 0.12)',
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <TextWidget text="Toca para abrir ↗" style={{ fontSize: 9.5, color: '#1D7838', fontWeight: 'bold' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
