import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    content = f.read()

# Add emptyStateSub to logic
old_logic = """  let headerImg = require('../../../../assets/ilustraciones/senderos.png');
  let headerTitle = 'Todos los caminos empiezan con el primer paso';
  let emptyStateMsg = 'Aún no hay senderos aquí...';
  
  if (pestanaActiva === 'mis-senderos' && categoriaAbierta) {
    if (categoriaAbierta === 'rutinas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/rutina.png');
      headerTitle = 'La disciplina forja el carácter';
      emptyStateMsg = 'No tienes rutinas activas. ¡Configura tu mañana!';
    } else if (categoriaAbierta === 'salud') {
      headerImg = require('../../../../assets/ilustraciones/senderos/salud.png');
      headerTitle = 'Tu cuerpo es tu templo';
      emptyStateMsg = 'No hay senderos de salud. ¡Muévete hoy!';
    } else if (categoriaAbierta === 'habitos') {
      headerImg = require('../../../../assets/ilustraciones/senderos/habitos.png');
      headerTitle = 'Pequeñas acciones, grandes resultados';
      emptyStateMsg = 'Sin hábitos creados. ¡Empieza con uno fácil!';
    } else if (categoriaAbierta === 'tareas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/tareas.png');
      headerTitle = 'El orden es poder';
      emptyStateMsg = 'No tienes tareas pendientes. ¡Todo en orden!';
    } else if (categoriaAbierta === 'finanzas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/finanzas.png');
      headerTitle = 'Construye tu imperio, paso a paso';
      emptyStateMsg = 'Sin metas financieras. ¡Ahorra para tu futuro!';
    } else if (categoriaAbierta === 'relaciones') {
      headerImg = require('../../../../assets/ilustraciones/senderos/relaciones.png');
      headerTitle = 'Conecta, nutre y crece';
      emptyStateMsg = '¡No olvides escribirle a alguien especial hoy!';
    } else if (categoriaAbierta === 'estudio') {
      headerImg = require('../../../../assets/ilustraciones/senderos/estudio.png');
      headerTitle = 'El conocimiento es libertad';
      emptyStateMsg = '¡Abre un libro o inicia un nuevo curso!';
    }
  }"""

new_logic = """  let headerImg = require('../../../../assets/ilustraciones/senderos.png');
  let headerTitle = 'Todos los caminos empiezan con el primer paso';
  let emptyStateTitle = 'Aún no tienes senderos';
  let emptyStateSub = 'Crea tu primer camino y empieza a construir hábitos que te acerquen a tus metas.';
  
  if (pestanaActiva === 'mis-senderos' && categoriaAbierta) {
    if (categoriaAbierta === 'rutinas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/rutina.png');
      headerTitle = 'La disciplina forja el carácter';
      emptyStateTitle = 'No tienes rutinas activas';
      emptyStateSub = 'Configura tu mañana ideal y asegura tus victorias diarias.';
    } else if (categoriaAbierta === 'salud') {
      headerImg = require('../../../../assets/ilustraciones/senderos/salud.png');
      headerTitle = 'Tu cuerpo es tu templo';
      emptyStateTitle = 'Sin metas de salud';
      emptyStateSub = 'Programa tus sesiones de entrenamiento y nutrición.';
    } else if (categoriaAbierta === 'habitos') {
      headerImg = require('../../../../assets/ilustraciones/senderos/habitos.png');
      headerTitle = 'Pequeñas acciones, grandes resultados';
      emptyStateTitle = 'Sin hábitos rastreados';
      emptyStateSub = 'Elige un hábito pequeño y empieza tu primera racha hoy.';
    } else if (categoriaAbierta === 'tareas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/tareas.png');
      headerTitle = 'El orden es tu mejor aliado';
      emptyStateTitle = 'El tablero está limpio';
      emptyStateSub = 'No hay tareas pendientes. Agrega un proyecto para empezar.';
    } else if (categoriaAbierta === 'finanzas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/finanzas.png');
      headerTitle = 'Construye tu imperio, paso a paso';
      emptyStateTitle = 'Sin presupuestos o metas';
      emptyStateSub = 'Traza una meta de ahorro y controla tu patrimonio.';
    } else if (categoriaAbierta === 'relaciones') {
      headerImg = require('../../../../assets/ilustraciones/senderos/relaciones.png');
      headerTitle = 'Conecta, nutre y crece';
      emptyStateTitle = 'Red de contactos vacía';
      emptyStateSub = 'Programa recordatorios para cultivar tus relaciones importantes.';
    } else if (categoriaAbierta === 'estudio') {
      headerImg = require('../../../../assets/ilustraciones/senderos/estudio.png');
      headerTitle = 'El conocimiento es libertad';
      emptyStateTitle = 'Sin currículum de aprendizaje';
      emptyStateSub = 'Crea un sendero de estudio para esa habilidad que quieres dominar.';
    }
  }"""
content = content.replace(old_logic, new_logic)

# Replace actual JSX texts
content = content.replace("Todos los caminos empiezan con el primer paso", "{headerTitle}")
content = content.replace("Aun no tienes senderos", "{emptyStateTitle}")
content = content.replace("Crea tu primer camino y empieza a construir habitos que te acerquen a tus metas.", "{emptyStateSub}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(content)

