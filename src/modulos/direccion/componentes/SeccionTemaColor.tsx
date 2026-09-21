import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Check, Lock } from 'lucide-react-native';

import { MasterGlass, Texto, useTonoMaster } from '../../../diseno';
import { useTemaMasterGlobal } from '../../../nucleo/proveedor/ProveedorTemaMaster';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { obtenerCatalogoArboles } from '../../tienda/gemas.servicio';
import { ID_TEMA_GRATUITO, opcionesDeTema, type OpcionTema, type RarezaTema } from '../../tienda/temasDesbloqueados';
import { usePaquetesDesbloqueados } from '../../tienda/usePaquetesDesbloqueados';

const ETIQUETA_RAREZA: Record<RarezaTema, string> = { gratis: 'Gratis', legendario: 'Legendario', unico: 'Único' };

// Pestaña "Tema" de Perfil: TODOS los temas de color, cada uno con el árbol de su paquete. Un tema se desbloquea por
// POSESIÓN del paquete (tener su semilla) y se conserva aunque la semilla ya se haya plantado: viene del registro
// durable de paquetes desbloqueados, nunca de las semillas disponibles.
export function SeccionTemaColor() {
  const tono = useTonoMaster();
  const router = useRouter();
  const { elegir } = useTemaMasterGlobal();
  const catalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const desbloqueados = usePaquetesDesbloqueados();
  const opciones = opcionesDeTema(catalogo.data ?? [], desbloqueados.data ?? []);
  const tenidos = opciones.filter((opcion) => !opcion.bloqueado).length;
  const comprobando = desbloqueados.isLoading || catalogo.isLoading;

  const usarTema = (opcion: OpcionTema) => elegir(opcion.id === ID_TEMA_GRATUITO ? null : { id: opcion.id, masterPackColor: opcion.masterPackColor });
  const irALaTienda = () => router.push('/tienda');
  const avisarBloqueo = (opcion: OpcionTema) =>
    Alert.alert(`${opcion.nombre} está bloqueado`, `Necesitas una semilla de ${opcion.nombre} para desbloquearlo. Consíguela en la tienda: el tema se queda tuyo aunque plantes la semilla.`, [
      { style: 'cancel', text: 'Ahora no' },
      { onPress: irALaTienda, text: 'Ir a la tienda' },
    ]);

  return (
    <View style={estilos.raiz}>
      <View style={estilos.cabecera}>
        <Texto style={[estilos.titulo, { color: tono.paleta.titulo }]}>Tema de color</Texto>
        <Texto style={[estilos.texto, { color: tono.paleta.suave }]}>
          Cada tema es el color de un paquete de árbol y cambia toda la app. Para desbloquearlo necesitas tener su semilla: cómprala en la tienda o recíbela de regalo. Cuando es tuya, el tema se queda para siempre, aunque plantes la semilla en un hábito.
        </Texto>
        {!comprobando && <Texto style={[estilos.contador, { color: tono.paleta.medio }]}>{tenidos} de {opciones.length} temas desbloqueados</Texto>}
      </View>

      {catalogo.isError && <Texto style={[estilos.texto, { color: tono.paleta.suave }]}>No pudimos cargar los temas. Reintenta en un momento.</Texto>}
      {desbloqueados.isError && <Texto style={[estilos.texto, { color: tono.paleta.suave }]}>No pudimos comprobar tus paquetes: los que ves bloqueados podrían ser tuyos.</Texto>}

      <View style={estilos.grid}>
        {opciones.map((opcion) => {
          const activo = opcion.id === tono.id;
          const arbol = obtenerAssetsPaquete(opcion.id)?.etapas[6];
          return (
            <Pressable
              accessibilityLabel={`Tema ${opcion.nombre}, ${opcion.bloqueado ? 'bloqueado' : activo ? 'en uso' : 'desbloqueado'}`}
              accessibilityState={{ disabled: comprobando, selected: activo }}
              disabled={comprobando}
              key={opcion.id}
              onPress={() => (opcion.bloqueado ? avisarBloqueo(opcion) : usarTema(opcion))}
              style={estilos.celda}
            >
              <MasterGlass colorBase={opcion.masterPackColor} style={[estilos.tarjeta, activo && { borderColor: opcion.masterPackColor, borderWidth: 2 }]}>
                <View style={estilos.cabeceraTarjeta}>
                  <View style={[estilos.punto, { backgroundColor: opcion.masterPackColor }]} />
                  <Texto style={[estilos.rareza, { color: tono.paleta.suave }]}>{ETIQUETA_RAREZA[opcion.rareza]}</Texto>
                </View>
                <View style={estilos.arbolCaja}>
                  {arbol && <Image resizeMode="contain" source={arbol} style={[estilos.arbol, opcion.bloqueado && estilos.arbolBloqueado]} />}
                  {opcion.bloqueado && <View style={estilos.candado}><Lock color="#FFFFFF" size={14} /></View>}
                </View>
                <Texto numberOfLines={1} style={[estilos.nombre, { color: tono.paleta.texto }]}>{opcion.nombre}</Texto>
                {opcion.bloqueado ? (
                  <>
                    <Texto style={[estilos.requisito, { color: tono.paleta.suave }]}>Necesitas una semilla de {opcion.nombre} para desbloquearlo.</Texto>
                    <Pressable accessibilityRole="button" hitSlop={6} onPress={irALaTienda}>
                      <Texto style={[estilos.enlace, { color: tono.paleta.medio }]}>Ir a la tienda</Texto>
                    </Pressable>
                  </>
                ) : activo ? (
                  <View style={estilos.estado}><Check color={tono.paleta.medio} size={13} strokeWidth={3} /><Texto style={[estilos.estadoTexto, { color: tono.paleta.medio }]}>En uso</Texto></View>
                ) : (
                  <Texto style={[estilos.estadoTexto, { color: tono.paleta.medio }]}>Usar este tema</Texto>
                )}
              </MasterGlass>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 14 },
  cabecera: { gap: 6 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  texto: { fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  contador: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  celda: { width: '47.5%' },
  tarjeta: { alignItems: 'center', borderRadius: 16, gap: 6, padding: 12 },
  cabeceraTarjeta: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  punto: { borderColor: 'rgba(0,0,0,0.15)', borderRadius: 7, borderWidth: 1, height: 14, width: 14 },
  rareza: { fontFamily: 'Montserrat-Bold', fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' },
  arbolCaja: { alignItems: 'center', height: 92, justifyContent: 'center', width: 92 },
  arbol: { height: 92, width: 92 },
  arbolBloqueado: { opacity: 0.4 },
  candado: { alignItems: 'center', backgroundColor: 'rgba(20,20,30,0.55)', borderRadius: 14, height: 28, justifyContent: 'center', position: 'absolute', width: 28 },
  nombre: { fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  requisito: { fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 14, textAlign: 'center' },
  enlace: { fontFamily: 'Montserrat-Bold', fontSize: 11, textDecorationLine: 'underline' },
  estado: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  estadoTexto: { fontFamily: 'Montserrat-Bold', fontSize: 11 },
});
