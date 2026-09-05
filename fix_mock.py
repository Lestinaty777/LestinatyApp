import re

with open('/home/arch-i7/Proyects/app/app/senderos/leccion.tsx', 'r') as f:
    content = f.read()

old_mock = """const MOCK_LECCION: LeccionPack = {
  id: 'mock-1',
  titulo: 'Fundamentos',
  pasos: [
    {
      id: 'paso-1',
      tipo: 'teoria-corta',
      config: {
        texto: '¡Bienvenido a tu primera lección interactiva! SDUI nos permite generar estos bloques de manera dinámica. Toca Continuar para avanzar a la pregunta.',
        personaje: 'explicando'
      }
    },
    {
      id: 'paso-2',
      tipo: 'opcion-multiple',
      config: {
        pregunta: '¿Qué significa SDUI?',
        opciones: [
          'Server-Driven User Interface',
          'Simple Data User Input',
          'Standard Design Utilities'
        ],
        indiceCorrecto: 0,
        mensajeExito: '¡Exacto! El backend controla la UI.',
        mensajeError: 'Pista: Empieza con Server-Driven...'
      }
    }
  ]
};"""

new_mock = """const MOCK_LECCION: LeccionPack = {
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
};"""

content = content.replace(old_mock, new_mock)

with open('/home/arch-i7/Proyects/app/app/senderos/leccion.tsx', 'w') as f:
    f.write(content)
