import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

if "WidgetEscala" not in acode:
    acode = acode.replace("import { WidgetChecklist } from './widgets/WidgetChecklist';", "import { WidgetChecklist } from './widgets/WidgetChecklist';\nimport { WidgetEscala } from './widgets/WidgetEscala';\nimport { WidgetDecision } from './widgets/WidgetDecision';")
    
    nuevo_item = """
  'escala': {
    Componente: WidgetEscala as any,
    descripcion: 'Escala numerica o valoracion',
    esquemaConfig: z.object({ 
      min: z.number(), max: z.number(), etiquetas: z.tuple([z.string(), z.string()]).optional(), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
  'decision': {
    Componente: WidgetDecision as any,
    descripcion: 'Bifurcacion de 2 opciones',
    esquemaConfig: z.object({ 
      opciones: z.tuple([z.string(), z.string()]), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
"""
    acode = acode.replace("  'cronometro': {", nuevo_item + "  'cronometro': {")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
        f.write(acode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

if "mockEscala" not in rcode:
    mocks = """
const mockEscala: WidgetAccionPack = {
  id: 'escala', rol: 'principal',
  config: { titulo: 'Nivel de Energía', subtitulo: '¿Cómo te sientes al despertar?', min: 1, max: 5, etiquetas: ['Agotado', 'Excelente'] }
};

const mockDecision: WidgetAccionPack = {
  id: 'decision', rol: 'principal',
  config: { titulo: 'Resistencia', subtitulo: '¿Evitaste el azúcar hoy?', opciones: ['Sí, lo logré', 'Caí en tentación'] }
};
"""
    rcode = rcode.replace("const mockChecklist", mocks + "\nconst mockChecklist")
    
    render_escala = """
        <View>
          <Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>5. Widget Escala</Texto>
          <RenderizadorAccion widget={mockEscala} estado="activo" color={acento} onEvento={manejarEvento} />
        </View>

        <View>
          <Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>6. Widget Decisión</Texto>
          <RenderizadorAccion widget={mockDecision} estado="activo" color={acento} onEvento={manejarEvento} />
        </View>
"""
    rcode = rcode.replace("      </View>\n    </ScrollView>", render_escala + "      </View>\n    </ScrollView>")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
        f.write(rcode)

