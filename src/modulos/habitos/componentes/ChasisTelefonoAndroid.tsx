import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Camera,
  Clock,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  Phone,
  Settings,
  Signal,
  Wifi,
} from 'lucide-react-native';

import { Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

type ChasisTelefonoAndroidProps = {
  children: ReactNode;
  ancho?: number;
  /** Si se omite, se calcula solo a partir de `ancho` con una relación de
   * aspecto real de celular (~19.5:9) — antes un `alto` fijo sin relación
   * con `ancho` podía dar un mockup achatado, nada parecido a un teléfono. */
  alto?: number;
};

// 19.5:9 — relación de aspecto típica de un celular Android moderno
// (Pixel, Galaxy). Antes el `alto` por defecto (590) no guardaba ninguna
// proporción real con el `ancho` (320), dando ~1.84:1 en vez de ~2.17:1.
const RELACION_ALTO_ANCHO = 19.5 / 9;

// 8 aplicaciones reales en matriz 2×4 (Fila 1 de apps en pantalla + Fila 2 en Dock)
const APPS_FILA_SUPERIOR = [
  { id: 'cal', nombre: 'Calendario', color: '#2563EB', Icono: Calendar },
  { id: 'fot', nombre: 'Fotos', color: '#EA580C', Icono: ImageIcon },
  { id: 'clk', nombre: 'Reloj', color: '#D97706', Icono: Clock },
  { id: 'cfg', nombre: 'Ajustes', color: '#4B5563', Icono: Settings },
] as const;

const APPS_DOCK_INFERIOR = [
  { id: 'tel', nombre: 'Teléfono', color: ESCALA_ESMERALDA.jade.l59a, Icono: Phone },
  { id: 'msg', nombre: 'Mensajes', color: '#0284C7', Icono: MessageSquare },
  { id: 'web', nombre: 'Chrome', color: '#EAB308', Icono: Globe },
  { id: 'cam', nombre: 'Cámara', color: '#DC2626', Icono: Camera },
] as const;

// Chasis fotorrealista de smartphone Android (Aspect ratio estilizado ~20:9):
// – Marco exterior de titanio cepillado con botones físicos de volumen y encendido.
// – Cámara frontal punch-hole centrada con lente reflectiva.
// – Barra de estado completa (hora, Wi-Fi, señal 5G y batería).
// – Pantalla de inicio con widget, barra de búsqueda y grilla 2×4 (8 aplicaciones).
// – Píldora gestual de navegación inferior de Android.
export function ChasisTelefonoAndroid({
  children,
  ancho = 320,
  alto,
}: ChasisTelefonoAndroidProps) {
  const esc = useEscala();
  const ch = useEstilosCh();
  const altoFinal = alto ?? Math.round(ancho * RELACION_ALTO_ANCHO);
  return (
    <View style={[ch.contenedorExterno, { width: ancho + 8, height: altoFinal }]}>
      {/* Botones físicos laterales del teléfono */}
      <View style={[ch.botonLateral, ch.botonVolumen]} />
      <View style={[ch.botonLateral, ch.botonEncendido]} />

      {/* Cuerpo principal del teléfono (Bisel de titanio con esquinas curvas profundas) */}
      <View style={[ch.cuerpoTelefono, { width: ancho, height: altoFinal }]}>
        {/* Pantalla interior */}
        <View style={ch.pantallaInterior}>
          {/* Wallpaper orgánico de selva profunda / atmósfera Lestinaty */}
          <LinearGradient
            colors={[esc.musgo.l10, esc.hoja.l19, esc.musgo.l10, '#020C06']}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Halos de luz ambiental tipo wallpaper Android */}
          <View style={ch.orbLuzVerde} />
          <View style={ch.orbLuzDorado} />

          {/* Barra de estado Android */}
          <View style={ch.barraEstado}>
            <Texto style={ch.relojEstado}>09:41</Texto>

            {/* Cámara frontal Punch-hole */}
            <View style={ch.camaraPunchHole}>
              <View style={ch.camaraLente} />
            </View>

            {/* Iconos de estado: Wi-Fi, señal y batería */}
            <View style={ch.iconosEstado}>
              <Wifi color="rgba(255,255,255,0.85)" size={12} strokeWidth={2.4} />
              <Signal color="rgba(255,255,255,0.85)" size={11} strokeWidth={2.4} />
              <View style={ch.bateriaContenedor}>
                <View style={ch.bateriaCuerpo}>
                  <View style={ch.bateriaNivel} />
                </View>
                <View style={ch.bateriaPolo} />
              </View>
            </View>
          </View>

          {/* At a glance superior (fecha Android) */}
          <View style={ch.atAGlance}>
            <Texto style={ch.atAGlanceTexto}>Jueves, 17 de septiembre</Texto>
          </View>

          {/* Zona central: El Widget de Hábitos activo */}
          <View style={ch.zonaWidget}>
            {children}
          </View>

          {/* Barra de búsqueda de Android */}
          <View style={ch.barraBusqueda}>
            <View style={ch.gPunto}>
              <Texto style={ch.gLetra}>G</Texto>
            </View>
            <Texto style={ch.busquedaTexto}>Buscar en el teléfono…</Texto>
            <View style={ch.microfonoPunto} />
          </View>

          {/* Grilla de 8 aplicaciones (2 filas de 4 columnas) */}
          <View style={ch.zonaAplicaciones}>
            {/* Fila 1 de aplicaciones en el escritorio */}
            <View style={ch.filaApps}>
              {APPS_FILA_SUPERIOR.map((app) => (
                <View key={app.id} style={ch.itemApp}>
                  <View style={[ch.iconoApp, { backgroundColor: app.color }]}>
                    <app.Icono color="#FFFFFF" size={17} strokeWidth={2.3} />
                  </View>
                  <Texto style={ch.etiquetaApp} numberOfLines={1}>
                    {app.nombre}
                  </Texto>
                </View>
              ))}
            </View>

            {/* Fila 2 de aplicaciones en el Dock */}
            <View style={ch.dockApps}>
              {APPS_DOCK_INFERIOR.map((app) => (
                <View key={app.id} style={ch.itemApp}>
                  <View style={[ch.iconoApp, { backgroundColor: app.color }]}>
                    <app.Icono color="#FFFFFF" size={17} strokeWidth={2.3} />
                  </View>
                  <Texto style={ch.etiquetaApp} numberOfLines={1}>
                    {app.nombre}
                  </Texto>
                </View>
              ))}
            </View>
          </View>

          {/* Barra de gestos inferior de Android */}
          <View style={ch.barraNavegacion}>
            <View style={ch.pildoraGestos} />
          </View>
        </View>
      </View>
    </View>
  );
}

