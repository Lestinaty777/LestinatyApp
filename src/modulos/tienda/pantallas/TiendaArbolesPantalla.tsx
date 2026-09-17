import { useQuery } from '@tanstack/react-query';
import { createContext, memo, useCallback, useContext, useRef, useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterGlass, Texto, MasterIcon, MasterIconBg, Rebote, MasterChip, MasterButton, MasterKicker } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { obtenerCatalogoArboles, obtenerSemillasDisponibles } from '../gemas.servicio';
import { useSaldoGemas } from '../useSaldoGemas';

export const CLAVE_SEMILLAS_DISPONIBLES = ['tienda', 'semillasDisponibles'];

const C = { texto: '#1A1335', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

// ── datos estáticos ─────────────────────────────────────────────────────────
// Vivir fuera del componente significa que NO se recrean en cada render.

const ARBOLES_LEGENDARIOS = [
  { nombre: 'Esmeralda', subtitulo: 'La armonía del bosque.',  gemas: 600, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'),        colorNum: 2, colorHex: '#4ade80' },
  { nombre: 'Aurelia',   subtitulo: 'Luz de la naturaleza.',   gemas: 550, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png'), colorNum: 3, colorHex: '#facc15' },
  { nombre: 'Turquesa',  subtitulo: 'Armonía en movimiento.',  gemas: 525, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png'),  colorNum: 1, colorHex: '#38bdf8' },
  { nombre: 'Ígnea',     subtitulo: 'Fuerza que renace.',      gemas: 666, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png'),          colorNum: 5, colorHex: '#f87171' },
] as const;

const ARBOLES_UNICOS = [
  { nombre: 'Ámbar',  subtitulo: 'Memorias que inspiran.', gemas: 650, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-01.png'), colorNum: 4, colorHex: '#fb923c' },
  { nombre: 'Jade',   subtitulo: 'Equilibrio interior.',   gemas: 580, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-01.png'),  colorNum: 2, colorHex: '#34d399' },
  { nombre: 'Niebla', subtitulo: 'Lo oculto florece.',     gemas: 620, img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png'),       colorNum: 6, colorHex: '#f472b6' },
] as const;

const SEMILLAS = [
  { nombre: 'Semilla de Selva',  cantidad: 3, colorNum: 2, colorHex: '#4ade80', img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png') },
  { nombre: 'Semilla Dorada',    cantidad: 1, colorNum: 3, colorHex: '#facc15', img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png') },
  { nombre: 'Semilla de Cerezo', cantidad: 2, colorNum: 6, colorHex: '#f472b6', img: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png') },
] as const;

const PAQUETES_GEMAS = [
  { gemas: 100,  bonus: 0,   precio: '$0.99',  colorNum: 2, colorHex: '#4ade80', etiqueta: 'Inicio'       },
  { gemas: 500,  bonus: 50,  precio: '$3.99',  colorNum: 3, colorHex: '#facc15', etiqueta: 'Popular'      },
  { gemas: 1200, bonus: 200, precio: '$8.99',  colorNum: 1, colorHex: '#38bdf8', etiqueta: 'Gran valor'   },
  { gemas: 3000, bonus: 800, precio: '$19.99', colorNum: 7, colorHex: '#a855f7', etiqueta: 'Mejor oferta' },
] as const;

const FILTROS = ['Todos', 'Mis semillas', 'Naturaleza', 'Elementales', 'Comprar'] as const;
type Filtro = typeof FILTROS[number];

const ICONO_FILTRO: Record<Filtro, string> = {
  'Todos': 'hoja2', 'Mis semillas': 'maceta', 'Naturaleza': 'arbol',
  'Elementales': 'energia', 'Comprar': 'rayo',
};

// ── Context del filtro ───────────────────────────────────────────────────────
// Al leer el filtro por context en lugar de por prop, las secciones
// memoizadas con React.memo no re-renderizan cuando el PADRE cambia de estado.
// Solo re-renderizan cuando el valor del context cambia — y solo ellas.
const FiltroCtx = createContext<Filtro>('Todos');
const useFiltro = () => useContext(FiltroCtx);

// ── Barra de filtros ─────────────────────────────────────────────────────────
function BarraFiltros({ activo, onCambio }: { activo: Filtro; onCambio: (f: Filtro) => void }) {
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
          icono={<MasterIcon name={ICONO_FILTRO[f]} color={2} size={18} />}
          onPress={() => onCambio(f)}
          texto={f}
        />
      ))}
    </ScrollView>
  );
}

// ── Secciones de contenido (memoizadas) ─────────────────────────────────────
// memo() garantiza que este árbol NO re-renderiza cuando TiendaArbolesPantalla
// re-renderiza por cualquier otro motivo (queries, saldo, etc.).
// El filtro se lee del context, por lo que solo re-renderiza cuando ESO cambia.
const SeccionesContenido = memo(function SeccionesContenido() {
  const filtro = useFiltro();
  const mostrarArboles = filtro === 'Todos' || filtro === 'Naturaleza' || filtro === 'Elementales';

  // Lazy mount: cada sección pesada se monta solo cuando el usuario la visita
  // por primera vez. Después queda en el árbol (display:none) sin desmontarse.
  const visitado = useRef<Record<string, boolean>>({ Todos: true });
  if (filtro !== 'Todos') visitado.current[filtro] = true;

  const montarSemillas = !!visitado.current['Mis semillas'];
  const montarComprar  = !!visitado.current['Comprar'];
  return (
    <>
      {/* Mis Semillas */}
      <View style={{ display: filtro === 'Mis semillas' ? 'flex' : 'none', gap: 16, marginBottom: 32, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <MasterIconBg size={32}><MasterIcon name="maceta" color={2} size={18} /></MasterIconBg>
          <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: '#1A3320' }}>Mis Semillas</Texto>
        </View>
        {SEMILLAS.map((semilla, idx) => (
          <Rebote key={idx}>
            <MasterGlass colorBase={semilla.colorHex} style={{ borderRadius: 12, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={semilla.img} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
                <View style={{ flex: 1 }}>
                  <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: '#1A3320', fontSize: 15 }}>{semilla.nombre}</Texto>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <MasterIcon name="maceta" color={semilla.colorNum as any} size={16} />
                    <Texto style={{ color: '#5B8C65', fontFamily: 'Montserrat-Medium', fontSize: 13 }}>×{semilla.cantidad} disponibles</Texto>
                  </View>
                </View>
                <View style={{ width: 100 }}>
                  <MasterButton color="#21A844" onPress={() => {}}>Plantar</MasterButton>
                </View>
              </View>
            </MasterGlass>
          </Rebote>
        ))}
      </View>

      {/* Comprar Gemas */}
      <View style={{ display: filtro === 'Comprar' ? 'flex' : 'none', gap: 16, marginBottom: 32, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <MasterIconBg size={32}><MasterIcon name="rayo" color={3} size={18} /></MasterIconBg>
          <View>
            <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: '#1A3320' }}>Comprar Gemas</Texto>
            <Texto style={{ fontSize: 11, fontFamily: 'Montserrat-Medium', color: '#5B8C65' }}>Recarga con dinero real</Texto>
          </View>
        </View>
        <MasterGlass colorBase="#a855f7" style={{ borderRadius: 12, padding: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
            <View style={{ flex: 1 }}>
              <MasterKicker icono={<MasterIcon name="hoja" color={2} size={12} />} texto="Oferta especial" />
              <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: '#1A3320', fontSize: 16, marginTop: 6 }}>¡Bono del 50%!</Texto>
              <Texto style={{ color: '#5B8C65', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 2 }}>Solo por tiempo limitado</Texto>
            </View>
          </View>
        </MasterGlass>
        {PAQUETES_GEMAS.map((paq, idx) => (
          <Rebote key={idx}>
            <MasterGlass colorBase={paq.colorHex} style={{ borderRadius: 12, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(109,40,217,0.15)', borderWidth: 1.5, borderColor: 'rgba(109,40,217,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Texto style={{ fontFamily: 'MontserratAlternates-Bold', color: '#1A3320', fontSize: 17 }}>{paq.gemas.toLocaleString()}</Texto>
                    {paq.bonus > 0 && <MasterKicker icono={<MasterIcon name="rayo" color={paq.colorNum as any} size={11} />} texto={`+${paq.bonus}`} />}
                  </View>
                  <Texto style={{ color: '#5B8C65', fontFamily: 'Montserrat-Medium', fontSize: 11 }}>{paq.etiqueta}</Texto>
                </View>
                <View style={{ width: 90 }}>
                  <MasterButton color="#6A29C2" onPress={() => {}}>{paq.precio}</MasterButton>
                </View>
              </View>
            </MasterGlass>
          </Rebote>
        ))}
      </View>

      {/* Árboles Legendarios */}
      <View style={{ display: mostrarArboles ? 'flex' : 'none', gap: 16, marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MasterIconBg size={32}><MasterIcon name="trofeo" color={2} size={18} /></MasterIconBg>
            <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: '#1A3320' }}>Árboles Legendarios</Texto>
          </View>
          <Texto style={{ color: '#5B8C65', fontFamily: 'Montserrat-Medium', fontSize: 12 }}>Más populares ⌄</Texto>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}>
          {ARBOLES_LEGENDARIOS.map((arbol, idx) => (
            <Rebote key={idx} estilo={{ width: 160 }}>
              <MasterGlass colorBase={arbol.colorHex} style={{ borderRadius: 12, padding: 12, paddingBottom: 16, width: '100%' }}>
                <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                  <MasterIcon name="trofeo" color={arbol.colorNum as any} size={28} />
                </View>
                <Image source={arbol.img} style={{ width: '100%', height: 120, resizeMode: 'contain', marginTop: 10 }} />
                <Texto style={{ textAlign: 'center', fontFamily: 'MontserratAlternates-Bold', color: '#1A3320', marginTop: 12 }}>{arbol.nombre}</Texto>
                <Texto style={{ textAlign: 'center', fontFamily: 'Montserrat-Medium', fontSize: 10, color: '#5B8C65', marginTop: 2 }} numberOfLines={1}>{arbol.subtitulo}</Texto>
                <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                  {[0,1,2].map(i => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#21A844' }} />)}
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(33,168,68,0.3)' }} />
                </View>
                <View style={{ marginTop: 16 }}>
                  <MasterButton color="#6A29C2" iconoIzquierda={({ size }) => <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: size, height: size }} />} iconoSize={18}>
                    {arbol.gemas.toString()}
                  </MasterButton>
                </View>
              </MasterGlass>
            </Rebote>
          ))}
        </ScrollView>
      </View>

      {/* Árboles Únicos */}
      <View style={{ display: mostrarArboles ? 'flex' : 'none', gap: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MasterIconBg size={32}><MasterIcon name="hoja3" color={2} size={18} /></MasterIconBg>
            <Texto style={{ fontSize: 18, fontFamily: 'MontserratAlternates-Bold', color: '#1A3320' }}>Árboles Únicos</Texto>
          </View>
          <Texto style={{ color: '#5B8C65', fontFamily: 'Montserrat-Medium', fontSize: 12 }}>Ver todos ⌄</Texto>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}>
          {ARBOLES_UNICOS.map((arbol, idx) => (
            <Rebote key={idx} estilo={{ width: 160 }}>
              <MasterGlass colorBase={arbol.colorHex} style={{ borderRadius: 12, padding: 12, paddingBottom: 16, width: '100%' }}>
                <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                  <MasterIcon name="hoja3" color={arbol.colorNum as any} size={28} />
                </View>
                <Image source={arbol.img} style={{ width: '100%', height: 120, resizeMode: 'contain', marginTop: 10 }} />
                <Texto style={{ textAlign: 'center', fontFamily: 'MontserratAlternates-Bold', color: '#1A3320', marginTop: 12 }}>{arbol.nombre}</Texto>
                <Texto style={{ textAlign: 'center', fontFamily: 'Montserrat-Medium', fontSize: 10, color: '#5B8C65', marginTop: 2 }} numberOfLines={1}>{arbol.subtitulo}</Texto>
                <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                  {[0,1].map(i => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#21A844' }} />)}
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(33,168,68,0.3)' }} />
                </View>
                <View style={{ marginTop: 16 }}>
                  <MasterButton color="#6A29C2" iconoIzquierda={({ size }) => <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ width: size, height: size }} />} iconoSize={18}>
                    {arbol.gemas.toString()}
                  </MasterButton>
                </View>
              </MasterGlass>
            </Rebote>
          ))}
        </ScrollView>
      </View>
    </>
  );
});

// ── Pantalla principal ───────────────────────────────────────────────────────
export function TiendaArbolesPantalla() {
  const insets = useSafeAreaInsets();
  const { data: saldoGemas } = useSaldoGemas();
  useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  useQuery({ queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });

  const [filtroActivo, setFiltroActivo] = useState<Filtro>('Todos');
  const onCambioFiltro = useCallback((f: Filtro) => setFiltroActivo(f), []);

  return (
    // FiltroCtx.Provider provee el valor del filtro al árbol.
    // Cuando filtroActivo cambia:
    //   1. TiendaArbolesPantalla re-renderiza (inevitable — tiene el estado)
    //   2. BarraFiltros re-renderiza (necesario para marcar el chip activo)
    //   3. SeccionesContenido NO re-renderiza (memo lo bloquea)
    //   4. Solo cuando el valor del Context cambia, SeccionesContenido re-renderiza
    //      para actualizar su display:none/flex — pero ya sin montar/desmontar nada.
    <FiltroCtx.Provider value={filtroActivo}>
      <LinearGradient colors={['#F7FDF7', '#E8F7E9', '#CDEFCF']} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
            <AuroraBoreal tema="verde" />

            {/* Encabezado */}
            <View style={s.headerInicio}>
              <View style={s.headerTitulo}>
                <View style={s.headerIzq}>
                  <View style={s.nombreFila}>
                    <Texto style={s.headerNombre}>Tienda</Texto>
                    <Image source={require('../../../../assets/icons/ui/planta.png')} style={s.saludoIcono} />
                  </View>
                  <Texto style={s.headerSaludo}>Árboles únicos para un mejor tú</Texto>
                </View>
              </View>
              <View style={s.headerDer}>
                <View style={s.statPill}><View style={s.statPillFila}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></View></View>
                <MasterGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></MasterGlass>
              </View>
            </View>

            {/* Destacado */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <MasterGlass style={{ borderRadius: 12, padding: 16, overflow: 'hidden', minHeight: 200 }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, zIndex: 2 }}>
                    <MasterKicker icono={<MasterIcon name="hoja" color={1} size={14} />} texto="Destacado" />
                    <Texto style={{ fontSize: 24, fontFamily: 'MontserratAlternates-Bold', color: '#1A3320', marginTop: 12 }}>Esmeralda</Texto>
                    <Texto style={{ color: '#5B8C65', fontSize: 12, marginTop: 4 }}>La armonía del bosque.</Texto>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                      {[1,2,3].map(i => <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#21A844' }} />)}
                      {[4,5].map(i => <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(33,168,68,0.3)' }} />)}
                    </View>
                    <View style={{ width: 140, marginTop: 16 }}>
                      <MasterButton color="#21A844" onPress={() => {}}>Ver detalles</MasterButton>
                    </View>
                  </View>
                  <View style={{ width: 190, height: 190, position: 'absolute', right: -25, top: -10, zIndex: 1 }}>
                    <Image source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                  </View>
                </View>
              </MasterGlass>
            </View>

            {/* Filtros */}
            <BarraFiltros activo={filtroActivo} onCambio={onCambioFiltro} />

            {/* Contenido — memoizado, aislado del re-render del padre */}
            <SeccionesContenido />

          </View>
        </ScrollView>
      </LinearGradient>
    </FiltroCtx.Provider>
  );
}

const sf = StyleSheet.create({
  barra: { gap: 10, paddingHorizontal: 20, marginBottom: 24 },
});

const s = StyleSheet.create({
  raiz:             { flex: 1 },
  contenido:        { paddingBottom: 0 },
  superiorInicio:   { gap: 0 },
  headerInicio:     { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 20 },
  headerTitulo:     { alignItems: 'center', flexDirection: 'row', width: '60%' },
  headerIzq:        { flex: 1 },
  nombreFila:       { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headerNombre:     { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 32, lineHeight: 36 },
  saludoIcono:      { height: 28, resizeMode: 'contain', width: 28 },
  headerSaludo:     { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 17, marginTop: 4 },
  headerDer:        { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  statPill:         { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statPillFila:     { alignItems: 'center', flexDirection: 'row', gap: 4 },
  gemaIcono:        { height: 22, resizeMode: 'contain', width: 22 },
  statTexto:        { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  notificacion:     { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 },
  notificacionIcono:{ height: 30, resizeMode: 'contain', width: 30 },
});
