import React, { useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { X, Check, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  MasterGlass,
  MasterIcon,
  MasterIconBg,
  MasterChanger,
  Texto,
  Rebote,
  conAlfa,
} from '../../../../diseno';
import { colorMasterMasCercano } from '../../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { TonoDelHabito } from '../../../habitos/componentes/TonoDelHabito';
import type { SeccionSenderoHabito } from '../../../habitos/senderoHabito.tipos';
import { CarruselNivelesSendero } from './CarruselNivelesSendero';
import { esSeccionSeleccionable } from './carruselNiveles.modelo';

type Props = {
  visible: boolean;
  onCerrar: () => void;
  secciones: SeccionSenderoHabito[];
  nivelSeleccionado: number;
  paqueteId: string;
  colorPaquete: string;
  colorEfectivo?: string;
  tituloHabito?: string;
  iconoHabito?: { fuente: any; hue?: number } | null;
  onSeleccionar: (nivel: number) => void;
};

export function ModalNivelesSendero({
  visible,
  onCerrar,
  secciones,
  nivelSeleccionado,
  paqueteId,
  colorPaquete,
  colorEfectivo,
  tituloHabito,
  iconoHabito,
  onSeleccionar,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorTema = colorEfectivo ?? colorPaquete;

  const handleSeleccionarNivel = (nivel: number) => {
    hapticSeguro('seleccion');
    onSeleccionar(nivel);
    onCerrar();
  };

  return (
    <Modal
      animationType="slide"
      hardwareAccelerated
      onRequestClose={onCerrar}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <TonoDelHabito colorPaquete={colorPaquete} paqueteId={paqueteId}>
        <View style={s.overlay}>
          {/* Fondo semi-transparente para cerrar al pulsar fuera */}
          <Pressable
            accessibilityLabel={t('senderos.levels.close')}
            onPress={onCerrar}
            style={s.backdrop}
          />

          {/* Hoja Desplegable Inferior */}
          <View style={s.contenedorSheet}>
            <MasterGlass
              blur
              colorBase={colorTema}
              style={[
                s.sheetGlass,
                { paddingBottom: Math.max(insets.bottom, 16) + 12 },
              ]}
            >
              {/* Píldora / Manija superior */}
              <View style={s.manijaContenedor}>
                <View style={s.manija} />
              </View>

              {/* Cabecera del modal */}
              <View style={s.headerFila}>
                <View style={s.headerInfo}>
                  {iconoHabito && (
                    <MasterIconBg
                      colorBordeInicio="rgba(255,255,255,0.7)"
                      colorBordeFin="rgba(0,0,0,0.15)"
                      degradadoInicio="rgba(255,255,255,0.9)"
                      degradadoFin="rgba(255,255,255,0.6)"
                      size={38}
                      tinte={colorTema}
                    >
                      <MasterChanger
                        alto={30}
                        ancho={30}
                        fuente={iconoHabito.fuente}
                        hueDestino={iconoHabito.hue}
                      />
                    </MasterIconBg>
                  )}
                  <View style={s.headerTextos}>
                    <Texto numberOfLines={1} style={s.headerSubtitulo}>
                      {t('senderos.levels.modalTitle')}
                    </Texto>
                    <Texto numberOfLines={1} style={s.headerTitulo}>
                      {tituloHabito ?? t('senderos.detalle.tituloPorDefecto')}
                    </Texto>
                  </View>
                </View>

                <Rebote
                  accessibilityLabel={t('senderos.levels.close')}
                  onPress={onCerrar}
                  estilo={s.botonCerrar}
                >
                  <X color="#333333" size={18} strokeWidth={2.5} />
                </Rebote>
              </View>

              {/* Selector rápido de píldoras de nivel (1..7) */}
              <View style={s.pildorasNiveles}>
                {secciones.map((sec) => {
                  const esActivo = sec.nivel === nivelSeleccionado;
                  const seleccionable = esSeccionSeleccionable(sec);
                  const esCompletado = sec.estado === 'completado';

                  return (
                    <Pressable
                      key={`pildora-${sec.nivel}`}
                      disabled={!seleccionable}
                      onPress={() => handleSeleccionarNivel(sec.nivel)}
                      style={[
                        s.pildoraItem,
                        esActivo && [s.pildoraItemActiva, { borderColor: colorTema, backgroundColor: conAlfa(colorTema, 0.18) }],
                        !seleccionable && s.pildoraItemBloqueada,
                      ]}
                    >
                      {esCompletado && !esActivo ? (
                        <Check color={colorTema} size={12} strokeWidth={3} />
                      ) : sec.estado === 'bloqueado' ? (
                        <Lock color="#8A8A8A" size={11} strokeWidth={2.5} />
                      ) : (
                        <MasterIcon alTema name={`nivel${sec.nivel}`} size={14} />
                      )}
                      <Texto
                        style={[
                          s.pildoraTexto,
                          esActivo && [s.pildoraTextoActivo, { color: colorTema }],
                          !seleccionable && s.pildoraTextoBloqueado,
                        ]}
                      >
                        {sec.nivel}
                      </Texto>
                    </Pressable>
                  );
                })}
              </View>

              {/* Subtítulo indicativo */}
              <View style={s.instruccionContenedor}>
                <Texto style={s.instruccionTexto}>
                  {t('senderos.levels.modalSubtitle')}
                </Texto>
              </View>

              {/* Carrusel Horizontal de Niveles */}
              <View style={s.carruselWrapper}>
                <CarruselNivelesSendero
                  colorPaquete={colorPaquete}
                  nivelSeleccionado={nivelSeleccionado}
                  onSeleccionar={handleSeleccionarNivel}
                  paqueteId={paqueteId}
                  secciones={secciones}
                />
              </View>
            </MasterGlass>
          </View>
        </View>
      </TonoDelHabito>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as object,
    backgroundColor: 'transparent',
  },
  contenedorSheet: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetGlass: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    paddingTop: 8,
  },
  manijaContenedor: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  manija: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    height: 4,
    width: 42,
  },
  headerFila: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  headerTextos: {
    flex: 1,
  },
  headerSubtitulo: {
    color: '#6E6B7B',
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitulo: {
    color: '#1A1335',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    marginTop: 1,
  },
  botonCerrar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pildorasNiveles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  pildoraItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  pildoraItemActiva: {
    borderWidth: 2,
    transform: [{ scale: 1.04 }],
  },
  pildoraItemBloqueada: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'transparent',
    opacity: 0.55,
  },
  pildoraTexto: {
    color: '#333333',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  pildoraTextoActivo: {
    fontFamily: 'Montserrat-Black',
  },
  pildoraTextoBloqueado: {
    color: '#8A8A8A',
  },
  instruccionContenedor: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  instruccionTexto: {
    color: '#767285',
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
  },
  carruselWrapper: {
    paddingTop: 6,
    paddingBottom: 6,
  },
});
