import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

if "WidgetKanban" not in acode:
    acode = acode.replace("import { WidgetDecision } from './widgets/WidgetDecision';", "import { WidgetDecision } from './widgets/WidgetDecision';\nimport { WidgetKanban } from './widgets/WidgetKanban';")
    
    nuevo_item = """
  'kanban': {
    Componente: WidgetKanban as any,
    descripcion: 'Mini tablero Kanban de 3 columnas',
    esquemaConfig: z.object({ 
      tareas: z.array(z.string()).max(3), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
"""
    acode = acode.replace("  'escala': {", nuevo_item + "  'escala': {")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
        f.write(acode)


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

if "mockKanban" not in rcode:
    mocks = """
const mockKanban: WidgetAccionPack = {
  id: 'kanban', rol: 'principal',
  config: { titulo: 'Proyecto Mini', subtitulo: 'Toca las tarjetas para avanzarlas', tareas: ['Investigar', 'Diseñar UI', 'Programar'] }
};
"""
    rcode = rcode.replace("const mockEscala", mocks + "\nconst mockEscala")
    
    render_kanban = """
        <View>
          <Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>7. Widget Kanban</Texto>
          <RenderizadorAccion widget={mockKanban} estado="activo" color={acento} onEvento={manejarEvento} />
        </View>
"""
    rcode = rcode.replace("      </View>\n    </ScrollView>", render_kanban + "      </View>\n    </ScrollView>")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
        f.write(rcode)

