import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/compartidos.ts', 'r') as f:
    content = f.read()

new_items = """
  {
    acento: '#FF9500',
    categoria: 'Finanzas',
    categoriaId: 'finanzas',
    descripcion: 'Ahorro semanal para viaje en grupo.',
    estadoSincronia: 'en-progreso',
    etapaActual: 'Meta 1 · Fondo inicial',
    etiquetaEstandarte: 'Ahorro',
    frecuencia: 'Semanal',
    id: 'ahorro-escuadra',
    mensajeMotivacional: '¡Falta poco para la primera meta!',
    miembros: [
      { colorAvatar: '#FF9500', completadoHoy: true, esUsuarioActual: true, id: 'user-1', iniciales: 'YO', nombre: 'Tú', ramaElegida: 'Agresiva' },
      { colorAvatar: '#FF3B30', completadoHoy: false, esUsuarioActual: false, id: 'user-11', iniciales: 'AN', nombre: 'Ana', ramaElegida: 'Conservadora' },
    ],
    nodoActualNumero: 2,
    progresoPorcentaje: 25,
    rachaDias: 2,
    tipo: 'duo',
    titulo: 'Fondo Viaje',
    totalNodos: 8,
  },
  {
    acento: '#FF2D55',
    categoria: 'Relaciones',
    categoriaId: 'relaciones',
    descripcion: 'Llamada familiar semanal.',
    estadoSincronia: 'perfecta',
    etapaActual: 'Mantenimiento',
    etiquetaEstandarte: 'Familia',
    frecuencia: 'Semanal',
    id: 'llamada-duo',
    mensajeMotivacional: 'Ambos llamaron esta semana ✨',
    miembros: [
      { colorAvatar: '#FF2D55', completadoHoy: true, esUsuarioActual: true, id: 'user-1', iniciales: 'YO', nombre: 'Tú', ramaElegida: 'Constante' },
      { colorAvatar: '#5AC8FA', completadoHoy: true, esUsuarioActual: false, id: 'user-12', iniciales: 'MA', nombre: 'Mamá', ramaElegida: 'Constante' },
    ],
    nodoActualNumero: 8,
    progresoPorcentaje: 100,
    rachaDias: 5,
    tipo: 'duo',
    titulo: 'Llamada a casa',
    totalNodos: 8,
  },
  {
    acento: '#5AC8FA',
    categoria: 'Tareas',
    categoriaId: 'tareas',
    descripcion: 'Limpieza profunda del departamento.',
    estadoSincronia: 'en-riesgo',
    etapaActual: 'Fin de mes',
    etiquetaEstandarte: 'Limpieza',
    frecuencia: 'Mensual',
    id: 'limpieza-escuadra',
    mensajeMotivacional: 'Estamos atrasados este mes 🚨',
    miembros: [
      { colorAvatar: '#5AC8FA', completadoHoy: false, esUsuarioActual: true, id: 'user-1', iniciales: 'YO', nombre: 'Tú', ramaElegida: 'Rápida' },
      { colorAvatar: '#4CD964', completadoHoy: false, esUsuarioActual: false, id: 'user-13', iniciales: 'RO', nombre: 'Roomie', ramaElegida: 'Detallada' },
    ],
    nodoActualNumero: 1,
    progresoPorcentaje: 12,
    rachaDias: 0,
    tipo: 'duo',
    titulo: 'Depa Impecable',
    totalNodos: 8,
  }
"""

content = content.replace('];', new_items + '\n];')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/compartidos.ts', 'w') as f:
    f.write(content)

print("compartidos.ts updated!")
