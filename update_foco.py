import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

# Remove Eisenhower
acode = re.sub(r"import \{ WidgetEisenhower \} from '\./widgets/WidgetEisenhower';\n", "", acode)
acode = re.sub(r"  'eisenhower': \{.*?\},", "", acode, flags=re.DOTALL)

# Add Foco
acode = acode.replace("import { WidgetKanban } from './widgets/WidgetKanban';", "import { WidgetKanban } from './widgets/WidgetKanban';\nimport { WidgetFoco } from './widgets/WidgetFoco';")
nuevo_foco = """
  'foco': {
    Componente: WidgetFoco as any,
    descripcion: 'Modo enfoque profundo (Pomodoro)',
    esquemaConfig: z.object({ 
      duracionMinutos: z.number(), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
"""
acode = acode.replace("  'kanban': {", nuevo_foco + "  'kanban': {")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
    f.write(acode)

# Update Showcase
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

rcode = re.sub(r"const mockEisenhower: WidgetAccionPack = \{.*?\};\n", "", rcode, flags=re.DOTALL)
nuevo_mock = """const mockFoco: WidgetAccionPack = { id: 'foco', rol: 'principal', config: { titulo: 'Trabajo Profundo', subtitulo: 'Cero distracciones', duracionMinutos: 1 } };
"""
rcode = rcode.replace("const mockKanban:", nuevo_mock + "const mockKanban:")

# Replace rendering
rcode = re.sub(r"<View>\n          <Texto.*?8\. Widget Eisenhower.*?</View>\n", "", rcode, flags=re.DOTALL)
render_foco = """        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>8. Widget Modo Foco</Texto><RenderizadorAccion widget={mockFoco} estado={estados[mockFoco.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>\n"""
rcode = rcode.replace("      </View>\n    </ScrollView>", render_foco + "      </View>\n    </ScrollView>")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)

