import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, View, Image, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { MasterGlass, Texto, MasterIcon, MasterIconBg, Rebote, MasterChip, MasterButton, MasterKicker, entradaEncadenada, MasterAnimation, Skeleton } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { comprarPaquete } from '../../../nucleo/compras/revenueCat';
import type { PaqueteCompra } from '../../../plataforma/compras/contrato';
import { CLAVE_PAQUETES_DESBLOQUEADOS } from '../usePaquetesDesbloqueados';
import { useCatalogoCompras } from '../useCatalogoCompras';
import { comprarSemillasArbol, obtenerCatalogoArboles, obtenerCatalogoGemasIap, obtenerSemillasDisponibles } from '../gemas.servicio';
import type { ArbolPaquete, PaqueteGemasIap, SemillaArbol } from '../gemas.tipos';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../useSaldoGemas';
import { TarjetaReferidosGemas } from '../componentes/TarjetaReferidosGemas';
import { CarruselHeroTienda } from '../componentes/CarruselHeroTienda';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

export const CLAVE_SEMILLAS_DISPONIBLES = ['tienda', 'semillasDisponibles'];

const C = { texto: '#1A1335', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

function EsqueletoCarruselArboles() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 160 }}>
          <MasterGlass style={{ borderRadius: 12, padding: 12, paddingBottom: 16, width: '100%', gap: 8 }}>
            <Skeleton alto={24} ancho={24} radio={6} style={{ position: 'absolute', top: 12, left: 12 }} />
            <Skeleton alto={100} ancho={110} radio={12} style={{ alignSelf: 'center', marginTop: 14 }} />
            <Skeleton alto={15} ancho="75%" radio={4} style={{ alignSelf: 'center', marginTop: 8 }} />
            <Skeleton alto={10} ancho="90%" radio={4} style={{ alignSelf: 'center' }} />
            <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 6 }}>
              {[0, 1, 2].map((d) => (
                <Skeleton key={d} alto={8} ancho={8} radio={4} />
              ))}
            </View>
            <Skeleton alto={36} ancho="100%" radio={8} style={{ marginTop: 10 }} />
          </MasterGlass>
        </View>
      ))}
    </ScrollView>
  );
}

function EsqueletoSemillas() {
  return (
    <View style={{ gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <MasterGlass key={i} style={{ borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton alto={64} ancho={64} radio={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton alto={16} ancho="65%" radio={4} />
              <Skeleton alto={12} ancho="40%" radio={4} />
            </View>
            <Skeleton alto={36} ancho={90} radio={8} />
          </View>
        </MasterGlass>
      ))}
    </View>
  );
}

function ListaPaquetesGemasEsqueleto() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <MasterGlass key={i} style={{ borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Skeleton alto={52} ancho={52} radio={12} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton alto={17} ancho="50%" radio={4} />
              <Skeleton alto={11} ancho="40%" radio={4} />
            </View>
            <Skeleton alto={36} ancho={90} radio={8} />
          </View>
        </MasterGlass>
      ))}
    </>
  );
}

