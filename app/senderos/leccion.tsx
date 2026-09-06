import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Texto } from '../../src/diseno';
import { LessonRunner } from '../../src/modulos/senderos/componentes/lecciones/LessonRunner';
import { leccionPackMvpSchema } from '../../src/modulos/senderos/motor/sdui/lecciones/esquemaLeccion';
import { obtenerSendero } from '../../src/modulos/senderos/senderos.servicio';
import { completarNodoLocal } from '../../src/modulos/senderos/estado/progresoLocalSendero';
import type { LeccionPack } from '../../src/modulos/senderos/motor/sdui/lecciones/tiposLeccion';

export default function LeccionPantalla() {
  const router = useRouter();
  const { color = '#1463FF', nodoId, senderoId } = useLocalSearchParams<{ color?: string; nodoId?: string; senderoId?: string }>();
  const [leccion, setLeccion] = useState<LeccionPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!senderoId || !nodoId) { setError('No encontramos esta lección.'); return; } obtenerSendero(senderoId).then((sendero) => { const resultado = leccionPackMvpSchema.safeParse(sendero?.nodos.find((item) => item.id === nodoId)?.lessonPack); if (!resultado.success) { setError('Esta lección no está disponible todavía.'); return; } setLeccion(resultado.data as LeccionPack); }).catch(() => setError('No pudimos cargar esta lección.')); }, [nodoId, senderoId]);
  if (error) return <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 }}><Texto>{error}</Texto></View>;
  if (!leccion) return <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}><ActivityIndicator color={color} /></View>;
  return <LessonRunner color={color} leccion={leccion} onTerminar={async () => { if (senderoId && nodoId) await completarNodoLocal(senderoId, nodoId); router.back(); }} />;
}
