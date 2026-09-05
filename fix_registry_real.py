import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/registroLecciones.tsx', 'r') as f:
    content = f.read()

# Add imports
imports = """import { WidgetTeoriaCorta } from './widgets/WidgetTeoriaCorta';
import { WidgetOpcionMultiple } from './widgets/WidgetOpcionMultiple';
import { WidgetParesConectables } from './widgets/WidgetParesConectables';
import { WidgetRellenarHuecos } from './widgets/WidgetRellenarHuecos';
import { WidgetVerdaderoFalso } from './widgets/WidgetVerdaderoFalso';
import { WidgetOrdenarLista } from './widgets/WidgetOrdenarLista';
import { WidgetFlashcard } from './widgets/WidgetFlashcard';"""

content = re.sub(r"import \{ WidgetTeoriaCorta \}.*?import \{ WidgetOpcionMultiple \} from '\./widgets/WidgetOpcionMultiple';", imports, content, flags=re.DOTALL)

# Update registry
old_reg = """export const REGISTRO_LECCIONES: Record<WidgetLeccionId, ComponentType<WidgetLeccionProps<any>>> = {
  'teoria-corta': WidgetTeoriaCorta,
  'opcion-multiple': WidgetOpcionMultiple,
  'pares-conectables': DummyWidget,
  'rellenar-huecos': DummyWidget,
  'verdadero-falso': DummyWidget,
  'ordenar-lista': DummyWidget,
  'flashcard': DummyWidget,"""

new_reg = """export const REGISTRO_LECCIONES: Record<WidgetLeccionId, ComponentType<WidgetLeccionProps<any>>> = {
  'teoria-corta': WidgetTeoriaCorta,
  'opcion-multiple': WidgetOpcionMultiple,
  'pares-conectables': WidgetParesConectables,
  'rellenar-huecos': WidgetRellenarHuecos,
  'verdadero-falso': WidgetVerdaderoFalso,
  'ordenar-lista': WidgetOrdenarLista,
  'flashcard': WidgetFlashcard,"""

content = content.replace(old_reg, new_reg)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/registroLecciones.tsx', 'w') as f:
    f.write(content)
