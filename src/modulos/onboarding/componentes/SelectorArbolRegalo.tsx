import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { MasterButton, MasterGlass, MasterIcon, Rebote, Texto } from '../../../diseno';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerCatalogoArboles } from '../../tienda/gemas.servicio';
import { obtenerAssetsPaquete, PAQUETES_ARBOL } from '../../senderos/algoritmo/registroPaquetesArbol';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const C = { texto: '#1A1335', verde: ESCALA_ESMERALDA.jade.l50 };

// Compartido entre RegaloBienvenidaPantalla y RegaloTrialHorizonPantalla —
// ambos son "elegí 1 árbol y te lo regalamos", solo cambia el texto de
// alrededor y qué RPC se llama al confirmar. Filtra por rareza=legendario
// explícitamente (no solo por tener assets registrados): ningún regalo
// gratuito debe poder entregar un árbol "único" (reservados para gemas).
export function SelectorArbolRegalo({
  confirmando,
  onConfirmar,
  textoBotonIdle = 'ELIGE UN ÁRBOL PARA CONTINUAR',
  textoBotonConfirmando = 'Plantando tu árbol…',
  paddingBottomPie = 18,
}: {
  confirmando: boolean;
  onConfirmar: (paqueteId: string) => void;
  textoBotonIdle?: string;
  textoBotonConfirmando?: string;
  paddingBottomPie?: number;
}) {
  const esc = useEscala();
  const s = useEstilosS();
  const [elegido, setElegido] = useState<string | null>(null);

  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const paquetes = (consultaCatalogo.data ?? []).filter(
    (p) => p.rareza === 'legendario' && Object.prototype.hasOwnProperty.call(PAQUETES_ARBOL, p.id),
  );

  const paqueteSeleccionado = paquetes.find((p) => p.id === elegido);

  function confirmar() {
    if (!elegido) return;
    hapticSeguro('seleccion');
    onConfirmar(elegido);
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.grilla} showsVerticalScrollIndicator={false} style={s.scroll}>
        {consultaCatalogo.isLoading ? (
          <View style={s.cargandoContenedor}>
            <Texto style={s.cargando}>Cargando especies de árboles…</Texto>
          </View>
        ) : (
          <View style={s.filas}>
            {paquetes.map((paquete) => {
              const seleccionado = elegido === paquete.id;
              const imagen = obtenerAssetsPaquete(paquete.id)?.etapas[6];
              const colorMaster = colorMasterMasCercano(paquete.masterPackColor);

              return (
                <Rebote
                  accessibilityLabel={`Elegir ${paquete.nombre}`}
                  key={paquete.id}
                  onPress={() => {
                    hapticSeguro('seleccion');
                    setElegido(paquete.id);
                  }}
                  estilo={s.tarjetaEnvoltura}
                >
                  <MasterGlass
                    colorBase={paquete.masterPackColor}
                    style={[
                      s.tarjeta,
                      seleccionado && {
                        borderColor: paquete.masterPackColor,
                        borderWidth: 2.2,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      },
                    ]}
                  >
                    {seleccionado && (
                      <View style={[s.checkSeleccionado, { backgroundColor: paquete.masterPackColor }]}>
                        <Check color="#FFFFFF" size={13} strokeWidth={3.5} />
                      </View>
                    )}

                    <View style={s.badgeGratis}>
                      <Texto style={s.badgeGratisTexto}>GRATIS</Texto>
                    </View>

                    <View style={[s.auraCirculo, { backgroundColor: `${paquete.masterPackColor}18` }]}>
                      {imagen && <Image resizeMode="contain" source={imagen} style={s.imagenArbol} />}
                    </View>

                    <Texto numberOfLines={1} style={s.nombreArbol}>
                      {paquete.nombre}
                    </Texto>

                    <View style={s.iconoDetalle}>
                      <MasterIcon color={colorMaster} name="hoja3" size={16} />
                    </View>
                  </MasterGlass>
                </Rebote>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[s.pie, { paddingBottom: paddingBottomPie }]}>
        <MasterButton
          color={paqueteSeleccionado?.masterPackColor || esc.hoja.l61a}
          disabled={!elegido || confirmando}
          onPress={confirmar}
          style={s.botonConfirmar}
        >
          {confirmando
            ? textoBotonConfirmando
            : elegido
            ? `PLANTAR ${paqueteSeleccionado?.nombre.toUpperCase()}`
            : textoBotonIdle}
        </MasterButton>
      </View>
    </>
  );
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  scroll: { flex: 1 },
  grilla: { paddingHorizontal: 16, paddingTop: 14 },
  cargandoContenedor: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  cargando: { color: esc.musgo.l51, fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center' },
  filas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingBottom: 90 },
  tarjetaEnvoltura: { width: '47%' },
  tarjeta: {
    alignItems: 'center',
    borderRadius: 22,
    gap: 4,
    padding: 14,
    position: 'relative',
    width: '100%',
  },
  checkSeleccionado: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 24,
    zIndex: 4,
  },
  badgeGratis: {
    alignSelf: 'flex-start',
    backgroundColor: conAlfa(esc.jade.l50, 0.15),
    borderColor: conAlfa(esc.jade.l50, 0.3),
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeGratisTexto: {
    color: C.verde,
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  auraCirculo: {
    alignItems: 'center',
    borderRadius: 40,
    height: 84,
    justifyContent: 'center',
    marginVertical: 4,
    width: 84,
  },
  imagenArbol: { height: 76, resizeMode: 'contain', width: 76 },
  nombreArbol: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  iconoDetalle: { marginTop: 2 },
  pie: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  botonConfirmar: {
    height: 56,
    width: '100%',
  },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
