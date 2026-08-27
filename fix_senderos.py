import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Update CarpetaGiganteSenderos definition
content = content.replace(
    "function CarpetaGiganteSenderos() {\n  const [categoriaAbierta, setCategoriaAbierta] = useState('');",
    "function CarpetaGiganteSenderos({ categoriaAbierta, setCategoriaAbierta }: { categoriaAbierta: string, setCategoriaAbierta: (id: string) => void }) {"
)

# 2. Add state to SenderosPantalla
old_state = "  const [pestanaActiva, setPestanaActiva] = useState<PaginaSenderosId>('mis-senderos');"
new_state = "  const [pestanaActiva, setPestanaActiva] = useState<PaginaSenderosId>('mis-senderos');\n  const [categoriaAbierta, setCategoriaAbierta] = useState('');"
content = content.replace(old_state, new_state)

# 3. Pass state to CarpetaGiganteSenderos
content = content.replace(
    "<CarpetaGiganteSenderos />",
    "<CarpetaGiganteSenderos categoriaAbierta={categoriaAbierta} setCategoriaAbierta={setCategoriaAbierta} />"
)

# 4. Modify the header image and text dynamically
# The header looks like:
# <Image source={require('../../../../assets/ilustraciones/senderos.png')} resizeMode="cover" style={styles.ilustracion} />
# And maybe texts: "Todos los caminos empiezan con el primer paso"

# Let's map categories to images and titles.
dynamic_header_logic = """
  let headerImg = require('../../../../assets/ilustraciones/senderos.png');
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
  }
"""

content = content.replace("  const contenidoActivo = paginasSenderos[pestanaActiva];", "  const contenidoActivo = paginasSenderos[pestanaActiva];\n" + dynamic_header_logic)

# Replace <Image> source
content = re.sub(
    r"<Image source=\{require\('\.\./\.\./\.\./\.\./assets/ilustraciones/senderos\.png'\)\} resizeMode=\"cover\" style=\{styles\.ilustracion\} />",
    r'<Image source={headerImg} resizeMode="cover" style={styles.ilustracion} />',
    content
)

# Wait, the user didn't specify where "Todos los caminos empiezan..." is right now. Let's find it.
# Actually, I should find where the title is in SenderosPantalla.
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(content)

