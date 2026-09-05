import re

with open('/home/arch-i7/Proyects/app/src/modulos/aby/componentes/ResumenSenderoAby.tsx', 'r') as f:
    content = f.read()

# Replace the variables with the new ones
old_body = """  const frecuencia = configuracion.tipo === 'finito' ? 'Objetivo con final' : configuracion.diasSemana.map((dia) => nombreDias[dia - 1]).join(' - ');
  const filas: { etiqueta: string; texto: string; id: PreguntaIdAby }[] = [
    { etiqueta: 'Ritmo', texto: configuracion.tipo === 'ciclico' ? 'Rutina recurrente' : 'Objetivo con final', id: 'tipo' },
    { etiqueta: 'Dias', texto: frecuencia || 'Sin dias', id: 'frecuencia' },
    { etiqueta: 'Tiempo', texto: `${configuracion.duracionMinutos ?? 0} min`, id: 'duracion' },
  ];"""

new_body = """  const filas: { etiqueta: string; texto: string; id: PreguntaIdAby }[] = [
    { etiqueta: 'Fecha', texto: configuracion.fechaExamen || 'No definida', id: 'fecha-examen' },
    { etiqueta: 'Alcance', texto: configuracion.alcance || 'Sin definir', id: 'alcance' },
    { etiqueta: 'Fuente', texto: configuracion.fuente || 'General', id: 'fuente' },
    { etiqueta: 'Disponibilidad', texto: configuracion.disponibilidadSemanal ? `${configuracion.disponibilidadSemanal} horas` : 'No definida', id: 'disponibilidad-semanal' },
    { etiqueta: 'Nivel', texto: configuracion.nivelInicial || 'No definido', id: 'nivel-inicial' },
  ].filter((f) => f.texto !== 'No definida' && f.texto !== 'Sin definir');"""

content = content.replace(old_body, new_body)

with open('/home/arch-i7/Proyects/app/src/modulos/aby/componentes/ResumenSenderoAby.tsx', 'w') as f:
    f.write(content)