function EsqueletoComprarGemas({ soloLista = false }: { soloLista?: boolean }) {
  if (soloLista) {
    return <View style={{ gap: 16 }}><ListaPaquetesGemasEsqueleto /></View>;
  }
  return (
    <View style={{ gap: 16 }}>
      {/* Tarjeta referidos skeleton */}
      <MasterGlass style={{ borderRadius: 12, padding: 16, gap: 10 }}>
        <Skeleton alto={14} ancho="45%" radio={4} />
        <Skeleton alto={20} ancho="75%" radio={6} />
        <Skeleton alto={12} ancho="90%" radio={4} />
        <Skeleton alto={12} ancho="80%" radio={4} />
        <Skeleton alto={40} ancho="100%" radio={8} style={{ marginTop: 6 }} />
      </MasterGlass>

      {/* Header tienda gemas */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <Skeleton alto={32} ancho={32} radio={8} />
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton alto={16} ancho="50%" radio={4} />
          <Skeleton alto={11} ancho="65%" radio={4} />
        </View>
      </View>

      {/* Banner promo */}
      <MasterGlass style={{ borderRadius: 12, padding: 16, height: 76 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton alto={48} ancho={48} radio={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton alto={12} ancho="35%" radio={4} />
            <Skeleton alto={16} ancho="60%" radio={4} />
          </View>
        </View>
      </MasterGlass>

      {/* Paquetes de gemas */}
      <ListaPaquetesGemasEsqueleto />
    </View>
  );
}

// ── datos estáticos ─────────────────────────────────────────────────────────
// Vivir fuera del componente significa que NO se recrean en cada render.

// Imagen "hero" de un paquete para las tarjetas de la tienda: la etapa 7
// (árbol totalmente crecido) — mismo registro que usa el mapa de senderos,
// una sola fuente de verdad para el arte de cada paquete.
function imagenHeroPaquete(paqueteId: string) {
  return obtenerAssetsPaquete(paqueteId)?.etapas[6] ?? null;
}

// Agrupa el inventario de semillas sueltas (una fila por semilla) por
// paquete, para mostrar "×3 disponibles" en vez de 3 tarjetas idénticas.
type GrupoSemillas = { paqueteId: string; nombre: string; masterPackColor: string; cantidad: number };
function agruparSemillas(semillas: SemillaArbol[], catalogo: ArbolPaquete[]): GrupoSemillas[] {
  const porPaquete = new Map<string, number>();
  for (const semilla of semillas) porPaquete.set(semilla.paqueteId, (porPaquete.get(semilla.paqueteId) ?? 0) + 1);
  return Array.from(porPaquete.entries()).map(([paqueteId, cantidad]) => {
    const info = catalogo.find((p) => p.id === paqueteId);
    return { cantidad, masterPackColor: info?.masterPackColor ?? ESCALA_ESMERALDA.jade.l79, nombre: info?.nombre ?? paqueteId, paqueteId };
  });
}

// Colores de acento por posición — puramente visual, no vienen del catálogo
// (que solo define cantidad de gemas y el id de producto de RevenueCat).
const COLORES_PAQUETE_GEMAS = [ESCALA_ESMERALDA.jade.l79, '#facc15', '#38bdf8', '#a855f7'];

const FILTROS = ['Todos', 'Mis semillas', 'Naturaleza', 'Elementales', 'Comprar'] as const;
type Filtro = typeof FILTROS[number];

const ICONO_FILTRO: Record<Filtro, string> = {
  'Todos': 'hoja2', 'Mis semillas': 'maceta', 'Naturaleza': 'arbol',
  'Elementales': 'energia', 'Comprar': 'rayo',
};

// ── Context del filtro ───────────────────────────────────────────────────────
type FiltroContextTipo = {
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
};
const FiltroCtx = createContext<FiltroContextTipo>({ filtro: 'Todos', setFiltro: () => {} });
const useFiltro = () => useContext(FiltroCtx);

// ── Barra de filtros ─────────────────────────────────────────────────────────
function BarraFiltros({ activo, onCambio }: { activo: Filtro; onCambio: (f: Filtro) => void }) {
  const { t } = useTranslation();
  const etiquetas: Record<Filtro, string> = {
    Todos: t('tienda.screen.filters.all'),
    'Mis semillas': t('tienda.screen.filters.mySeeds'),
    Naturaleza: t('tienda.screen.filters.nature'),
    Elementales: t('tienda.screen.filters.elementals'),
    Comprar: t('tienda.screen.filters.buy'),
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled={true}
      contentContainerStyle={sf.barra}
    >
      {FILTROS.map((f) => (
        <MasterChip
          key={f}
          activo={activo === f}
          icono={<MasterIcon name={ICONO_FILTRO[f]} alTema size={18} />}
          onPress={() => onCambio(f)}
          texto={etiquetas[f]}
        />
      ))}
    </ScrollView>
  );
}

// ── Secciones de contenido (memoizadas) ─────────────────────────────────────
// memo() garantiza que este árbol NO re-renderiza cuando TiendaArbolesPantalla
// re-renderiza por cualquier otro motivo (queries, saldo, etc.).
// El filtro se lee del context, por lo que solo re-renderiza cuando ESO cambia.
const SeccionesContenido = memo(function SeccionesContenido({
  catalogo,
  semillas,
  comprando,
  cargandoCatalogo,
  cargandoSemillas,
  cambiandoTab,
  onComprar,
  onPlantar,
  catalogoGemas,
  paquetesRevenueCat,
  comprandoGemasId,
  cargandoCatalogoGemas,
  onComprarGemas,
}: {
  catalogo: ArbolPaquete[];
  semillas: SemillaArbol[];
  comprando: string | null;
  cargandoCatalogo?: boolean;
  cargandoSemillas?: boolean;
  cambiandoTab?: boolean;
  onComprar: (paqueteId: string) => void;
  onPlantar: () => void;
  catalogoGemas: PaqueteGemasIap[];
  paquetesRevenueCat: PaqueteCompra[];
  comprandoGemasId: string | null;
  cargandoCatalogoGemas?: boolean;
  onComprarGemas: (paquete: PaqueteGemasIap) => void;
}) {
  const esc = useEscala();
  const { t } = useTranslation();
  const { filtro, setFiltro } = useFiltro();
  // "Naturaleza"/"Elementales" quedan como categorías visuales a futuro — hoy
  // el catálogo no tiene un campo de tema propio, así que por ahora muestran
  // el mismo catálogo completo que "Todos" en vez de un recorte inventado.
  const mostrarArboles = filtro === 'Todos' || filtro === 'Naturaleza' || filtro === 'Elementales';

  const arbolesLeg = catalogo.filter((p) => p.rareza === 'legendario');
  const arbolesUni = catalogo.filter((p) => p.rareza === 'unico');
  const gruposSemillas = agruparSemillas(semillas, catalogo);

  return (
    <Animated.View key={filtro} entering={FadeIn.duration(360)} exiting={FadeOut.duration(200)}>
      {/* Mis Semillas */}
      {filtro === 'Mis semillas' && (
        <View style={{ gap: 16, marginBottom: 32, paddingHorizontal: 20 }}>
          <Animated.View entering={entradaEncadenada(0)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MasterIconBg size={32}><MasterIcon name="maceta" alTema size={18} /></MasterIconBg>
            <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19 }}>{t('tienda.screen.seeds.title')}</Texto>
          </Animated.View>
          {cargandoSemillas || cambiandoTab ? (
            <EsqueletoSemillas />
          ) : gruposSemillas.length === 0 ? (
            <MasterGlass style={{ borderRadius: 12, padding: 20, alignItems: 'center', gap: 6 }}>
              <MasterIcon name="maceta" alTema size={28} />
              <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19, fontSize: 14 }}>{t('tienda.screen.seeds.emptyTitle')}</Texto>
              <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12, textAlign: 'center' }}>{t('tienda.screen.seeds.emptyDescription')}</Texto>
            </MasterGlass>
          ) : (
            <MasterAnimation>
              {gruposSemillas.map((grupo) => {
                const imagen = imagenHeroPaquete(grupo.paqueteId);
                return (
                  <Rebote key={grupo.paqueteId}>
                    <MasterGlass colorBase={grupo.masterPackColor} style={{ borderRadius: 12, padding: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {imagen && <Image source={imagen} style={{ width: 64, height: 64, resizeMode: 'contain' }} />}
                        <View style={{ flex: 1 }}>
                          <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19, fontSize: 15 }}>{grupo.nombre}</Texto>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <MasterIcon name="maceta" color={colorMasterMasCercano(grupo.masterPackColor)} size={16} />
                            <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 13 }}>{t('tienda.screen.seeds.available', { count: grupo.cantidad })}</Texto>
                          </View>
                        </View>
                        <View style={{ width: 100 }}>
                          <MasterButton color={esc.hoja.l61a} onPress={onPlantar}>{t('tienda.screen.seeds.plant')}</MasterButton>
                        </View>
                      </View>
                    </MasterGlass>
                  </Rebote>
                );
              })}
            </MasterAnimation>
          )}
        </View>
      )}

      {/* Comprar Gemas y Referidos */}
      {filtro === 'Comprar' && (
        <View style={{ gap: 16, marginBottom: 32, paddingHorizontal: 20 }}>
          {cambiandoTab ? (
            <EsqueletoComprarGemas />
          ) : (
            <>
              {/* Tarjeta de Referidos para ganar gemas gratis */}
              <Animated.View entering={entradaEncadenada(0)}>
                <TarjetaReferidosGemas />
              </Animated.View>

              {/* Separador para compra con dinero real */}
              <Animated.View entering={entradaEncadenada(1)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <MasterIconBg size={32}><MasterIcon name="rayo" color={3} size={18} /></MasterIconBg>
                <View>
                  <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19 }}>{t('tienda.screen.gems.title')}</Texto>
                  <Texto style={{ fontSize: 12, fontFamily: 'Montserrat-Medium', color: esc.musgo.l54 }}>{t('tienda.screen.gems.subtitle')}</Texto>
                </View>
              </Animated.View>

              {/* Banner promo */}
              <Animated.View entering={entradaEncadenada(2)}>
                <MasterGlass colorBase="#a855f7" style={{ borderRadius: 12, padding: 16, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
                    <View style={{ flex: 1 }}>
                      <MasterKicker icono={<MasterIcon name="hoja" alTema size={12} />} texto={t('tienda.screen.gems.offer')} />
                      <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19, fontSize: 16, marginTop: 6 }}>{t('tienda.screen.gems.bonus')}</Texto>
                      <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 2 }}>{t('tienda.screen.gems.limitedTime')}</Texto>
                    </View>
                  </View>
                </MasterGlass>
              </Animated.View>
              {cargandoCatalogoGemas ? (
                <EsqueletoComprarGemas soloLista />
              ) : catalogoGemas.length === 0 ? (
                <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('tienda.screen.gems.empty')}</Texto>
              ) : (
                <MasterAnimation>
                  {catalogoGemas.map((paq, idx) => {
                    const disponible = paquetesRevenueCat.find((p) => p.productId === paq.productIdRevenueCat);
                    const precio = disponible?.precioTexto ?? (paq.precioReferenciaUsd !== null ? `~$${paq.precioReferenciaUsd.toFixed(2)}` : '—');
                    const comprandoEsta = comprandoGemasId === paq.id;
                    return (
                      <Rebote key={paq.id}>
                        <MasterGlass colorBase={COLORES_PAQUETE_GEMAS[idx % COLORES_PAQUETE_GEMAS.length]} style={{ borderRadius: 12, padding: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(109,40,217,0.15)', borderWidth: 1.5, borderColor: 'rgba(109,40,217,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                              <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19, fontSize: 17 }}>{paq.cantidadGemas.toLocaleString()} gemas</Texto>
                              {!disponible && <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('tienda.screen.gems.unavailableReference')}</Texto>}
                            </View>
                            <View style={{ width: 90 }}>
                              <MasterButton color="#6A29C2" disabled={comprandoEsta || !disponible} onPress={() => onComprarGemas(paq)}>
                                {comprandoEsta ? t('tienda.screen.gems.buying') : precio}
                              </MasterButton>
                            </View>
                          </View>
                        </MasterGlass>
                      </Rebote>
                    );
                  })}
                </MasterAnimation>
              )}
            </>
          )}
        </View>
      )}

      {/* Árboles (Todos, Naturaleza, Elementales) */}
      {mostrarArboles && (
        <>
          {/* Árboles Legendarios */}
          <View style={{ gap: 16, marginBottom: 32 }}>
            <Animated.View entering={entradaEncadenada(0)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MasterIconBg size={32}><MasterIcon name="trofeo" alTema size={18} /></MasterIconBg>
                <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19 }}>
                  {t('tienda.screen.trees.legendary', { filter: filtro === 'Todos' ? '' : t('tienda.screen.trees.filter', { filter: filtro }) })}
                </Texto>
              </View>
              <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('tienda.screen.trees.popular')}</Texto>
            </Animated.View>
            {cargandoCatalogo || cambiandoTab ? (
              <EsqueletoCarruselArboles />
            ) : arbolesLeg.length === 0 ? (
              <Texto style={{ paddingHorizontal: 20, color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('tienda.screen.trees.legendaryEmpty')}</Texto>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}>
                {arbolesLeg.map((arbol, idx) => {
                  const colorMaster = colorMasterMasCercano(arbol.masterPackColor);
                  const imagen = imagenHeroPaquete(arbol.id);
                  return (
                    <Animated.View entering={entradaEncadenada(1 + idx)} key={arbol.id} style={{ width: 160 }}>
                      <Rebote estilo={{ width: 160 }}>
                        <MasterGlass colorBase={arbol.masterPackColor} style={{ borderRadius: 12, padding: 12, paddingBottom: 16, width: '100%' }}>
                          <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                            <MasterIcon name="trofeo" color={colorMaster} size={28} />
                          </View>
                          {imagen && <Image source={imagen} style={{ width: '100%', height: 120, resizeMode: 'contain', marginTop: 10 }} />}
                          <Texto style={{ textAlign: 'center', fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19, marginTop: 12 }}>{arbol.nombre}</Texto>
                          <Texto style={{ textAlign: 'center', fontFamily: 'Montserrat-Medium', fontSize: 12, color: esc.musgo.l54, marginTop: 2 }} numberOfLines={1}>{t('tienda.screen.trees.seedsPerPurchase', { count: arbol.cantidadPorCompra, suffix: arbol.cantidadPorCompra === 1 ? '' : t('tienda.screen.trees.pluralSuffix') })}</Texto>
                          <View style={{ marginTop: 16 }}>
                            <MasterButton
                              color="#6A29C2"
                              disabled={comprando === arbol.id}
                              onPress={() => onComprar(arbol.id)}
                              iconoIzquierda={({ size }) => <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: size, height: size }} />}
                              iconoSize={18}
                            >
                              {comprando === arbol.id ? t('tienda.screen.trees.buying') : arbol.precioGemas.toString()}
                            </MasterButton>
                          </View>
                        </MasterGlass>
                      </Rebote>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Árboles Únicos */}
          <View style={{ gap: 16, marginBottom: 16 }}>
            <Animated.View entering={entradaEncadenada(4)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MasterIconBg size={32}><MasterIcon name="hoja3" alTema size={18} /></MasterIconBg>
                <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19 }}>
                  {t('tienda.screen.trees.unique', { filter: filtro === 'Todos' ? '' : t('tienda.screen.trees.filter', { filter: filtro }) })}
                </Texto>
              </View>
              <Texto style={{ color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('tienda.screen.trees.viewAll')}</Texto>
            </Animated.View>
            {cargandoCatalogo || cambiandoTab ? (
              <EsqueletoCarruselArboles />
            ) : arbolesUni.length === 0 ? (
              <Texto style={{ paddingHorizontal: 20, color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('tienda.screen.trees.uniqueEmpty')}</Texto>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}>
                {arbolesUni.map((arbol, idx) => {
                  const colorMaster = colorMasterMasCercano(arbol.masterPackColor);
                  const imagen = imagenHeroPaquete(arbol.id);
                  return (
                    <Animated.View entering={entradaEncadenada(5 + idx)} key={arbol.id} style={{ width: 160 }}>
                      <Rebote estilo={{ width: 160 }}>
                        <MasterGlass colorBase={arbol.masterPackColor} style={{ borderRadius: 12, padding: 12, paddingBottom: 16, width: '100%' }}>
                          <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                            <MasterIcon name="hoja3" color={colorMaster} size={28} />
                          </View>
                          {imagen && <Image source={imagen} style={{ width: '100%', height: 120, resizeMode: 'contain', marginTop: 10 }} />}
                          <Texto style={{ textAlign: 'center', fontFamily: 'MontserratAlternates-Bold', color: esc.hoja.l19, marginTop: 12 }}>{arbol.nombre}</Texto>
                          <Texto style={{ textAlign: 'center', fontFamily: 'Montserrat-Medium', fontSize: 12, color: esc.musgo.l54, marginTop: 2 }} numberOfLines={1}>{t('tienda.screen.trees.seedsPerPurchase', { count: arbol.cantidadPorCompra, suffix: arbol.cantidadPorCompra === 1 ? '' : t('tienda.screen.trees.pluralSuffix') })}</Texto>
                          <View style={{ marginTop: 16 }}>
                            <MasterButton
                              color="#6A29C2"
                              disabled={comprando === arbol.id}
                              onPress={() => onComprar(arbol.id)}
                              iconoIzquierda={({ size }) => <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: size, height: size }} />}
                              iconoSize={18}
                            >
                              {comprando === arbol.id ? t('tienda.screen.trees.buying') : arbol.precioGemas.toString()}
                            </MasterButton>
                          </View>
                        </MasterGlass>
                      </Rebote>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Banner de Invitación de Amigos */}
          <Animated.View entering={entradaEncadenada(8)} style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 24 }}>
            <MasterGlass colorBase="#FEF08A" style={{ borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <MasterKicker icono={<MasterIcon name="trofeo" color={3} size={11} />} texto={t('tienda.hero.referralKicker')} />
                  <Texto style={{ fontFamily: 'MontserratAlternates-Bold', fontSize: 16, color: esc.hoja.l19, marginTop: 4 }}>{t('tienda.seedPurchase.referralQuestion')}</Texto>
                  <Texto style={{ fontFamily: 'Montserrat-Medium', fontSize: 12, color: esc.musgo.l54, lineHeight: 16 }}>{t('tienda.seedPurchase.referralDescription')}</Texto>
                </View>
                <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: 42, height: 42, resizeMode: 'contain' }} />
              </View>
              <View style={{ marginTop: 12 }}>
                <MasterButton color={esc.hoja.l61a} onPress={() => setFiltro('Comprar')} iconoSize={16}>
                  {t('tienda.seedPurchase.viewReferralCode')}
                </MasterButton>
              </View>
            </MasterGlass>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
});

// ── Pantalla principal ───────────────────────────────────────────────────────
export function TiendaArbolesPantalla() {
  const esc = useEscala();
  const { t } = useTranslation();
  const s = useEstilosS();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: saldoGemas, isLoading: cargandoGemas } = useSaldoGemas();
  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const consultaSemillas = useQuery({ queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });
  // Misma queryKey que TiendaPantalla.tsx (/tienda/gemas) — comparten caché,
  // el catálogo de paquetes IAP es idéntico sin importar desde dónde se pida.
  const consultaCatalogoGemas = useQuery({ queryKey: ['tienda', 'catalogoGemasIap', Platform.OS], queryFn: () => obtenerCatalogoGemasIap(Platform.OS === 'ios' ? 'ios' : 'android') });
  const { paquetes: paquetesRevenueCat } = useCatalogoCompras();
  const [comprandoGemasId, setComprandoGemasId] = useState<string | null>(null);

  const mutacionComprar = useMutation({
    mutationFn: comprarSemillasArbol,
    onError: (error: Error) => {
      Alert.alert(t('tienda.seedPurchase.errorTitle'), error.message || t('tienda.seedPurchase.errorDescription'));
    },
    onSuccess: (resultado) => {
      hapticSeguro('confirmacion');
      queryClient.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      queryClient.invalidateQueries({ queryKey: CLAVE_SEMILLAS_DISPONIBLES });
      queryClient.invalidateQueries({ queryKey: CLAVE_PAQUETES_DESBLOQUEADOS });
      Alert.alert(t('tienda.seedPurchase.successTitle'), t('tienda.seedPurchase.successDescription', { count: resultado.semillasCompradas, suffix: resultado.semillasCompradas === 1 ? '' : t('tienda.seedPurchase.pluralSuffix') }));
    },
  });

  async function comprarGemas(paquete: PaqueteGemasIap) {
    const paqueteRevenueCat = paquetesRevenueCat.find((p) => p.productId === paquete.productIdRevenueCat);
    if (!paqueteRevenueCat) {
      Alert.alert(t('tienda.screen.gems.unavailableTitle'), t('tienda.screen.gems.unavailableDescription'));
      return;
    }
    hapticSeguro('seleccion');
    setComprandoGemasId(paquete.id);
    try {
      const resultado = await comprarPaquete(paqueteRevenueCat.id);
      if (resultado.estado === 'completada') {
        hapticSeguro('confirmacion');
        queryClient.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
        setTimeout(() => queryClient.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS }), 4000);
        Alert.alert(t('tienda.screen.gems.receivedTitle'), t('tienda.screen.gems.receivedDescription'));
      } else if (resultado.estado === 'pendiente') {
        Alert.alert(t('tienda.screen.gems.receivedTitle'), t('tienda.gemas.avisoPendiente'));
      } else if (resultado.estado === 'error') {
        Alert.alert(t('tienda.screen.gems.purchaseErrorTitle'), resultado.mensajeSeguro || t('tienda.screen.gems.purchaseErrorDescription'));
      }
      // 'cancelada' no muestra alerta — el usuario decidió no continuar.
    } catch (err) {
      const msj = err instanceof Error ? err.message : t('tienda.screen.gems.purchaseErrorDescription');
      Alert.alert(t('tienda.screen.gems.purchaseErrorTitle'), msj);
    } finally {
      setComprandoGemasId(null);
    }
  }

  function alPlantar() {
    hapticSeguro('seleccion');
    // '/(principal)/hoy' dejó de ser HabitosPantalla (ahora es el hub con las
    // categorías Hábitos/Tareas/...) — HabitosPantalla vive en '/habitos',
    // fuera del grupo con tabs. `abrirCreacion` hace que además abra el
    // asistente de crear hábito al llegar, en vez de solo mostrar la lista.
    router.push({ pathname: '/habitos', params: { abrirCreacion: '1' } });
  }

  const [filtroActivo, setFiltroActivo] = useState<Filtro>('Todos');
  const [cambiandoTab, setCambiandoTab] = useState(false);
  const temporizadorTab = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCambioFiltro = useCallback((f: Filtro) => {
    if (f === filtroActivo) return;
    if (temporizadorTab.current) clearTimeout(temporizadorTab.current);
    setCambiandoTab(true);
    setFiltroActivo(f);
    temporizadorTab.current = setTimeout(() => {
      setCambiandoTab(false);
    }, 320);
  }, [filtroActivo]);

  useEffect(() => {
    return () => {
      if (temporizadorTab.current) clearTimeout(temporizadorTab.current);
    };
  }, []);

  const contextoFiltro = { filtro: filtroActivo, setFiltro: onCambioFiltro };

  return (
    <FiltroCtx.Provider value={contextoFiltro}>
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
            <AuroraBoreal tema="verde" />

            {/* Encabezado */}
            <View style={s.headerInicio}>
              <View style={s.headerTitulo}>
                <Animated.View entering={entradaEncadenada(0)} style={s.headerIzq}>
                  <View style={s.nombreFila}>
                    <Texto style={s.headerNombre}>{t('tienda.screen.title')}</Texto>
                    <MasterIcon name="planta" size={28} />
                  </View>
                  <Texto style={s.headerSaludo}>{t('tienda.screen.subtitle')}</Texto>
                </Animated.View>
              </View>
              <View style={s.headerDer}>
                <Animated.View entering={entradaEncadenada(1)}>
                  <View style={s.statPill}>
                    <View style={s.statPillFila}>
                      <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} />
                      {cargandoGemas ? (
                        <Skeleton alto={14} ancho={32} radio={4} />
                      ) : (
                        <Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto>
                      )}
                    </View>
                  </View>
                </Animated.View>
                <Animated.View entering={entradaEncadenada(2)}>
                  <MasterGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></MasterGlass>
                </Animated.View>
              </View>
            </View>

            {/* Carrusel Hero: Destacado + Referidos */}
            <Animated.View entering={entradaEncadenada(3)}>
              <CarruselHeroTienda onIrAReferidos={() => setFiltroActivo('Comprar')} />
            </Animated.View>

            {/* Filtros */}
            <Animated.View entering={entradaEncadenada(4)}>
              <BarraFiltros activo={filtroActivo} onCambio={onCambioFiltro} />
            </Animated.View>

            {/* Contenido — memoizado, aislado del re-render del padre */}
            <SeccionesContenido
              catalogo={consultaCatalogo.data ?? []}
              semillas={consultaSemillas.data ?? []}
              comprando={mutacionComprar.isPending ? (mutacionComprar.variables ?? null) : null}
              cargandoCatalogo={consultaCatalogo.isLoading}
              cargandoSemillas={consultaSemillas.isLoading}
              cambiandoTab={cambiandoTab}
              onComprar={(paqueteId) => mutacionComprar.mutate(paqueteId)}
              onPlantar={alPlantar}
              catalogoGemas={consultaCatalogoGemas.data ?? []}
              paquetesRevenueCat={paquetesRevenueCat}
              comprandoGemasId={comprandoGemasId}
              cargandoCatalogoGemas={consultaCatalogoGemas.isLoading}
              onComprarGemas={comprarGemas}
            />

          </View>
        </ScrollView>
      </LinearGradient>
    </FiltroCtx.Provider>
  );
}

const sf = StyleSheet.create({
  barra: { gap: 10, paddingHorizontal: 20, marginBottom: 24 },
});

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz:             { flex: 1 },
  contenido:        { paddingBottom: 0 },
  superiorInicio:   { gap: 0 },
  headerInicio:     { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 20 },
  headerTitulo:     { alignItems: 'center', flexDirection: 'row', width: '60%' },
  headerIzq:        { flex: 1 },
  nombreFila:       { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headerNombre:     { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 32, lineHeight: 36 },
  saludoIcono:      { height: 28, resizeMode: 'contain', width: 28 },
  headerSaludo:     { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 17, marginTop: 4 },
  headerDer:        { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  statPill:         { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statPillFila:     { alignItems: 'center', flexDirection: 'row', gap: 4 },
  gemaIcono:        { height: 22, resizeMode: 'contain', width: 22 },
  statTexto:        { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  notificacion:     { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 },
  notificacionIcono:{ height: 30, resizeMode: 'contain', width: 30 },
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