const crearEstilosCh = (esc: EscalaMaster) => StyleSheet.create({
  contenedorExterno: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  botonLateral: {
    position: 'absolute',
    backgroundColor: '#1C2229',
    borderRadius: 2,
  },
  botonVolumen: {
    left: 0,
    top: 135,
    width: 3.5,
    height: 65,
  },
  botonEncendido: {
    right: 0,
    top: 175,
    width: 3.5,
    height: 42,
  },
  cuerpoTelefono: {
    borderRadius: 44,
    backgroundColor: '#0C0F14',
    borderWidth: 3.5,
    borderColor: '#232B36',
    padding: 3,
    overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
  },
  pantallaInterior: {
    flex: 1,
    borderRadius: 38,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  orbLuzVerde: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: conAlfa(esc.jade.l70, 0.16),
  },
  orbLuzDorado: {
    position: 'absolute',
    bottom: 90,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(234, 179, 8, 0.09)',
  },
  barraEstado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 28,
    zIndex: 10,
  },
  relojEstado: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  camaraPunchHole: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#040609',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camaraLente: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E3A5F',
  },
  iconosEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bateriaContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bateriaCuerpo: {
    width: 18,
    height: 9,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: 1,
    justifyContent: 'center',
  },
  bateriaNivel: {
    width: '88%',
    height: '100%',
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  bateriaPolo: {
    width: 1.5,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
  atAGlance: {
    paddingHorizontal: 20,
    marginTop: 2,
  },
  atAGlanceTexto: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
  },
  zonaWidget: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 32,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  gPunto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gLetra: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
  },
  busquedaTexto: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
    flex: 1,
    marginLeft: 8,
  },
  microfonoPunto: {
    width: 7,
    height: 11,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  zonaAplicaciones: {
    paddingHorizontal: 10,
    gap: 8,
    paddingBottom: 4,
  },
  filaApps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dockApps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  itemApp: {
    alignItems: 'center',
    width: 54,
  },
  iconoApp: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 6px rgba(0,0,0,0.35)',
  },
  etiquetaApp: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Montserrat-Medium',
    fontSize: 8.5,
    marginTop: 2.5,
    textAlign: 'center',
  },
  barraNavegacion: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  pildoraGestos: {
    width: 76,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

const estilosPorEscalaCh = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosCh>>();

function useEstilosCh() {
  const esc = useEscala();
  let valor = estilosPorEscalaCh.get(esc);
  if (!valor) {
    valor = crearEstilosCh(esc);
    estilosPorEscalaCh.set(esc, valor);
  }
  return valor;
}
