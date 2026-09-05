import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LessonRunner } from '../../src/modulos/senderos/componentes/lecciones/LessonRunner';
import type { LeccionPack } from '../../src/modulos/senderos/motor/sdui/lecciones/tiposLeccion';

// Mock de la lección para probar el Runner
const MOCK_LECCION: LeccionPack = {
  id: 'mock-1',
  titulo: 'Demostración de 10 Widgets',
  pasos: [
    {
      id: 'p1', tipo: 'teoria-corta',
      config: { texto: 'Widget 1: Teoría Corta. Aquí mostramos información rápida. Toca continuar para ver el siguiente widget.', personaje: 'explicando' }
    },
    {
      id: 'p2', tipo: 'opcion-multiple',
      config: { pregunta: 'Widget 2: Opción Múltiple. ¿Qué número sigue a 3?', opciones: ['1', '2', '4'], indiceCorrecto: 2 }
    },
    {
      id: 'p3', tipo: 'pares-conectables',
      config: { instruccion: 'Widget 3: Pares Conectables', pares: [{izquierdo: 'Perro', derecho: 'Guau'}, {izquierdo: 'Gato', derecho: 'Miau'}] }
    },
    {
      id: 'p4', tipo: 'rellenar-huecos',
      config: { textoConHuecos: 'Widget 4: El sol es amarillo y el cielo es azul', opciones: ['amarillo', 'azul'], respuestas: ['amarillo', 'azul'] }
    },
    {
      id: 'p5', tipo: 'verdadero-falso',
      config: { afirmacion: 'Widget 5: Verdadero/Falso. El agua hierve a 100°C.', esVerdadero: true, explicacion: 'A nivel del mar, el agua hierve a 100°C.' }
    },
    {
      id: 'p6', tipo: 'ordenar-lista',
      config: { instruccion: 'Widget 6: Ordenar. Ordena los números.', elementosDesordenados: ['Dos', 'Uno', 'Tres'], elementosOrdenados: ['Uno', 'Dos', 'Tres'] }
    },
    {
      id: 'p7', tipo: 'flashcard',
      config: { frente: 'Widget 7: Flashcard (Frente). Toca para voltear.', dorso: 'Dorso de la flashcard. ¿La sabías?' }
    },
    {
      id: 'p8', tipo: 'parejas-memoria',
      config: { pares: [{id: '1', textoA: 'A', textoB: 'B'}] }
    },
    {
      id: 'p9', tipo: 'opcion-imagen',
      config: { pregunta: 'Widget 9: Imagen múltiple', opciones: [{url: 'http://', descripcion: 'Img 1'}, {url: 'http://', descripcion: 'Img 2'}], indiceCorrecto: 0 }
    },
    {
      id: 'p10', tipo: 'desafio-final',
      config: { preguntas: [], tiempoLimiteSegundos: 30 }
    }
  ]
};

export default function LeccionPantalla() {
  const enrutador = useRouter();
  const { color } = useLocalSearchParams<{ color: string }>();
  const colorTema = color || '#5B2E91';

  return (
    <LessonRunner 
      leccion={MOCK_LECCION} color={colorTema} 
      onTerminar={(exito) => {
        // Al terminar, volvemos a la pantalla anterior
        if (enrutador.canGoBack()) {
          enrutador.back();
        } else {
          enrutador.replace('/');
        }
      }} 
    />
  );
}
