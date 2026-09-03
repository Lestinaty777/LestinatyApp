import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

if "WidgetEisenhower" not in acode:
    acode = acode.replace("import { WidgetKanban } from './widgets/WidgetKanban';", "import { WidgetKanban } from './widgets/WidgetKanban';\nimport { WidgetEisenhower } from './widgets/WidgetEisenhower';")
    
    nuevo_item = """
  'eisenhower': {
    Componente: WidgetEisenhower as any,
    descripcion: 'Matriz de Eisenhower 2x2',
    esquemaConfig: z.object({ 
      tarea: z.string(), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
"""
    acode = acode.replace("  'kanban': {", nuevo_item + "  'kanban': {")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
        f.write(acode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

if "mockEisenhower" not in rcode:
    mocks = """
const mockEisenhower: WidgetAccionPack = {
  id: 'eisenhower', rol: 'principal',
  config: { titulo: 'Matriz de Prioridad', tarea: 'Reestructurar la Base de Datos', subtitulo: 'Clasifica el nivel de urgencia' }
};
"""
    rcode = rcode.replace("const mockKanban", mocks + "\nconst mockKanban")
    
    render_nuevo = """
        <View>
          <Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>8. Widget Eisenhower</Texto>
          <RenderizadorAccion widget={mockEisenhower} estado={estados[mockEisenhower.id] || "activo"} color={acento} onEvento={manejarEvento} />
        </View>
"""
    rcode = rcode.replace("      </View>\n    </ScrollView>", render_nuevo + "      </View>\n    </ScrollView>")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
        f.write(rcode)

