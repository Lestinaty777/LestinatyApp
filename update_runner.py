import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'r') as f:
    content = f.read()

# Add color to props
old_props = """type LessonRunnerProps = {
  leccion: LeccionPack;
  onTerminar: (exito: boolean) => void;
};"""
new_props = """type LessonRunnerProps = {
  leccion: LeccionPack;
  color: string;
  onTerminar: (exito: boolean) => void;
};"""
content = content.replace(old_props, new_props)

# Update component signature and pass color
old_sig = "export function LessonRunner({ leccion, onTerminar }: LessonRunnerProps) {"
new_sig = "export function LessonRunner({ leccion, color, onTerminar }: LessonRunnerProps) {"
content = content.replace(old_sig, new_sig)

old_widget = "<WidgetComponent paso={paso as any} onCompletado={(exito) => setEstadoFeedback(exito ? 'correcto' : 'incorrecto')} />"
new_widget = "<WidgetComponent paso={paso as any} color={color} onCompletado={(exito) => setEstadoFeedback(exito ? 'correcto' : 'incorrecto')} />"
content = content.replace(old_widget, new_widget)

# Pass color to the progress bar
old_bar = "backgroundColor: '#5B2E91'"
new_bar = "backgroundColor: color"
content = content.replace(old_bar, new_bar)

# Update the feedback sheet colors
content = content.replace("feedbackCorrecto: { backgroundColor: '#d7ffb8' },", "feedbackCorrecto: { backgroundColor: color },")
content = content.replace("textoCorrecto: { color: '#58a700' },", "textoCorrecto: { color: '#FFFFFF' },")
content = content.replace("botonFondoCorrecto: { backgroundColor: '#58a700' },", "botonFondoCorrecto: { backgroundColor: 'rgba(0,0,0,0.2)' },")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'w') as f:
    f.write(content)
